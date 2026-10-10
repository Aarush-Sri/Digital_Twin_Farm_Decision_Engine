from __future__ import annotations
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import uuid


class CropType(str, Enum):
    TOMATO = "tomato"
    CORN = "corn"
    WHEAT = "wheat"
    SOYBEAN = "soybean"
    LETTUCE = "lettuce"
    POTATO = "potato"
    CARROT = "carrot"
    COTTON = "cotton"


class GrowthStage(str, Enum):
    SEED = "seed"
    GERMINATION = "germination"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    RIPENING = "ripening"
    HARVEST_READY = "harvest_ready"
    DEAD = "dead"


class IrrigationType(str, Enum):
    NONE = "none"
    DRIP = "drip"
    SPRINKLER = "sprinkler"
    FLOOD = "flood"


class SoilState(BaseModel):
    moisture_pct: float = Field(default=60.0, ge=0.0, le=100.0, description="Volumetric soil moisture percentage (0-100%)")
    nitrogen_ppm: float = Field(default=120.0, ge=0.0, description="Available Nitrogen in ppm")
    phosphorus_ppm: float = Field(default=45.0, ge=0.0, description="Available Phosphorus in ppm")
    potassium_ppm: float = Field(default=150.0, ge=0.0, description="Available Potassium in ppm")
    ph: float = Field(default=6.5, ge=3.0, le=10.0, description="Soil pH level")
    field_capacity_pct: float = Field(default=75.0, description="Field capacity moisture percentage")
    wilting_point_pct: float = Field(default=20.0, description="Permanent wilting point moisture percentage")


class CropState(BaseModel):
    crop_type: CropType
    planted_day: int
    current_stage: GrowthStage = GrowthStage.SEED
    age_days: int = 0
    gdd_accumulated: float = 0.0
    biomass_grams: float = 5.0
    health_pct: float = Field(default=100.0, ge=0.0, le=100.0)
    water_stress_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    nutrient_stress_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    projected_yield_kg: float = 0.0


class FarmTile(BaseModel):
    x: int
    y: int
    soil: SoilState = Field(default_factory=SoilState)
    crop: Optional[CropState] = None
    irrigation_type: IrrigationType = IrrigationType.NONE
    irrigation_rate_mm_per_day: float = 0.0
    is_fallow: bool = True


class EnvironmentState(BaseModel):
    day: int = 1
    solar_radiation_wm2: float = 450.0  # Average Daily Solar Irradiance W/m²
    sunlight_hours: float = 12.0
    solar_noon_elevation_deg: float = 65.0
    cloud_cover_pct: float = 20.0
    temp_min_c: float = 16.0
    temp_max_c: float = 28.0
    temp_avg_c: float = 22.0
    rainfall_mm: float = 0.0
    humidity_pct: float = 60.0
    wind_speed_ms: float = 2.5
    et0_mm: float = 4.2  # Reference Evapotranspiration mm/day


class SimulationLogEntry(BaseModel):
    day: int
    avg_soil_moisture: float
    avg_crop_health: float
    total_biomass_kg: float
    rainfall_mm: float
    solar_radiation_wm2: float
    active_crops_count: int


class FarmWorld(BaseModel):
    farm_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Demo Farm"
    width: int = 10
    height: int = 10
    current_day: int = 1
    environment: EnvironmentState = Field(default_factory=EnvironmentState)
    tiles: List[FarmTile] = Field(default_factory=list)
    history: List[SimulationLogEntry] = Field(default_factory=list)

    def get_tile(self, x: int, y: int) -> Optional[FarmTile]:
        for tile in self.tiles:
            if tile.x == x and tile.y == y:
                return tile
        return None

    def clone(self) -> FarmWorld:
        """Deep copy farm world for sandbox simulation."""
        return FarmWorld.model_validate(self.model_dump())
