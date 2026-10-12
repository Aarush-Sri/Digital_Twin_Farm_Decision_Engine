import pytest
from app.simulation.engine import SimulationEngine
from app.simulation.models import CropType, IrrigationType
from app.orchestrator.plot_memory import FarmPlotMemory, PlotMemoryManager
from app.orchestrator.agent import AgricultureAgent
from app.orchestrator.tools import ToolExecutor, ToolCall
from app.llm.factory import RuleBasedFallbackProvider


def test_plot_memory_general_query_detection():
    memory = FarmPlotMemory("farm_test_1")
    
    # General queries should be detected and omit farm context
    assert memory.is_general_query("What is the optimal pH for strawberries?") is True
    assert memory.is_general_query("Explain evapotranspiration ET0") is True
    assert memory.is_general_query("hello there") is True
    
    # Farm specific queries should NOT be considered general
    assert memory.is_general_query("Inspect my farm plots") is False
    assert memory.is_general_query("How are the crops doing on my farm?") is False
    assert memory.is_general_query("Water tile (2,3) with drip irrigation") is False


def test_plot_memory_delta_and_caching():
    engine = SimulationEngine._create_default_world(width=5, height=5, name="Memory Test Farm")
    sim = SimulationEngine(world=engine)
    memory = FarmPlotMemory("farm_test_2")

    summary = sim.get_summary()

    # Query 1: General question -> lightweight note, no dump
    ctx1, was_full1 = memory.generate_context_prompt(summary, sim.world.tiles, "What is photosynthesis?")
    assert was_full1 is False
    assert "User query appears to be general agronomy" in ctx1

    # Query 2: Farm specific -> Full context initialized
    ctx2, was_full2 = memory.generate_context_prompt(summary, sim.world.tiles, "What crops do I have on my farm?")
    assert was_full2 is True
    assert "FARM PLOT MEMORY & CURRENT STATE" in ctx2

    # Query 3: Follow-up question with NO plot changes -> Cached compact anchor!
    ctx3, was_full3 = memory.generate_context_prompt(summary, sim.world.tiles, "Should I irrigate them?")
    assert was_full3 is False
    assert "FARM PLOT MEMORY (Cached)" in ctx3
    assert "No changes since previous turn" in ctx3

    # Now modify the farm: Plant tomatoes
    sim.plant_crop(1, 1, CropType.TOMATO)
    
    # Query 4: Farm changed -> Full delta detected and updated
    ctx4, was_full4 = memory.generate_context_prompt(sim.get_summary(), sim.world.tiles, "How is the farm now?")
    assert was_full4 is True
    assert "Planted tomato" in ctx4


def test_recall_plot_memory_tool():
    engine = SimulationEngine._create_default_world(width=5, height=5, name="Memory Tool Farm")
    sim = SimulationEngine(world=engine)
    memory = FarmPlotMemory("farm_test_3")
    executor = ToolExecutor(sim, plot_memory=memory)

    # Execute plant tool
    plant_call = ToolCall(
        id="call_1",
        name="plant_crop_batch",
        arguments={"crop_type": "carrot", "start_x": 0, "start_y": 0, "end_x": 1, "end_y": 1}
    )
    res_plant = executor.execute(plant_call)
    assert res_plant["status"] == "success"
    assert len(memory.events_log) == 1
    assert "carrot" in memory.events_log[0].description

    # Recall plot memory
    recall_call = ToolCall(
        id="call_2",
        name="recall_plot_memory",
        arguments={"limit_events": 5}
    )
    res_recall = executor.execute(recall_call)
    assert res_recall["farm_id"] == "farm_test_3"
    assert len(res_recall["recent_events"]) == 1
    assert "carrot" in res_recall["recent_events"][0]["desc"]


@pytest.mark.asyncio
async def test_agent_with_plot_memory_end_to_end():
    engine = SimulationEngine._create_default_world(width=5, height=5, name="End2End Farm")
    sim = SimulationEngine(world=engine)
    fallback_llm = RuleBasedFallbackProvider()
    
    agent = AgricultureAgent(engine=sim, llm=fallback_llm)
    
    # 1. Run general query
    resp1 = await agent.run(user_prompt="What is the optimal pH for tomato?")
    assert resp1.final_response is not None
    
    # 2. Run farm query
    resp2 = await agent.run(user_prompt="Inspect my farm plots and recommend watering")
    assert resp2.final_response is not None
    assert agent.plot_memory.full_context_sent is True
