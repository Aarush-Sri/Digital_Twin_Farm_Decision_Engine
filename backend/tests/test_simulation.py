import pytest
from app.simulation.models import CropType, GrowthStage, IrrigationType
from app.simulation.engine import SimulationEngine
from app.simulation.environment import EnvironmentEngine


def test_default_farm_creation():
    engine = SimulationEngine._create_default_world(width=5, height=5, name="Test Farm")
    assert engine.width == 5
    assert engine.height == 5
    assert len(engine.tiles) == 25
    assert engine.current_day == 1
    assert engine.environment.sunlight_hours > 0


def test_plant_and_step_crop_growth():
    engine = SimulationEngine()
    # Plant tomato at (0, 0)
    assert engine.plant_crop(0, 0, CropType.TOMATO)
    tile = engine.world.get_tile(0, 0)
    assert tile is not None
    assert tile.crop is not None
    assert tile.crop.crop_type == CropType.TOMATO
    assert tile.crop.current_stage == GrowthStage.SEED

    # Advance 15 days with adequate irrigation
    engine.set_irrigation(0, 0, IrrigationType.DRIP, rate_mm_per_day=5.0)
    logs = engine.step_days(15)

    assert len(logs) == 15
    assert engine.world.current_day == 16
    assert tile.crop.gdd_accumulated > 0
    assert tile.crop.age_days == 15
    assert tile.crop.biomass_grams > 5.0
    # Stage should advance beyond seed
    assert tile.crop.current_stage in [GrowthStage.GERMINATION, GrowthStage.VEGETATIVE]


def test_environment_solar_and_temperature():
    env_engine = EnvironmentEngine(latitude_deg=35.0, seed=123)
    env_day1 = env_engine.calculate_day_environment(day=1)
    env_day180 = env_engine.calculate_day_environment(day=180)

    # Solar radiation and sun hours are positive and physically reasonable
    assert 5.0 <= env_day1.sunlight_hours <= 18.0
    assert env_day1.solar_radiation_wm2 > 50.0
    assert env_day1.et0_mm > 0.5
    assert env_day180.sunlight_hours > 10.0


def test_soil_moisture_water_stress():
    engine = SimulationEngine()
    engine.plant_crop(0, 0, CropType.CORN)
    tile = engine.world.get_tile(0, 0)
    # Drain moisture to simulate drought
    tile.soil.moisture_pct = 15.0  # Below wilting point

    engine.step_day(weather_override={"rainfall_mm": 0.0, "et0_mm": 5.0})
    assert tile.crop.water_stress_pct > 80.0
