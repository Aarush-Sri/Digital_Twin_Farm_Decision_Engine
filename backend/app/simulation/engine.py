from typing import Optional, List, Dict, Any
from .models import (
    FarmWorld,
    FarmTile,
    SoilState,
    CropState,
    CropType,
    GrowthStage,
    IrrigationType,
    EnvironmentState,
    SimulationLogEntry,
)
from .environment import EnvironmentEngine
from .crop_growth import CropGrowthEngine, CROP_DATABASE


class SimulationEngine:
    """Main Agriculture Simulation Engine managing the virtual farm world."""

    def __init__(self, world: Optional[FarmWorld] = None):
        if world is None:
            self.world = self._create_default_world(10, 10)
        else:
            self.world = world
        self.env_engine = EnvironmentEngine(latitude_deg=36.5)

    @classmethod
    def _create_default_world(cls, width: int = 10, height: int = 10, name: str = "New Farm") -> FarmWorld:
        world = FarmWorld(name=name, width=width, height=height)
        tiles = []
        for x in range(width):
            for y in range(height):
                tiles.append(
                    FarmTile(
                        x=x,
                        y=y,
                        soil=SoilState(
                            moisture_pct=65.0,
                            nitrogen_ppm=140.0,
                            phosphorus_ppm=50.0,
                            potassium_ppm=160.0,
                            ph=6.5,
                        ),
                        is_fallow=True,
                    )
                )
        world.tiles = tiles
        world.environment = EnvironmentEngine().calculate_day_environment(day=1)
        return world

    def plant_crop(self, x: int, y: int, crop_type: CropType) -> bool:
        tile = self.world.get_tile(x, y)
        if not tile:
            return False
        tile.crop = CropState(
            crop_type=crop_type,
            planted_day=self.world.current_day,
            current_stage=GrowthStage.SEED,
            health_pct=100.0,
        )
        tile.is_fallow = False
        return True

    def set_irrigation(
        self,
        x: int,
        y: int,
        irrigation_type: IrrigationType,
        rate_mm_per_day: float
    ) -> bool:
        tile = self.world.get_tile(x, y)
        if not tile:
            return False
        tile.irrigation_type = irrigation_type
        tile.irrigation_rate_mm_per_day = max(0.0, rate_mm_per_day)
        return True

    def apply_fertilizer(
        self,
        x: int,
        y: int,
        nitrogen_ppm: float = 0.0,
        phosphorus_ppm: float = 0.0,
        potassium_ppm: float = 0.0
    ) -> bool:
        tile = self.world.get_tile(x, y)
        if not tile:
            return False
        tile.soil.nitrogen_ppm += max(0.0, nitrogen_ppm)
        tile.soil.phosphorus_ppm += max(0.0, phosphorus_ppm)
        tile.soil.potassium_ppm += max(0.0, potassium_ppm)
        return True

    def harvest_crop(self, x: int, y: int) -> Optional[float]:
        tile = self.world.get_tile(x, y)
        if not tile or not tile.crop:
            return None
        harvested_yield = tile.crop.projected_yield_kg
        tile.crop = None
        tile.is_fallow = True
        return harvested_yield

    def step_day(self, weather_override: Optional[dict] = None) -> EnvironmentState:
        """Executes a 1-day simulation step across all tiles and updates environment."""
        self.world.current_day += 1
        day = self.world.current_day

        # 1. Update daily environment & sun dynamics
        env = self.env_engine.calculate_day_environment(day, weather_override=weather_override)
        self.world.environment = env

        total_moisture = 0.0
        total_health = 0.0
        total_biomass = 0.0
        active_crops = 0

        # 2. Iterate through each farm tile
        for tile in self.world.tiles:
            soil = tile.soil

            # Water balance model
            water_in_mm = env.rainfall_mm + tile.irrigation_rate_mm_per_day

            crop_kc = 0.3
            if tile.crop and tile.crop.current_stage != GrowthStage.DEAD:
                profile = CROP_DATABASE.get(tile.crop.crop_type)
                if profile:
                    crop_kc = profile.kc_stages.get(tile.crop.current_stage, 0.5)

            evapotranspiration_mm = env.et0_mm * crop_kc

            moisture_change_pct = (water_in_mm - evapotranspiration_mm) * 1.5
            new_moisture = soil.moisture_pct + moisture_change_pct

            if new_moisture > soil.field_capacity_pct:
                drainage = (new_moisture - soil.field_capacity_pct) * 0.4
                new_moisture -= drainage

            soil.moisture_pct = round(max(5.0, min(95.0, new_moisture)), 1)
            total_moisture += soil.moisture_pct

            # Crop Growth Step
            if tile.crop and tile.crop.current_stage != GrowthStage.DEAD:
                tile.crop, tile.soil = CropGrowthEngine.step_crop(tile.crop, tile.soil, env)
                total_health += tile.crop.health_pct
                total_biomass += (tile.crop.biomass_grams / 1000.0)
                active_crops += 1

        # 3. Log history entry
        tile_count = max(1, len(self.world.tiles))
        avg_moisture = round(total_moisture / tile_count, 1)
        avg_health = round(total_health / max(1, active_crops), 1) if active_crops > 0 else 100.0

        entry = SimulationLogEntry(
            day=day,
            avg_soil_moisture=avg_moisture,
            avg_crop_health=avg_health,
            total_biomass_kg=round(total_biomass, 2),
            rainfall_mm=env.rainfall_mm,
            solar_radiation_wm2=env.solar_radiation_wm2,
            active_crops_count=active_crops,
        )
        self.world.history.append(entry)
        if len(self.world.history) > 100:
            self.world.history.pop(0)

        return env

    def step_days(self, days: int, weather_override: Optional[dict] = None) -> List[SimulationLogEntry]:
        """Fast-forwards simulation by N days."""
        logs = []
        for _ in range(max(1, days)):
            self.step_day(weather_override=weather_override)
            if self.world.history:
                logs.append(self.world.history[-1])
        return logs

    def get_summary(self) -> Dict[str, Any]:
        """Returns high-level summary of farm state."""
        crops_by_type: Dict[str, int] = {}
        stage_counts: Dict[str, int] = {}
        total_projected_yield = 0.0

        for tile in self.world.tiles:
            if tile.crop:
                ctype = tile.crop.crop_type.value
                crops_by_type[ctype] = crops_by_type.get(ctype, 0) + 1
                cstage = tile.crop.current_stage.value
                stage_counts[cstage] = stage_counts.get(cstage, 0) + 1
                total_projected_yield += tile.crop.projected_yield_kg

        return {
            "farm_id": self.world.farm_id,
            "farm_name": self.world.name,
            "current_day": self.world.current_day,
            "grid_size": f"{self.world.width}x{self.world.height}",
            "total_tiles": len(self.world.tiles),
            "environment": self.world.environment.model_dump(),
            "crops_distribution": crops_by_type,
            "growth_stages": stage_counts,
            "total_projected_yield_kg": round(total_projected_yield, 2),
            "recent_history": [h.model_dump() for h in self.world.history[-5:]],
        }
