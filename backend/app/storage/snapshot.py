import os
import json
import sqlite3
from typing import Optional, List, Dict, Any
from ..simulation.models import FarmWorld
from ..config import settings


class SnapshotManager:
    """Handles persistent serialization and loading of FarmWorld states via JSON and SQLite."""

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or settings.DATA_DIR
        os.makedirs(self.data_dir, exist_ok=True)
        self.db_path = os.path.join(self.data_dir, "farms.db")
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS farm_snapshots (
                    farm_id TEXT,
                    day INTEGER,
                    name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_json TEXT,
                    PRIMARY KEY (farm_id, day)
                )
                """
            )
            conn.commit()

    def save_snapshot(self, world: FarmWorld) -> str:
        """Saves farm world state to both SQLite and JSON file."""
        world_data = world.model_dump_json()

        # 1. Save to SQLite
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO farm_snapshots (farm_id, day, name, data_json)
                VALUES (?, ?, ?, ?)
                """,
                (world.farm_id, world.current_day, world.name, world_data),
            )
            conn.commit()

        # 2. Save JSON file backup
        file_path = os.path.join(self.data_dir, f"{world.farm_id}_day{world.current_day}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(world_data)

        return file_path

    def load_snapshot(self, farm_id: str, day: Optional[int] = None) -> Optional[FarmWorld]:
        """Loads a farm snapshot by farm_id and optional day."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if day is not None:
                cursor.execute(
                    "SELECT data_json FROM farm_snapshots WHERE farm_id = ? AND day = ?",
                    (farm_id, day),
                )
            else:
                cursor.execute(
                    "SELECT data_json FROM farm_snapshots WHERE farm_id = ? ORDER BY day DESC LIMIT 1",
                    (farm_id,),
                )
            row = cursor.fetchone()
            if row:
                return FarmWorld.model_validate_json(row["data_json"])

        json_path = os.path.join(self.data_dir, f"{farm_id}_day{day or 1}.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                return FarmWorld.model_validate_json(f.read())

        return None

    def list_saved_farms(self) -> List[Dict[str, Any]]:
        """Lists all saved farm snapshots."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT farm_id, name, MAX(day) as latest_day, COUNT(*) as snapshot_count, MAX(created_at) as last_saved
                FROM farm_snapshots
                GROUP BY farm_id
                """
            )
            return [dict(row) for row in cursor.fetchall()]
