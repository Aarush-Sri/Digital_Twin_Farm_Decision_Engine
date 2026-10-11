import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
from app.llm.base import LLMMessage, ToolDefinition, ToolCall
from app.llm.ollama_provider import OllamaProvider
from app.llm.gemini_provider import GeminiProvider
from app.llm.factory import FallbackLLMManager, get_llm_provider
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


@pytest.mark.asyncio
async def test_ollama_provider_defaults_to_qwen():
    provider = OllamaProvider()
    assert provider.model == "qwen3.5"


@pytest.mark.asyncio
async def test_ollama_provider_discovers_qwen_model():
    provider = OllamaProvider(model="qwen3.5")

    # Mock response from /api/tags
    mock_tags = {
        "models": [
            {"name": "mistral:latest"},
            {"name": "qwen2.5:3b"},
            {"name": "llama3:latest"},
        ]
    }

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_tags
    mock_client.get.return_value = mock_resp

    active_model = await provider._get_active_model(mock_client)
    # Should discover and prefer qwen2.5:3b over mistral
    assert "qwen" in active_model.lower()


@pytest.mark.asyncio
async def test_ollama_provider_disables_thinking_and_strips_think_tags():
    provider = OllamaProvider(model="qwen3.5")
    provider._discovered_model = "qwen3.5"

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "message": {
                "content": "<think>Let me calculate the crop moisture balance...</think>Soil moisture is 62%.",
                "tool_calls": [],
            }
        }
        mock_client.post.return_value = mock_resp

        messages = [LLMMessage(role="user", content="Soil check")]
        res = await provider.generate_response(messages)

        # 1. Assert payload sent think=False
        sent_payload = mock_client.post.call_args[1]["json"]
        assert sent_payload.get("think") is False

        # 2. Assert <think> tags were stripped from content
        assert "<think>" not in res.content
        assert res.content == "Soil moisture is 62%."


def test_gemini_provider_configuration_and_init():
    unconfigured = GeminiProvider(api_key="")
    assert not unconfigured.is_configured()

    configured = GeminiProvider(api_key="AIzaSyFakeKey123", model="gemini-2.5-flash")
    assert configured.is_configured()
    assert configured.model == "gemini-2.5-flash"


@pytest.mark.asyncio
async def test_gemini_provider_mock_generation():
    provider = GeminiProvider(api_key="AIzaSyFakeKey123", model="gemini-2.5-flash")

    # Mock client and generate_content
    mock_client = MagicMock()
    mock_candidate = MagicMock()
    mock_part = MagicMock()
    mock_part.function_call = None
    mock_part.text = "Soil moisture is optimal at 65%."
    mock_candidate.content.parts = [mock_part]

    mock_response = MagicMock()
    mock_response.candidates = [mock_candidate]
    mock_client.models.generate_content.return_value = mock_response
    provider._client = mock_client

    import sys
    with patch.dict(sys.modules, {"google": MagicMock(), "google.genai": MagicMock()}):
        messages = [LLMMessage(role="user", content="How is the soil?")]
        res = await provider.generate_response(messages)

        assert res.provider == "gemini"
        assert "optimal" in res.content
        assert res.model == "gemini-2.5-flash"


@pytest.mark.asyncio
async def test_fallback_manager_provider_routing():
    # Test routing with preferred_provider="ollama"
    mgr_ollama = FallbackLLMManager(preferred_provider="ollama")
    assert mgr_ollama.preferred_provider == "ollama"
    assert mgr_ollama.ollama.model == "qwen3.5"

    # Test routing with preferred_provider="gemini"
    mgr_gemini = FallbackLLMManager(
        gemini_api_key="AIzaSyTestKey",
        gemini_model="gemini-2.5-flash",
        preferred_provider="gemini",
    )
    assert mgr_gemini.gemini is not None
    assert mgr_gemini.gemini.is_configured()
    assert mgr_gemini.gemini.model == "gemini-2.5-flash"


def test_api_agent_status_endpoint():
    resp = client.get("/api/v1/agent/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "gemini" in data
    assert "ollama" in data
    assert "fallback" in data
    assert data["ollama"]["default_model"] == "qwen3.5"


def test_api_agent_chat_with_provider_payload():
    create_resp = client.post("/api/v1/farm/create", json={"name": "Test LLM Farm", "width": 4, "height": 4})
    assert create_resp.status_code == 200
    farm_id = create_resp.json()["farm_id"]

    chat_resp = client.post(
        f"/api/v1/agent/{farm_id}/chat",
        json={
            "prompt": "Evaluate current plot irrigation needs",
            "preferred_provider": "auto",
            "model": "qwen3.5",
        },
    )
    assert chat_resp.status_code == 200
    res_data = chat_resp.json()
    assert "final_response" in res_data
    assert len(res_data["execution_steps"]) > 0
