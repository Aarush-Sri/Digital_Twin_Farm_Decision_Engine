import asyncio
import time
import os
import sys

# Tell pytest not to collect this standalone validation script
__test__ = False

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx
from app.llm.ollama_provider import OllamaProvider
from app.llm.base import LLMMessage
from app.orchestrator.agent import AgricultureAgent
from app.simulation.engine import SimulationEngine
from app.simulation.models import CropType, IrrigationType

PROMPTS = [
    {
        "name": "Prompt 1: Soil Moisture & Wheat Health Diagnostic",
        "text": "How is the soil moisture and what should I do for my wheat crops?",
    },
    {
        "name": "Prompt 2: 14-Day Drought What-If Scenario",
        "text": "What happens to crop yield and water stress if a 14-day drought hits with zero rainfall?",
    },
    {
        "name": "Prompt 3: Planting & Canal Layout Recommendation",
        "text": "Which crops should I plant adjacent to water canals to maximize harvest yield?",
    },
]


async def test_ollama_model(model_name: str):
    print(f"\n=======================================================")
    print(f" TESTING OLLAMA MODEL: {model_name}")
    print(f"=======================================================")
    provider = OllamaProvider(model=model_name)

    for p in PROMPTS:
        print(f"\n--- Testing: {p['name']} ---")
        print(f"User Prompt: '{p['text']}'")
        t0 = time.time()
        try:
            msgs = [
                LLMMessage(
                    role="system",
                    content="You are DigiFarm's senior agronomist AI. Provide expert agronomic recommendations.",
                ),
                LLMMessage(role="user", content=p["text"]),
            ]
            resp = await provider.generate_response(msgs)
            elapsed = time.time() - t0
            content = resp.content or ""
            has_think_tags = "<think>" in content or "</think>" in content
            is_valid = len(content.strip()) > 30 and not has_think_tags

            print(f"Status: {'VALID' if is_valid else 'INVALID'}")
            print(f"Latency: {elapsed:.2f}s")
            print(f"Thinking tags present: {has_think_tags}")
            print(f"Resolved Model: {resp.model}")
            print(f"Sample Output ({len(content)} chars):\n{content[:250]}...\n")
        except Exception as e:
            print(f"FAILED with error: {e}")


def test_agent_with_simulated_world(model_name: str):
    print(f"\n=======================================================")
    print(f" TESTING FULL AGENT PIPELINE: {model_name}")
    print(f"=======================================================")
    engine = SimulationEngine()
    # Setup some wheat crops and water
    engine.plant_crop(0, 0, CropType.WHEAT)
    engine.plant_crop(0, 1, CropType.WHEAT)
    engine.set_irrigation(0, 0, IrrigationType.DRIP, 4.0)

    agent = AgricultureAgent(engine=engine, llm=OllamaProvider(model=model_name))
    
    t0 = time.time()
    resp = asyncio.run(agent.run("Diagnose current wheat crops and check irrigation needs."))
    elapsed = time.time() - t0

    print(f"Latency: {elapsed:.2f}s")
    print(f"Provider Used: {resp.provider_used}")
    print(f"Model Used: {resp.model_used}")
    print(f"Execution Steps: {len(resp.execution_steps)}")
    print(f"Final Response Sample:\n{resp.final_response[:300]}...\n")


if __name__ == "__main__":
    print("Starting Model Validation Suite...")
    # 1. Test Llama 3.2:1b across all 3 prompts
    asyncio.run(test_ollama_model("llama3.2:1b"))

    # 2. Test Qwen 3.5 across all 3 prompts
    asyncio.run(test_ollama_model("qwen3.5:latest"))

    # 3. Test Full Pipeline
    test_agent_with_simulated_world("llama3.2:1b")
