from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from ..storage.session_store import session_store
from ..simulation.models import FarmWorld, CropType, IrrigationType, FarmTile, FarmProfile, SoilTexture

router = APIRouter(prefix="/api/v1/farm", tags=["Farm Management"])


class UpdateProfileRequest(BaseModel):
    # Location & Topography
    farm_name: Optional[str] = None
    location_name: Optional[str] = None
    country: Optional[str] = None
    latitude_deg: Optional[float] = Field(default=None, ge=-60.0, le=60.0)
    longitude_deg: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    elevation_m: Optional[float] = Field(default=None, ge=-50.0, le=4500.0)
    slope_pct: Optional[float] = Field(default=None, ge=0.0, le=35.0)

    # Climate & Atmosphere
    base_temp_c: Optional[float] = Field(default=None, ge=-10.0, le=45.0)
    diurnal_range_c: Optional[float] = Field(default=None, ge=2.0, le=25.0)
    annual_rainfall_mm: Optional[float] = Field(default=None, ge=0.0, le=3000.0)
    mean_wind_speed_ms: Optional[float] = Field(default=None, ge=0.0, le=20.0)

    # Soil Chemistry & Texture
    soil_texture: Optional[SoilTexture] = None
    organic_matter_pct: Optional[float] = Field(default=None, ge=0.2, le=20.0)
    baseline_ph: Optional[float] = Field(default=None, ge=4.0, le=9.0)
    baseline_nitrogen_ppm: Optional[float] = Field(default=None, ge=0.0)
    baseline_phosphorus_ppm: Optional[float] = Field(default=None, ge=0.0)
    baseline_potassium_ppm: Optional[float] = Field(default=None, ge=0.0)
    soil_salinity_ec_ds_m: Optional[float] = Field(default=None, ge=0.0, le=12.0)

    # Water Infrastructure
    water_source: Optional[str] = None
    storage_capacity_m3: Optional[float] = Field(default=None, ge=0.0)
    current_reserve_m3: Optional[float] = Field(default=None, ge=0.0)
    water_cost_per_m3: Optional[float] = Field(default=None, ge=0.0)

    # Farm Operations
    farming_system: Optional[str] = None
    organic_certified: Optional[bool] = None
    currency_symbol: Optional[str] = None


class CreateFarmRequest(BaseModel):
    name: str = "My Virtual Farm"
    width: int = Field(default=10, ge=2, le=50)
    height: int = Field(default=10, ge=2, le=50)


class UpdateTileRequest(BaseModel):
    x: int
    y: int
    crop_type: Optional[CropType] = None
    irrigation_type: Optional[IrrigationType] = None
    irrigation_rate_mm: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    soil_nitrogen_ppm: Optional[float] = None
    soil_phosphorus_ppm: Optional[float] = None
    soil_potassium_ppm: Optional[float] = None
    soil_ph: Optional[float] = None


class BatchPlantRequest(BaseModel):
    crop_type: CropType
    start_x: int
    start_y: int
    end_x: int
    end_y: int


class BatchIrrigationRequest(BaseModel):
    irrigation_type: IrrigationType
    rate_mm_per_day: float
    all_tiles: bool = True
    start_x: Optional[int] = None
    start_y: Optional[int] = None
    end_x: Optional[int] = None
    end_y: Optional[int] = None


@router.post("/create", response_model=Dict[str, Any])
def create_farm(req: CreateFarmRequest):
    """Creates a new farm world session with initialized grid and environment."""
    engine = session_store.get_or_create_engine(
        width=req.width,
        height=req.height,
        name=req.name,
    )
    return {
        "status": "created",
        "farm_id": engine.world.farm_id,
        "name": engine.world.name,
        "dimensions": f"{engine.world.width}x{engine.world.height}",
        "total_tiles": len(engine.world.tiles),
        "world": engine.world.model_dump(),
    }


@router.get("/list", response_model=List[Dict[str, Any]])
def list_farms():
    """Lists saved and active farms."""
    return session_store.snapshot_mgr.list_saved_farms()


@router.get("/{farm_id}", response_model=FarmWorld)
def get_farm_state(farm_id: str):
    """Retrieves full farm grid state, environmental conditions, and crop details."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")
    return engine.world


@router.get("/{farm_id}/summary", response_model=Dict[str, Any])
def get_farm_summary(farm_id: str):
    """Retrieves a summarized dashboard view of the farm."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")
    return engine.get_summary()


@router.get("/{farm_id}/profile", response_model=FarmProfile)
def get_farm_profile(farm_id: str):
    """Retrieves the universal plot profile for the given farm."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")
    return engine.world.profile


@router.put("/{farm_id}/profile", response_model=Dict[str, Any])
def update_farm_profile(farm_id: str, req: UpdateProfileRequest):
    """Updates universal farm plot parameters (location, climate, soil texture, water source)."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")

    updated = engine.update_profile(req.model_dump(exclude_unset=True, exclude_none=True))
    return {
        "status": "updated",
        "farm_id": farm_id,
        "profile": updated.model_dump(),
        "summary": engine.get_summary(),
    }


@router.post("/{farm_id}/tile/update", response_model=Dict[str, Any])
def update_tile(farm_id: str, req: UpdateTileRequest):
    """Directly modifies soil, crop, or irrigation parameters on a specific farm tile."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")

    tile = engine.world.get_tile(req.x, req.y)
    if not tile:
        raise HTTPException(status_code=400, detail=f"Tile ({req.x}, {req.y}) is out of bounds")

    if req.crop_type:
        engine.plant_crop(req.x, req.y, req.crop_type)
    if req.irrigation_type is not None and req.irrigation_rate_mm is not None:
        engine.set_irrigation(req.x, req.y, req.irrigation_type, req.irrigation_rate_mm)
    if req.soil_moisture_pct is not None:
        tile.soil.moisture_pct = req.soil_moisture_pct
    if req.soil_nitrogen_ppm is not None:
        tile.soil.nitrogen_ppm = req.soil_nitrogen_ppm
    if req.soil_phosphorus_ppm is not None:
        tile.soil.phosphorus_ppm = req.soil_phosphorus_ppm
    if req.soil_potassium_ppm is not None:
        tile.soil.potassium_ppm = req.soil_potassium_ppm
    if req.soil_ph is not None:
        tile.soil.ph = req.soil_ph

    return {"status": "updated", "tile": tile.model_dump()}


@router.post("/{farm_id}/batch/plant", response_model=Dict[str, Any])
def batch_plant(farm_id: str, req: BatchPlantRequest):
    """Plants crops across a designated rectangular area."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")

    planted_count = 0
    for x in range(req.start_x, req.end_x + 1):
        for y in range(req.start_y, req.end_y + 1):
            if engine.plant_crop(x, y, req.crop_type):
                planted_count += 1

    return {"status": "success", "planted_count": planted_count, "crop_type": req.crop_type.value}


@router.post("/{farm_id}/clear", response_model=Dict[str, Any])
def clear_farm(farm_id: str):
    """Resets all tiles on the farm to fallow ground, removing active crops and irrigation."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")

    cleared_count = 0
    for tile in engine.world.tiles:
        tile.crop = None
        tile.is_fallow = True
        tile.irrigation_type = IrrigationType.NONE
        tile.irrigation_rate_mm_per_day = 0.0
        cleared_count += 1

    return {
        "status": "cleared",
        "farm_id": farm_id,
        "cleared_tiles": cleared_count,
        "summary": engine.get_summary(),
    }


@router.post("/{farm_id}/save", response_model=Dict[str, Any])
def save_farm_snapshot(farm_id: str):
    """Persists current farm state to database and snapshot storage."""
    file_path = session_store.save_session(farm_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Farm session not found")
    return {"status": "saved", "farm_id": farm_id, "snapshot_file": file_path}
