import threading
from typing import Dict, Optional, List
from ..simulation.engine import SimulationEngine
from ..simulation.models import FarmWorld
from .snapshot import SnapshotManager


class SessionStore:
    """Thread-safe in-memory session manager for active farm simulations."""

    def __init__(self):
        self._sessions: Dict[str, SimulationEngine] = {}
        self._lock = threading.Lock()
        self.snapshot_mgr = SnapshotManager()

    def get_or_create_engine(
        self,
        farm_id: Optional[str] = None,
        width: int = 10,
        height: int = 10,
        name: str = "My Farm"
    ) -> SimulationEngine:
        with self._lock:
            if farm_id and farm_id in self._sessions:
                return self._sessions[farm_id]

            if farm_id:
                loaded_world = self.snapshot_mgr.load_snapshot(farm_id)
                if loaded_world:
                    engine = SimulationEngine(world=loaded_world)
                    self._sessions[farm_id] = engine
                    return engine

            world = SimulationEngine._create_default_world(width=width, height=height, name=name)
            if farm_id:
                world.farm_id = farm_id
            engine = SimulationEngine(world=world)
            self._sessions[world.farm_id] = engine
            return engine

    def get_engine(self, farm_id: str) -> Optional[SimulationEngine]:
        with self._lock:
            if farm_id in self._sessions:
                return self._sessions[farm_id]
            loaded_world = self.snapshot_mgr.load_snapshot(farm_id)
            if loaded_world:
                engine = SimulationEngine(world=loaded_world)
                self._sessions[farm_id] = engine
                return engine
            return None

    def save_session(self, farm_id: str) -> Optional[str]:
        engine = self.get_engine(farm_id)
        if not engine:
            return None
        return self.snapshot_mgr.save_snapshot(engine.world)

    def list_active_farms(self) -> List[str]:
        with self._lock:
            return list(self._sessions.keys())


session_store = SessionStore()
