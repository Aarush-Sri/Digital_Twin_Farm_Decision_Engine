import { calculateZIndex, getItemDefinition } from '../types/farm';
import { DEFAULT_PRESET_FARM, PRESET_FARMS } from '../types/presetFarm';

export const getInitialFarmItems = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('greentwin_farm_items') || localStorage.getItem('digifarm_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load saved farm items from localStorage:', e);
    }
  }
  return DEFAULT_PRESET_FARM;
};

export const INITIAL_STATE = {
  // Canvas State: Preset Farm pre-loaded by default
  items: DEFAULT_PRESET_FARM,
  selectedId: null,
  snapToGrid: true,
  nextZIndex: DEFAULT_PRESET_FARM.length + 1,

  // Backend Connection & Engine State
  backendStatus: 'connecting', // 'connecting' | 'connected' | 'offline' | 'error'
  backendError: null,
  isSyncing: false,
  farmId: null,
  farmName: 'GreenTwin Model Farm',
  currentDay: 1,
  environment: {
    day: 1,
    solar_radiation_wm2: 450.0,
    sunlight_hours: 12.0,
    solar_noon_elevation_deg: 65.0,
    cloud_cover_pct: 20.0,
    temp_min_c: 16.0,
    temp_max_c: 28.0,
    temp_avg_c: 22.0,
    rainfall_mm: 0.0,
    humidity_pct: 60.0,
    wind_speed_ms: 2.5,
    et0_mm: 4.2,
  },
  farmSummary: {
    crops_distribution: {},
    growth_stages: {},
    total_projected_yield_kg: 0.0,
    total_tiles: 100,
    recent_history: [],
  },
  farmProfile: {
    // 1. Location & Topography
    farm_name: 'GreenTwin Model Farm',
    location_name: 'Salinas Valley, CA',
    country: 'United States',
    latitude_deg: 36.5,
    longitude_deg: -121.65,
    elevation_m: 25.0,
    slope_pct: 1.5,

    // 2. Climate & Atmosphere
    base_temp_c: 22.0,
    diurnal_range_c: 12.0,
    annual_rainfall_mm: 550.0,
    mean_wind_speed_ms: 2.5,

    // 3. Soil & Subsurface Chemistry
    soil_texture: 'loam',
    organic_matter_pct: 3.2,
    baseline_ph: 6.5,
    baseline_nitrogen_ppm: 140.0,
    baseline_phosphorus_ppm: 45.0,
    baseline_potassium_ppm: 160.0,
    soil_salinity_ec_ds_m: 0.8,

    // 4. Water Infrastructure
    water_source: 'Groundwater Well',
    storage_capacity_m3: 500.0,
    current_reserve_m3: 420.0,
    water_cost_per_m3: 0.85,

    // 5. Operations
    farming_system: 'regenerative',
    organic_certified: true,
    currency_symbol: '$',
  },
  tiles: [],
  simulationLogs: [],
};

export const ACTION_TYPES = {
  // Canvas Local
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_POSITION: 'UPDATE_POSITION',
  UPDATE_DIMENSIONS: 'UPDATE_DIMENSIONS',
  SELECT_ITEM: 'SELECT_ITEM',
  DESELECT_ALL: 'DESELECT_ALL',
  DELETE_ITEM: 'DELETE_ITEM',
  CLEAR_CANVAS: 'CLEAR_CANVAS',
  TOGGLE_SNAP: 'TOGGLE_SNAP',
  BRING_TO_FRONT: 'BRING_TO_FRONT',
  LOAD_SAVED_ITEMS: 'LOAD_SAVED_ITEMS',
  LOAD_PRESET_FARM: 'LOAD_PRESET_FARM',

  // Backend & Simulation Actions
  SET_BACKEND_STATUS: 'SET_BACKEND_STATUS',
  SET_FARM_DATA: 'SET_FARM_DATA',
  SET_FARM_PROFILE: 'SET_FARM_PROFILE',
  SET_SYNCING: 'SET_SYNCING',
  STEP_SIMULATION_SUCCESS: 'STEP_SIMULATION_SUCCESS',
  UPDATE_ENVIRONMENT: 'UPDATE_ENVIRONMENT',
};

export const farmReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_ITEM: {
      const { item } = action.payload;
      const subIndex = state.nextZIndex;
      const zIndex = item.zIndex || calculateZIndex(item.type, subIndex);

      const newItem = {
        ...item,
        zIndex,
        subIndex,
      };

      return {
        ...state,
        items: [...state.items, newItem],
        selectedId: newItem.id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case ACTION_TYPES.UPDATE_POSITION: {
      const { id, x, y } = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, x: Math.max(0, x), y: Math.max(0, y) } : item
        ),
      };
    }

    case ACTION_TYPES.UPDATE_DIMENSIONS: {
      // Support both { id, width, height, x, y } and { payload: { id, ... } }
      const p = action.payload || {};
      const id = typeof p.id === 'object' && p.id !== null ? p.id.id : p.id;
      const rawW = p.width ?? (typeof p.id === 'object' ? p.id.width : undefined);
      const rawH = p.height ?? (typeof p.id === 'object' ? p.id.height : undefined);
      const rawX = p.x ?? (typeof p.id === 'object' ? p.id.x : undefined);
      const rawY = p.y ?? (typeof p.id === 'object' ? p.id.y : undefined);

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          const itemDef = getItemDefinition(item.type);
          const minW = item.minWidth || itemDef.minWidth || 12;
          const minH = item.minHeight || itemDef.minHeight || 12;

          const updated = {
            ...item,
            width: rawW !== undefined ? Math.max(minW, Math.round(rawW)) : item.width,
            height: rawH !== undefined ? Math.max(minH, Math.round(rawH)) : item.height,
          };

          if (rawX !== undefined) updated.x = Math.max(0, Math.round(rawX));
          if (rawY !== undefined) updated.y = Math.max(0, Math.round(rawY));
          return updated;
        }),
      };
    }

    case ACTION_TYPES.SELECT_ITEM: {
      const { id } = action.payload;
      return {
        ...state,
        selectedId: id,
      };
    }

    case ACTION_TYPES.DESELECT_ALL: {
      return {
        ...state,
        selectedId: null,
      };
    }

    case ACTION_TYPES.DELETE_ITEM: {
      const { id } = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }

    case ACTION_TYPES.CLEAR_CANVAS: {
      return {
        ...state,
        items: [],
        selectedId: null,
      };
    }

    case ACTION_TYPES.LOAD_SAVED_ITEMS: {
      const { items } = action.payload;
      return {
        ...state,
        items: items || [],
        selectedId: null,
      };
    }

    case ACTION_TYPES.LOAD_PRESET_FARM: {
      const presetItems = action.payload?.items || DEFAULT_PRESET_FARM;
      return {
        ...state,
        items: presetItems,
        selectedId: null,
        nextZIndex: presetItems.length + 1,
      };
    }

    case ACTION_TYPES.TOGGLE_SNAP: {
      return {
        ...state,
        snapToGrid: !state.snapToGrid,
      };
    }

    case ACTION_TYPES.BRING_TO_FRONT: {
      const { id } = action.payload;
      const nextSubIndex = state.nextZIndex + 1;

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          const newZIndex = calculateZIndex(item.type, nextSubIndex);
          return { ...item, zIndex: newZIndex, subIndex: nextSubIndex };
        }),
        nextZIndex: nextSubIndex,
      };
    }

    // Backend Connection Actions
    case ACTION_TYPES.SET_BACKEND_STATUS: {
      const { status, error } = action.payload;
      return {
        ...state,
        backendStatus: status,
        backendError: error || null,
      };
    }

    case ACTION_TYPES.SET_FARM_DATA: {
      const { farmId, farmName, world, summary } = action.payload;
      return {
        ...state,
        farmId: farmId || state.farmId,
        farmName: farmName || (world?.name || state.farmName),
        farmProfile: world?.profile ? { ...state.farmProfile, ...world.profile } : state.farmProfile,
        currentDay: world?.current_day ?? state.currentDay,
        environment: world?.environment || state.environment,
        tiles: world?.tiles || state.tiles,
        simulationLogs: world?.history || state.simulationLogs,
        farmSummary: summary || state.farmSummary,
        backendStatus: 'connected',
        backendError: null,
      };
    }

    case ACTION_TYPES.SET_FARM_PROFILE: {
      const { profile, summary, environment } = action.payload;
      return {
        ...state,
        farmProfile: {
          ...state.farmProfile,
          ...profile,
        },
        farmName: profile?.farm_name || state.farmName,
        farmSummary: summary || state.farmSummary,
        environment: environment || state.environment,
      };
    }

    case ACTION_TYPES.SET_SYNCING: {
      return {
        ...state,
        isSyncing: action.payload.isSyncing,
      };
    }

    case ACTION_TYPES.STEP_SIMULATION_SUCCESS: {
      const { currentDay, environment, summary, latestLog } = action.payload;
      const updatedLogs = latestLog && Object.keys(latestLog).length > 0
        ? [...state.simulationLogs, latestLog]
        : state.simulationLogs;

      return {
        ...state,
        currentDay: currentDay ?? state.currentDay,
        environment: environment || state.environment,
        farmSummary: summary || state.farmSummary,
        simulationLogs: updatedLogs,
      };
    }

    case ACTION_TYPES.UPDATE_ENVIRONMENT: {
      return {
        ...state,
        environment: {
          ...state.environment,
          ...action.payload.environment,
        },
      };
    }

    default:
      return state;
  }
};
