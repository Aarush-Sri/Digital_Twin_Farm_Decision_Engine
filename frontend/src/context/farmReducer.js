import { calculateZIndex, getItemDefinition } from '../types/farm';

export const INITIAL_STATE = {
  // Canvas State
  items: [],
  selectedId: null,
  snapToGrid: true,
  nextZIndex: 1,
  zoom: 1.0, // 0.5 to 2.0 (50% to 200%)

  // History stack for Undo / Redo
  past: [],
  future: [],

  // Farm Real-World Dimensions & Settings
  farmSettings: {
    name: 'Greenfield Valley Digital Twin',
    location: 'Zone 6b • Greenfield Valley',
    totalSize: 2.5, // 2.5 Acres
    unit: 'acres', // 'acres' | 'hectares'
    boundaryWidthM: 100, // 100m
    boundaryHeightM: 100, // 100m
  },

  // Backend Connection & Engine State
  backendStatus: 'connecting', // 'connecting' | 'connected' | 'offline' | 'error'
  backendError: null,
  isSyncing: false,
  farmId: null,
  farmName: 'Greenfield Valley Digital Twin',
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
  tiles: [],
  simulationLogs: [],
};

export const ACTION_TYPES = {
  // Canvas Local
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_POSITION: 'UPDATE_POSITION',
  UPDATE_DIMENSIONS: 'UPDATE_DIMENSIONS',
  UPDATE_ITEM_PROPERTIES: 'UPDATE_ITEM_PROPERTIES',
  SELECT_ITEM: 'SELECT_ITEM',
  DESELECT_ALL: 'DESELECT_ALL',
  DELETE_ITEM: 'DELETE_ITEM',
  DUPLICATE_ITEM: 'DUPLICATE_ITEM',
  CLEAR_CANVAS: 'CLEAR_CANVAS',
  TOGGLE_SNAP: 'TOGGLE_SNAP',
  BRING_TO_FRONT: 'BRING_TO_FRONT',
  LOAD_SAVED_ITEMS: 'LOAD_SAVED_ITEMS',

  // History Actions
  UNDO: 'UNDO',
  REDO: 'REDO',

  // Zoom & Settings Actions
  SET_ZOOM: 'SET_ZOOM',
  SET_FARM_SETTINGS: 'SET_FARM_SETTINGS',

  // Backend & Simulation Actions
  SET_BACKEND_STATUS: 'SET_BACKEND_STATUS',
  SET_FARM_DATA: 'SET_FARM_DATA',
  SET_SYNCING: 'SET_SYNCING',
  STEP_SIMULATION_SUCCESS: 'STEP_SIMULATION_SUCCESS',
  UPDATE_ENVIRONMENT: 'UPDATE_ENVIRONMENT',
};

const pushHistory = (state) => {
  const past = state.past || [];
  return {
    past: [...past.slice(Math.max(0, past.length - 29)), state.items],
    future: [],
  };
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

      const history = pushHistory(state);

      return {
        ...state,
        ...history,
        items: [...state.items, newItem],
        selectedId: newItem.id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case ACTION_TYPES.UPDATE_POSITION: {
      const { id, x, y } = action.payload;
      // Find if position actually changed to avoid spurious history
      const existing = state.items.find((item) => item.id === id);
      const newX = Math.max(0, x);
      const newY = Math.max(0, y);
      if (existing && existing.x === newX && existing.y === newY) {
        return state;
      }

      const history = pushHistory(state);

      return {
        ...state,
        ...history,
        items: state.items.map((item) =>
          item.id === id ? { ...item, x: newX, y: newY } : item
        ),
      };
    }

    case ACTION_TYPES.UPDATE_DIMENSIONS: {
      const p = action.payload || {};
      const id = typeof p.id === 'object' && p.id !== null ? p.id.id : p.id;
      const rawW = p.width ?? (typeof p.id === 'object' ? p.id.width : undefined);
      const rawH = p.height ?? (typeof p.id === 'object' ? p.id.height : undefined);
      const rawX = p.x ?? (typeof p.id === 'object' ? p.id.x : undefined);
      const rawY = p.y ?? (typeof p.id === 'object' ? p.id.y : undefined);

      const history = pushHistory(state);

      return {
        ...state,
        ...history,
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          const itemDef = getItemDefinition(item.type);
          
          // If point icon, keep fixed size
          if (itemDef.isPointIcon || item.isPointIcon) {
            return {
              ...item,
              width: item.width || itemDef.defaultWidth,
              height: item.height || itemDef.defaultHeight,
              x: rawX !== undefined ? Math.max(0, Math.round(rawX)) : item.x,
              y: rawY !== undefined ? Math.max(0, Math.round(rawY)) : item.y,
            };
          }

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

    case ACTION_TYPES.UPDATE_ITEM_PROPERTIES: {
      const { id, properties } = action.payload;
      const history = pushHistory(state);

      return {
        ...state,
        ...history,
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...properties } : item
        ),
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
      const targetId = id || state.selectedId;
      if (!targetId) return state;

      const history = pushHistory(state);

      return {
        ...state,
        ...history,
        items: state.items.filter((item) => item.id !== targetId),
        selectedId: state.selectedId === targetId ? null : state.selectedId,
      };
    }

    case ACTION_TYPES.DUPLICATE_ITEM: {
      const targetId = action.payload?.id || state.selectedId;
      if (!targetId) return state;

      const sourceItem = state.items.find((i) => i.id === targetId);
      if (!sourceItem) return state;

      const subIndex = state.nextZIndex;
      const zIndex = calculateZIndex(sourceItem.type, subIndex);
      const history = pushHistory(state);

      const duplicatedItem = {
        ...sourceItem,
        id: `farm-piece-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        x: sourceItem.x + 40,
        y: sourceItem.y + 40,
        zIndex,
        subIndex,
      };

      return {
        ...state,
        ...history,
        items: [...state.items, duplicatedItem],
        selectedId: duplicatedItem.id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case ACTION_TYPES.CLEAR_CANVAS: {
      if (state.items.length === 0) return state;
      const history = pushHistory(state);

      return {
        ...state,
        ...history,
        items: [],
        selectedId: null,
      };
    }

    case ACTION_TYPES.UNDO: {
      if (!state.past || state.past.length === 0) return state;

      const previousItems = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      const newFuture = [state.items, ...(state.future || [])];

      return {
        ...state,
        past: newPast,
        future: newFuture,
        items: previousItems,
        selectedId: previousItems.some((i) => i.id === state.selectedId) ? state.selectedId : null,
      };
    }

    case ACTION_TYPES.REDO: {
      if (!state.future || state.future.length === 0) return state;

      const nextItems = state.future[0];
      const newFuture = state.future.slice(1);
      const newPast = [...(state.past || []), state.items];

      return {
        ...state,
        past: newPast,
        future: newFuture,
        items: nextItems,
        selectedId: nextItems.some((i) => i.id === state.selectedId) ? state.selectedId : null,
      };
    }

    case ACTION_TYPES.SET_ZOOM: {
      const { zoom } = action.payload;
      const clampedZoom = Math.max(0.4, Math.min(2.5, Number(zoom) || 1.0));
      return {
        ...state,
        zoom: clampedZoom,
      };
    }

    case ACTION_TYPES.SET_FARM_SETTINGS: {
      return {
        ...state,
        farmSettings: {
          ...state.farmSettings,
          ...action.payload,
        },
        farmName: action.payload.name || state.farmName,
      };
    }

    case ACTION_TYPES.LOAD_SAVED_ITEMS: {
      const { items } = action.payload;
      return {
        ...state,
        items: items || [],
        selectedId: null,
        past: [],
        future: [],
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
        currentDay: world?.current_day ?? state.currentDay,
        environment: world?.environment || state.environment,
        tiles: world?.tiles || state.tiles,
        simulationLogs: world?.history || state.simulationLogs,
        farmSummary: summary || state.farmSummary,
        backendStatus: 'connected',
        backendError: null,
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
