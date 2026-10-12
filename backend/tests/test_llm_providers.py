import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
from app.llm.base import LLMMessage, ToolDefinition, ToolCall
from app.llm.ollama_provider import OllamaProvider
from app.llm.gemini_provider import GeminiProvider
from app.llm.factory import FallbackLLMManager, get_llm_provider
from app.config import settings
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


@pytest.mark.asyncio
async def test_ollama_provider_defaults_to_qwen():
    provider = OllamaProvider()
    assert provider.model in ["llama3.2:1b", "qwen3.5", settings.OLLAMA_MODEL]


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

    configured = GeminiProvider(api_key="AIzaSyFakeKey123", model="gemini-3.7-flash")
    assert configured.is_configured()
    assert configured.model == "gemini-3.7-flash"


@pytest.mark.asyncio
async def test_gemini_provider_mock_generation():
    provider = GeminiProvider(api_key="AIzaSyFakeKey123", model="gemini-3.7-flash")

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

    messages = [LLMMessage(role="user", content="How is the soil?")]
    res = await provider.generate_response(messages)

    assert res.provider == "gemini"
    assert "optimal" in res.content
    assert res.model == "gemini-3.7-flash"


@pytest.mark.asyncio
async def test_gemini_different_models_verification():
    """Tests verify_connection across different Gemini models (3.7-flash, flash-latest, 3.5-flash)."""
    different_models = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
    
    for mod in different_models:
        provider = GeminiProvider(api_key="AIzaSyFakeKey123", model=mod)
        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = "OK"
        mock_client.models.generate_content.return_value = mock_resp
        provider._client = mock_client

        result = await provider.verify_connection(model=mod)
        assert result["valid"] is True
        assert result["model"] == mod
        assert "Successfully connected" in result["message"]
        assert mock_client.models.generate_content.call_args[1]["model"] == mod


@pytest.mark.asyncio
async def test_gemini_test_multiple_models():
    """Tests test_multiple_models testing across all candidate models."""
    provider = GeminiProvider(api_key="AIzaSyFakeKey123", model="gemini-3.7-flash")
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "OK"
    mock_client.models.generate_content.return_value = mock_resp
    provider._client = mock_client

    results = await provider.test_multiple_models(["gemini-3.7-flash", "gemini-flash-latest"])
    assert len(results) == 2
    assert results[0]["model"] == "gemini-3.7-flash"
    assert results[0]["valid"] is True
    assert results[1]["model"] == "gemini-flash-latest"
    assert results[1]["valid"] is True


@pytest.mark.asyncio
async def test_gemini_fail_fast_on_401():
    """Tests that GeminiProvider raises ValueError immediately on 401 without looping endlessly."""
    provider = GeminiProvider(api_key="AIzaSyInvalidKey", model="gemini-2.0-flash")
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("401 UNAUTHENTICATED: ACCESS_TOKEN_TYPE_UNSUPPORTED")
    provider._client = mock_client

    messages = [LLMMessage(role="user", content="Test prompt")]
    with pytest.raises(ValueError) as excinfo:
        await provider.generate_response(messages)

    assert "Invalid Gemini API Key" in str(excinfo.value)
    # Should have called generate_content exactly once (fail fast!)
    assert mock_client.models.generate_content.call_count == 1


@pytest.mark.asyncio
async def test_fallback_manager_provider_routing():
    # Test routing with preferred_provider="ollama"
    mgr_ollama = FallbackLLMManager(preferred_provider="ollama")
    assert mgr_ollama.preferred_provider == "ollama"
    assert mgr_ollama.ollama.model in ["llama3.2:1b", "qwen3.5", settings.OLLAMA_MODEL]

    # Test routing with preferred_provider="gemini"
    mgr_gemini = FallbackLLMManager(
        gemini_api_key="AIzaSyTestKey",
        gemini_model="gemini-2.5-flash",
        preferred_provider="gemini",
    )
    assert mgr_gemini.gemini is not None
    assert mgr_gemini.gemini.is_configured()
    assert mgr_gemini.gemini.model == "gemini-2.5-flash"


    # Test routing with preferred_provider="openai"
    mgr_openai = FallbackLLMManager(
        openai_api_key="sk-test-fakekey123",
        openai_model="gpt-4o-mini",
        preferred_provider="openai",
    )
    assert mgr_openai.openai is not None
    assert mgr_openai.openai.is_configured()
    assert mgr_openai.openai.model == "gpt-4o-mini"


def test_openai_provider_configuration_and_init():
    from app.llm.openai_provider import OpenAIProvider
    unconfigured = OpenAIProvider(api_key="")
    assert not unconfigured.is_configured()

    configured = OpenAIProvider(api_key="sk-testkey-12345", model="gpt-4o")
    assert configured.is_configured()
    assert configured.model == "gpt-4o"


def test_api_agent_status_endpoint():
    resp = client.get("/api/v1/agent/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "openai" in data
    assert "gemini" in data
    assert "ollama" in data
    assert "fallback" in data
    assert "supported_models" in data["gemini"]
    assert "gemini-3.7-flash" in data["gemini"]["supported_models"]
    assert data["ollama"]["default_model"] in ["qwen3.5", "llama3.2:1b", settings.OLLAMA_MODEL]


def test_api_verify_gemini_endpoint():
    """Tests POST /api/v1/agent/verify-gemini endpoint for single and multiple model checks."""
    with patch("app.llm.gemini_provider.GeminiProvider.verify_connection") as mock_verify:
        mock_verify.return_value = {
            "valid": True,
            "model": "gemini-2.0-flash",
            "latency_ms": 150,
            "message": "Successfully connected to Google Gemini (gemini-2.0-flash) in 150ms.",
            "supported_models": settings.SUPPORTED_GEMINI_MODELS,
        }

        # 1. Single model check
        resp = client.post(
            "/api/v1/agent/verify-gemini",
            json={"api_key": "AIzaSyTestKey", "model": "gemini-2.0-flash"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["model"] == "gemini-2.0-flash"

    # 2. Test different models check (test_all_models=True)
    with patch("app.llm.gemini_provider.GeminiProvider.test_multiple_models") as mock_test_multi:
        mock_test_multi.return_value = [
            {"valid": True, "model": "gemini-2.0-flash", "latency_ms": 120},
            {"valid": True, "model": "gemini-1.5-flash", "latency_ms": 110},
            {"valid": True, "model": "gemini-1.5-pro", "latency_ms": 250},
        ]
        resp_all = client.post(
            "/api/v1/agent/verify-gemini",
            json={"api_key": "AIzaSyTestKey", "test_all_models": True},
        )
        assert resp_all.status_code == 200
        data_all = resp_all.json()
        assert data_all["valid"] is True
        assert len(data_all["results"]) == 3


def test_api_agent_chat_with_provider_payload():
    create_resp = client.post("/api/v1/farm/create", json={"name": "Test LLM Farm", "width": 4, "height": 4})
    assert create_resp.status_code == 200
    farm_id = create_resp.json()["farm_id"]

    chat_resp = client.post(
        f"/api/v1/agent/{farm_id}/chat",
        json={
            "prompt": "Evaluate current plot irrigation needs",
            "preferred_provider": "fallback",
            "model": "agronomist-rule-v2",
        },
    )
    assert chat_resp.status_code == 200
    res_data = chat_resp.json()
    assert "final_response" in res_data
    assert len(res_data["execution_steps"]) > 0
