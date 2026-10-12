import math
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
    FarmProfile,
    SoilTexture,
    SOIL_TEXTURE_HYDROLOGY,
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
        prof = self.world.profile if hasattr(self.world, "profile") and self.world.profile else FarmProfile()
        self.env_engine = EnvironmentEngine(
            latitude_deg=prof.latitude_deg,
            elevation_m=prof.elevation_m,
            base_temp_c=prof.base_temp_c,
            diurnal_range_c=prof.diurnal_range_c,
            mean_wind_speed_ms=prof.mean_wind_speed_ms,
        )

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

    def update_profile(self, profile_data: Dict[str, Any] | FarmProfile) -> FarmProfile:
        """Updates the farm universal profile and recalibrates environmental and soil engines."""
        if isinstance(profile_data, dict):
            current = self.world.profile.model_dump()
            for k, v in profile_data.items():
                if v is not None:
                    current[k] = v
            self.world.profile = FarmProfile.model_validate(current)
        elif isinstance(profile_data, FarmProfile):
            self.world.profile = profile_data

        # Synchronize farm name
        self.world.name = self.world.profile.farm_name

        # Recalibrate environment engine
        self.env_engine.latitude_deg = self.world.profile.latitude_deg
        self.env_engine.latitude_rad = math.radians(self.world.profile.latitude_deg)
        self.env_engine.elevation_m = self.world.profile.elevation_m
        self.env_engine.base_temp_c = self.world.profile.base_temp_c
        self.env_engine.diurnal_range_c = self.world.profile.diurnal_range_c
        self.env_engine.mean_wind_speed_ms = self.world.profile.mean_wind_speed_ms

        # Sync soil hydrological properties based on chosen soil texture & organic matter
        hydro = SOIL_TEXTURE_HYDROLOGY.get(self.world.profile.soil_texture)
        if hydro:
            om_bonus = max(0.0, (self.world.profile.organic_matter_pct - 2.0) * 0.5)
            fc = round(min(90.0, hydro["field_capacity_pct"] + om_bonus), 1)
            wp = hydro["wilting_point_pct"]
            for tile in self.world.tiles:
                tile.soil.field_capacity_pct = fc
                tile.soil.wilting_point_pct = wp
                if tile.is_fallow:
                    tile.soil.ph = self.world.profile.baseline_ph
                    tile.soil.nitrogen_ppm = self.world.profile.baseline_nitrogen_ppm
                    tile.soil.phosphorus_ppm = self.world.profile.baseline_phosphorus_ppm
                    tile.soil.potassium_ppm = self.world.profile.baseline_potassium_ppm

        # Recalculate day environment with new latitude
        self.world.environment = self.env_engine.calculate_day_environment(
            self.world.current_day,
            weather_override={"temp_avg_c": self.world.profile.base_temp_c} if self.world.current_day == 1 else None
        )

        return self.world.profile

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

    def sync_from_frontend(
        self,
        items: List[Dict[str, Any]],
        farm_settings: Optional[Dict[str, Any]] = None,
        farm_profile: Optional[Dict[str, Any]] = None,
        environment: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Atomically synchronizes complete 2D canvas layout, environment, and settings from frontend."""
        # 1. Update Profile & Settings if provided
        if farm_profile:
            self.update_profile(farm_profile)

        if farm_settings and isinstance(farm_settings, dict):
            if farm_settings.get("name"):
                self.world.name = farm_settings["name"]
            self.world.canvas_settings = farm_settings

        # 2. Determine required grid dimensions to prevent edge clipping (scale: 40px = 1m = 1 tile)
        max_x_needed = 10
        max_y_needed = 10
        for it in items:
            px_x = it.get("x", 0)
            px_w = it.get("width", 40)
            px_y = it.get("y", 0)
            px_h = it.get("height", 40)
            tile_right = int(math.ceil((px_x + px_w) / 40.0))
            tile_bottom = int(math.ceil((px_y + px_h) / 40.0))
            if tile_right > max_x_needed:
                max_x_needed = tile_right
            if tile_bottom > max_y_needed:
                max_y_needed = tile_bottom

        new_width = max(10, min(50, max_x_needed))
        new_height = max(10, min(50, max_y_needed))

        # Re-grid if dimensions changed
        if new_width != self.world.width or new_height != self.world.height or len(self.world.tiles) != new_width * new_height:
            tile_map = {(t.x, t.y): t for t in self.world.tiles}
            new_tiles = []
            for x in range(new_width):
                for y in range(new_height):
                    if (x, y) in tile_map:
                        t = tile_map[(x, y)]
                        t.crop = None
                        t.is_fallow = True
                        t.irrigation_type = IrrigationType.NONE
                        t.irrigation_rate_mm_per_day = 0.0
                        new_tiles.append(t)
                    else:
                        new_tiles.append(
                            FarmTile(
                                x=x,
                                y=y,
                                soil=SoilState(
                                    moisture_pct=65.0,
                                    nitrogen_ppm=self.world.profile.baseline_nitrogen_ppm,
                                    phosphorus_ppm=self.world.profile.baseline_phosphorus_ppm,
                                    potassium_ppm=self.world.profile.baseline_potassium_ppm,
                                    ph=self.world.profile.baseline_ph,
                                ),
                                is_fallow=True,
                            )
                        )
            self.world.width = new_width
            self.world.height = new_height
            self.world.tiles = new_tiles
        else:
            # Reset existing tiles to fallow baseline before applying fresh canvas items
            for tile in self.world.tiles:
                tile.crop = None
                tile.is_fallow = True
                tile.irrigation_type = IrrigationType.NONE
                tile.irrigation_rate_mm_per_day = 0.0

        # Mapping dictionary from frontend types to CropType enums
        crop_type_map = {
            "wheat": CropType.WHEAT,
            "carrot": CropType.CARROT,
            "tomato": CropType.TOMATO,
            "corn": CropType.CORN,
            "soybean": CropType.SOYBEAN,
            "lettuce": CropType.LETTUCE,
            "potato": CropType.POTATO,
            "cotton": CropType.COTTON,
            "paddy": CropType.PADDY,
            "sugarcane": CropType.SUGARCANE,
            "banana": CropType.BANANA,
            "pumpkin": CropType.PUMPKIN,
            "strawberry": CropType.STRAWBERRY,
            "tree": CropType.TREE,
            "neem_tree": CropType.NEEM_TREE,
            "mango_tree": CropType.MANGO_TREE,
            "coconut_tree": CropType.COCONUT_TREE,
        }

        # 3. Populate tiles from items
        for it in items:
            raw_type = str(it.get("type", "")).lower()
            px_x = it.get("x", 0)
            px_y = it.get("y", 0)
            px_w = it.get("width", 40)
            px_h = it.get("height", 40)

            start_x = max(0, int(px_x / 40.0))
            start_y = max(0, int(px_y / 40.0))
            end_x = min(self.world.width - 1, max(start_x, int((px_x + px_w - 1) / 40.0)))
            end_y = min(self.world.height - 1, max(start_y, int((px_y + px_h - 1) / 40.0)))

            if raw_type in crop_type_map:
                ctype = crop_type_map[raw_type]
                for x in range(start_x, end_x + 1):
                    for y in range(start_y, end_y + 1):
                        self.plant_crop(x, y, ctype)
                        t = self.world.get_tile(x, y)
                        if t and t.crop:
                            if "tree" in ctype.value:
                                t.crop.current_stage = GrowthStage.VEGETATIVE
                                t.crop.biomass_grams = 4000.0
                                t.crop.projected_yield_kg = 20.0
                            else:
                                t.crop.current_stage = GrowthStage.VEGETATIVE
                                t.crop.biomass_grams = 50.0
                                t.crop.projected_yield_kg = 4.2
            elif raw_type in ["water", "pond", "well", "sprinkler", "pipe"]:
                is_sprinkler = raw_type == "sprinkler"
                is_pipe = raw_type == "pipe"
                irr_type = IrrigationType.SPRINKLER if is_sprinkler else IrrigationType.DRIP
                irr_rate = 10.0 if is_sprinkler else (5.0 if is_pipe else 8.0)

                for x in range(start_x, end_x + 1):
                    for y in range(start_y, end_y + 1):
                        self.set_irrigation(x, y, irr_type, irr_rate)
                        t = self.world.get_tile(x, y)
                        if t:
                            t.soil.moisture_pct = min(92.0, max(t.soil.moisture_pct, 75.0))

        # Store persistent 2D layout items
        self.world.canvas_items = items

        return self.get_summary()

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
            "profile": self.world.profile.model_dump(),
            "current_day": self.world.current_day,
            "grid_size": f"{self.world.width}x{self.world.height}",
            "total_tiles": len(self.world.tiles),
            "environment": self.world.environment.model_dump(),
            "crops_distribution": crops_by_type,
            "growth_stages": stage_counts,
            "total_projected_yield_kg": round(total_projected_yield, 2),
            "canvas_items_count": len(self.world.canvas_items),
            "recent_history": [h.model_dump() for h in self.world.history[-5:]],
        }
