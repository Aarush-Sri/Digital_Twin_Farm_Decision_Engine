"""API Package."""
from .routes_farm import router as farm_router
from .routes_simulation import router as simulation_router
from .routes_agent import router as agent_router

__all__ = ["farm_router", "simulation_router", "agent_router"]
