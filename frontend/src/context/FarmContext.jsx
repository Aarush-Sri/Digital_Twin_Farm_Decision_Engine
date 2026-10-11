import React, { createContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react';
import { farmReducer, INITIAL_STATE, ACTION_TYPES, getInitialFarmItems } from './farmReducer';
import { GRID_SIZE, ITEM_TYPES, getItemDefinition } from '../types/farm';
import { DEFAULT_PRESET_FARM, PRESET_FARMS } from '../types/presetFarm';
import { apiClient } from '../api/apiClient';

export const FarmContext = createContext(null);

export const FarmProvider = ({ children }) => {
  const [state, dispatch] = useReducer(farmReducer, INITIAL_STATE, (init) => {
    const initialItems = getInitialFarmItems();
    return {
      ...init,
      items: initialItems,
      nextZIndex: initialItems.length + 1,
    };
  });

  // AI Model & Provider Configuration
  const [aiProvider, setAiProviderState] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_AI_PROVIDER') || localStorage.getItem('DIGIFARM_AI_PROVIDER') || 'auto'
      : 'auto';
  });
  const [geminiModel, setGeminiModelState] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_GEMINI_MODEL') || localStorage.getItem('DIGIFARM_GEMINI_MODEL') || 'gemini-2.5-flash'
      : 'gemini-2.5-flash';
  });
  const [localModel, setLocalModelState] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_LOCAL_MODEL') || 'llama3.2:1b'
      : 'llama3.2:1b';
  });
  const [geminiApiKey, setGeminiApiKeyState] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_GEMINI_KEY') || localStorage.getItem('DIGIFARM_GEMINI_KEY') || ''
      : '';
  });

  const setAiProvider = useCallback((prov) => {
    setAiProviderState(prov);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_AI_PROVIDER', prov);
    }
  }, []);

  const setGeminiModel = useCallback((model) => {
    setGeminiModelState(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_GEMINI_MODEL', model);
    }
  }, []);

  const setLocalModel = useCallback((model) => {
    setLocalModelState(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_LOCAL_MODEL', model);
    }
  }, []);

  const setGeminiApiKey = useCallback((key) => {
    setGeminiApiKeyState(key);
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('GREENTWIN_GEMINI_KEY', key.trim());
      } else {
        localStorage.removeItem('GREENTWIN_GEMINI_KEY');
        localStorage.removeItem('DIGIFARM_GEMINI_KEY');
      }
    }
  }, []);

  const activeAiModel = useMemo(() => {
    let effectiveProvider = aiProvider;
    let modelName = localModel;
    let label = 'Llama 3.2 (1B)';
    let shortLabel = 'Llama 3.2';
    let providerLabel = 'Local Ollama';
    let isLocal = true;

    if (aiProvider === 'gemini') {
      effectiveProvider = 'gemini';
      modelName = geminiModel;
      label = geminiModel.replace('gemini-', 'Gemini ');
      shortLabel = geminiModel.replace('gemini-', 'Gemini ').replace('-flash', '');
      providerLabel = 'Google Gemini';
      isLocal = false;
    } else if (aiProvider === 'auto') {
      if (geminiApiKey && geminiApiKey.trim()) {
        effectiveProvider = 'gemini';
        modelName = geminiModel;
        label = `${geminiModel.replace('gemini-', 'Gemini ')} (Auto)`;
        shortLabel = geminiModel.replace('gemini-', 'Gemini ').replace('-flash', '');
        providerLabel = 'Google Gemini (Auto)';
        isLocal = false;
      } else {
        effectiveProvider = 'ollama';
        modelName = localModel;
        if (localModel.includes('1b') || localModel.includes('3.2')) {
          label = 'Llama 3.2 (1B)';
          shortLabel = 'Llama 3.2';
        } else if (localModel.includes('qwen')) {
          label = 'Qwen 3.5';
          shortLabel = 'Qwen 3.5';
        } else {
          label = localModel;
          shortLabel = localModel.split(':')[0];
        }
        providerLabel = 'Local Ollama (Auto)';
        isLocal = true;
      }
    } else {
      effectiveProvider = 'ollama';
      modelName = localModel;
      if (localModel.includes('1b') || localModel.includes('3.2')) {
        label = 'Llama 3.2 (1B)';
        shortLabel = 'Llama 3.2';
      } else if (localModel.includes('qwen')) {
        label = 'Qwen 3.5';
        shortLabel = 'Qwen 3.5';
      } else {
        label = localModel;
        shortLabel = localModel.split(':')[0];
      }
      providerLabel = 'Local Ollama';
      isLocal = true;
    }

    return {
      provider: aiProvider,
      effectiveProvider,
      model: modelName,
      label,
      shortLabel,
      providerLabel,
      isLocal,
    };
  }, [aiProvider, geminiModel, localModel, geminiApiKey]);

  // Canvas Action Callbacks
  const addItem = useCallback((item) => {
    dispatch({ type: ACTION_TYPES.ADD_ITEM, payload: { item } });
  }, []);

  const updatePosition = useCallback((id, x, y) => {
    dispatch({ type: ACTION_TYPES.UPDATE_POSITION, payload: { id, x, y } });
  }, []);

  const updateDimensions = useCallback((arg1, width, height, x, y) => {
    if (typeof arg1 === 'object' && arg1 !== null) {
      dispatch({
        type: ACTION_TYPES.UPDATE_DIMENSIONS,
        payload: arg1,
      });
    } else {
      dispatch({
        type: ACTION_TYPES.UPDATE_DIMENSIONS,
        payload: { id: arg1, width, height, x, y },
      });
    }
  }, []);

  const selectItem = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.SELECT_ITEM, payload: { id } });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: ACTION_TYPES.DESELECT_ALL });
  }, []);

  const deleteItem = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.DELETE_ITEM, payload: { id } });
  }, []);

  const clearCanvas = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_CANVAS });
  }, []);

  const loadPresetFarm = useCallback((presetKey = 'model') => {
    const preset = PRESET_FARMS[presetKey]?.items || DEFAULT_PRESET_FARM;
    dispatch({
      type: ACTION_TYPES.LOAD_PRESET_FARM,
      payload: { items: preset },
    });
  }, []);

  // Persist farm layout to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('greentwin_farm_items', JSON.stringify(state.items));
      } catch (e) {
        // ignore
      }
    }
  }, [state.items]);

  const toggleSnap = useCallback(() => {
    dispatch({ type: ACTION_TYPES.TOGGLE_SNAP });
  }, []);

  const bringToFront = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.BRING_TO_FRONT, payload: { id } });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: ACTION_TYPES.UNDO });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: ACTION_TYPES.REDO });
  }, []);

  const duplicateItem = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.DUPLICATE_ITEM, payload: { id } });
  }, []);

  const updateItemProperties = useCallback((id, properties) => {
    dispatch({ type: ACTION_TYPES.UPDATE_ITEM_PROPERTIES, payload: { id, properties } });
  }, []);

  const setZoom = useCallback((zoom) => {
    dispatch({ type: ACTION_TYPES.SET_ZOOM, payload: { zoom } });
  }, []);

  const updateFarmSettings = useCallback((settings) => {
    dispatch({ type: ACTION_TYPES.SET_FARM_SETTINGS, payload: settings });
  }, []);

  const canUndo = (state.past?.length || 0) > 0;
  const canRedo = (state.future?.length || 0) > 0;

  const farmStats = useMemo(() => {
    const crops = state.items.filter((i) => {
      const type = i.type;
      return [
        ITEM_TYPES.WHEAT,
        ITEM_TYPES.CARROT,
        ITEM_TYPES.TOMATO,
        ITEM_TYPES.CORN,
        ITEM_TYPES.PADDY,
        ITEM_TYPES.SUGARCANE,
        ITEM_TYPES.BANANA,
        ITEM_TYPES.PUMPKIN,
        ITEM_TYPES.STRAWBERRY,
        ITEM_TYPES.TREE,
        ITEM_TYPES.NEEM_TREE,
        ITEM_TYPES.MANGO_TREE,
        ITEM_TYPES.COCONUT_TREE,
      ].includes(type);
    });

    let totalSqM = 0;
    const cropCounts = {};

    state.items.forEach((item) => {
      const wM = (item.width || 80) / 40;
      const hM = (item.height || 80) / 40;
      const area = wM * hM;
      const isCropOrTree = [
        ITEM_TYPES.WHEAT,
        ITEM_TYPES.CARROT,
        ITEM_TYPES.TOMATO,
        ITEM_TYPES.CORN,
        ITEM_TYPES.PADDY,
        ITEM_TYPES.SUGARCANE,
        ITEM_TYPES.BANANA,
        ITEM_TYPES.PUMPKIN,
        ITEM_TYPES.STRAWBERRY,
        ITEM_TYPES.TREE,
        ITEM_TYPES.NEEM_TREE,
        ITEM_TYPES.MANGO_TREE,
        ITEM_TYPES.COCONUT_TREE,
      ].includes(item.type);

      if (isCropOrTree) {
        totalSqM += area;
        const label = item.type.replace('_', ' ').toUpperCase();
        cropCounts[label] = (cropCounts[label] || 0) + 1;
      }
    });

    const totalAcres = Number((totalSqM / 4046.86).toFixed(3));
    const totalHectares = Number((totalSqM / 10000).toFixed(3));
    const cropSummary = Object.entries(cropCounts)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ');

    return {
      cropsCount: crops.length,
      totalCultivatedSqM: Number(totalSqM.toFixed(1)),
      totalCultivatedAcres: totalAcres,
      totalCultivatedHectares: totalHectares,
      cropSummary,
    };
  }, [state.items]);

  const selectedItem = useMemo(() => {
    return state.items.find((item) => item.id === state.selectedId) || null;
  }, [state.items, state.selectedId]);

  const snapCoordinate = useCallback((val) => {
    if (!state.snapToGrid) return Math.round(val);
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }, [state.snapToGrid]);

  // ==========================================
  // Backend Integration & Synchronization
  // ==========================================

  /**
   * Connect and initialize session with backend
   */
  const connectBackend = useCallback(async () => {
    dispatch({
      type: ACTION_TYPES.SET_BACKEND_STATUS,
      payload: { status: 'connecting' },
    });

    try {
      await apiClient.checkHealth();
      
      // Create or get active farm session
      const createRes = await apiClient.createFarm('GreenTwin Model Farm', 10, 10);
      const farmId = createRes.farm_id;
      const world = createRes.world;

      // Fetch summary
      let summary = null;
      try {
        summary = await apiClient.getFarmSummary(farmId);
      } catch (err) {
        console.warn('Could not fetch farm summary:', err);
      }

      dispatch({
        type: ACTION_TYPES.SET_FARM_DATA,
        payload: {
          farmId,
          farmName: createRes.name,
          world,
          summary,
        },
      });

      return { success: true, farmId };
    } catch (err) {
      console.warn('Backend connection warning:', err.message);
      dispatch({
        type: ACTION_TYPES.SET_BACKEND_STATUS,
        payload: {
          status: 'offline',
          error: err.message || 'Unable to connect to backend server',
        },
      });
      return { success: false, error: err.message };
    }
  }, []);

  // Auto-connect to backend on initial load
  useEffect(() => {
    connectBackend();
  }, [connectBackend]);

  /**
   * Synchronize Canvas layout items to backend farm world grid
   */
  const syncCanvasToBackend = useCallback(async () => {
    if (!state.farmId || state.backendStatus !== 'connected') {
      return { success: false, error: 'Backend not connected' };
    }

    dispatch({ type: ACTION_TYPES.SET_SYNCING, payload: { isSyncing: true } });

    try {
      // Map canvas items to grid coordinates (40px = 1m = 1 tile)
      const CROP_MAP = {
        [ITEM_TYPES.WHEAT]: 'wheat',
        [ITEM_TYPES.CARROT]: 'carrot',
        [ITEM_TYPES.TOMATO]: 'tomato',
        [ITEM_TYPES.CORN]: 'corn',
        [ITEM_TYPES.PADDY]: 'wheat',
        [ITEM_TYPES.SUGARCANE]: 'corn',
        [ITEM_TYPES.BANANA]: 'soybean',
        [ITEM_TYPES.PUMPKIN]: 'potato',
        [ITEM_TYPES.STRAWBERRY]: 'lettuce',
      };

      for (const item of state.items) {
        const startX = Math.max(0, Math.floor(item.x / 40));
        const startY = Math.max(0, Math.floor(item.y / 40));
        const endX = Math.max(startX, Math.floor((item.x + item.width - 1) / 40));
        const endY = Math.max(startY, Math.floor((item.y + item.height - 1) / 40));

        const backendCrop = CROP_MAP[item.type];
        if (backendCrop) {
          await apiClient.batchPlant(state.farmId, {
            cropType: backendCrop,
            startX: Math.min(startX, 9),
            startY: Math.min(startY, 9),
            endX: Math.min(endX, 9),
            endY: Math.min(endY, 9),
          });
        } else if (
          item.type === ITEM_TYPES.WATER || 
          item.type === ITEM_TYPES.POND || 
          item.type === ITEM_TYPES.WELL || 
          item.type === ITEM_TYPES.SPRINKLER || 
          item.type === ITEM_TYPES.PIPE
        ) {
          const isSprinkler = item.type === ITEM_TYPES.SPRINKLER;
          const rateMm = isSprinkler ? 10.0 : 8.0;
          const irrType = isSprinkler ? 'sprinkler' : 'drip';

          for (let x = Math.min(startX, 9); x <= Math.min(endX, 9); x++) {
            for (let y = Math.min(startY, 9); y <= Math.min(endY, 9); y++) {
              await apiClient.updateTile(state.farmId, {
                x,
                y,
                irrigationType: irrType,
                irrigationRateMm: rateMm,
                soilMoisturePct: 80.0,
              });
            }
          }
        }
      }

      // Re-fetch world state and summary after sync
      const [updatedWorld, updatedSummary] = await Promise.all([
        apiClient.getFarmState(state.farmId),
        apiClient.getFarmSummary(state.farmId),
      ]);

      dispatch({
        type: ACTION_TYPES.SET_FARM_DATA,
        payload: {
          farmId: state.farmId,
          farmName: updatedWorld.name,
          world: updatedWorld,
          summary: updatedSummary,
        },
      });

      dispatch({ type: ACTION_TYPES.SET_SYNCING, payload: { isSyncing: false } });
      return { success: true };
    } catch (err) {
      console.error('Failed to sync canvas to backend:', err);
      dispatch({ type: ACTION_TYPES.SET_SYNCING, payload: { isSyncing: false } });
      return { success: false, error: err.message };
    }
  }, [state.farmId, state.backendStatus, state.items]);

  /**
   * Advance simulation time step by N days
   */
  const stepSimulation = useCallback(async (days = 1, weatherOverrides = {}) => {
    if (!state.farmId || state.backendStatus !== 'connected') {
      // Offline fallback: advance day locally
      dispatch({
        type: ACTION_TYPES.STEP_SIMULATION_SUCCESS,
        payload: {
          currentDay: state.currentDay + days,
          environment: {
            ...state.environment,
            day: state.currentDay + days,
          },
        },
      });
      return { success: true, offline: true };
    }

    try {
      const res = await apiClient.stepSimulation(state.farmId, {
        days,
        ...weatherOverrides,
      });

      dispatch({
        type: ACTION_TYPES.STEP_SIMULATION_SUCCESS,
        payload: {
          currentDay: res.current_day,
          environment: res.environment,
          summary: res.summary,
          latestLog: res.latest_log,
        },
      });

      return { success: true, data: res };
    } catch (err) {
      console.error('Simulation step error:', err);
      return { success: false, error: err.message };
    }
  }, [state.farmId, state.backendStatus, state.currentDay, state.environment]);

  /**
   * Run What-If Scenario sandbox comparison
   */
  const runWhatIf = useCallback(async ({ days = 14, candidateActions = [], weatherModifier = null } = {}) => {
    if (!state.farmId || state.backendStatus !== 'connected') {
      return { success: false, error: 'Backend connection required for What-If Analysis' };
    }

    try {
      const result = await apiClient.runWhatIf(state.farmId, {
        days,
        candidateActions,
        weatherModifier,
      });
      return { success: true, data: result };
    } catch (err) {
      console.error('What-If scenario error:', err);
      return { success: false, error: err.message };
    }
  }, [state.farmId, state.backendStatus]);

  /**
   * Helper to generate dynamic agronomic analysis from placed canvas items and user question
   */
  const generateLocalAnalysis = (prompt) => {
    const p = (prompt || '').toLowerCase();
    const crops = state.items.filter((i) => [
      ITEM_TYPES.WHEAT,
      ITEM_TYPES.CARROT,
      ITEM_TYPES.TOMATO,
      ITEM_TYPES.CORN,
      ITEM_TYPES.PADDY,
      ITEM_TYPES.SUGARCANE,
      ITEM_TYPES.BANANA,
      ITEM_TYPES.PUMPKIN,
      ITEM_TYPES.STRAWBERRY,
    ].includes(i.type));

    const wheatCount = state.items.filter((i) => i.type === ITEM_TYPES.WHEAT).length;
    const carrotCount = state.items.filter((i) => i.type === ITEM_TYPES.CARROT).length;
    const tomatoCount = state.items.filter((i) => i.type === ITEM_TYPES.TOMATO).length;
    const cornCount = state.items.filter((i) => i.type === ITEM_TYPES.CORN).length;
    const paddyCount = state.items.filter((i) => i.type === ITEM_TYPES.PADDY).length;
    const sugarcaneCount = state.items.filter((i) => i.type === ITEM_TYPES.SUGARCANE).length;
    const bananaCount = state.items.filter((i) => i.type === ITEM_TYPES.BANANA).length;
    const pumpkinCount = state.items.filter((i) => i.type === ITEM_TYPES.PUMPKIN).length;
    const strawberryCount = state.items.filter((i) => i.type === ITEM_TYPES.STRAWBERRY).length;

    const waterCount = state.items.filter((i) => [
      ITEM_TYPES.WATER,
      ITEM_TYPES.POND,
      ITEM_TYPES.WELL,
      ITEM_TYPES.SPRINKLER,
      ITEM_TYPES.PIPE,
    ].includes(i.type)).length;

    const trees = state.items.filter((i) => [
      ITEM_TYPES.TREE,
      ITEM_TYPES.NEEM_TREE,
      ITEM_TYPES.MANGO_TREE,
      ITEM_TYPES.COCONUT_TREE,
    ].includes(i.type));
    const treeCount = trees.length;
    const neemCount = state.items.filter((i) => i.type === ITEM_TYPES.NEEM_TREE).length;
    const mangoCount = state.items.filter((i) => i.type === ITEM_TYPES.MANGO_TREE).length;
    const coconutCount = state.items.filter((i) => i.type === ITEM_TYPES.COCONUT_TREE).length;

    const grassCount = state.items.filter((i) => i.type === ITEM_TYPES.GRASS).length;
    const fenceCount = state.items.filter((i) => i.type === ITEM_TYPES.FENCE).length;
    const totalItems = state.items.length;

    const estYieldKg = (
      wheatCount * 9.9 + 
      carrotCount * 8.4 + 
      tomatoCount * 11.2 + 
      cornCount * 14.5 + 
      paddyCount * 18.0 +
      sugarcaneCount * 32.0 +
      bananaCount * 24.0 +
      pumpkinCount * 22.0 + 
      strawberryCount * 6.5 + 
      treeCount * 12.0
    );

    let content = '';
    let actionType = 'agronomic_consultation';

    // 0. SCENARIO: Conversational Greetings
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo)\b/i.test(p.trim()) || p.trim() === 'hello' || p.trim() === 'hi') {
      actionType = 'conversational_greeting';
      content = `Hello! I am your AI Agronomist and Digital Farmland Twin decision engine for **${state.farmName}**.\n\n`;
      if (totalItems === 0) {
        content += `Your farm plot canvas is currently empty and ready for design. You can drag **Paddy Rice**, **Wheat**, **Sugarcane**, **Banana**, **Carrots**, **Trees**, or **Water Canals** from the left palette onto the grid to start cultivating.\n\n`;
      } else {
        const placedSummary = [
          crops.length > 0 ? `${crops.length} crop plots` : null,
          waterCount > 0 ? `${waterCount} irrigation sources` : null,
          treeCount > 0 ? `${treeCount} trees/palms` : null,
        ].filter(Boolean).join(', ');

        content += `I am currently tracking your **${totalItems} placed assets** (${placedSummary || 'infrastructure'}).\n\n`;
      }
      content += `What would you like to explore today? You can ask me any agronomy questions, layout optimization advice, or simulation scenarios like *"What if a 2-week drought hits?"* or *"How will heavy rain affect my paddy and carrots?"*`;
    }
    // 1. SCENARIO: Drought / No Rain / Water Deficit / Dry Spell / Heatwave
    else if (p.includes('drought') || p.includes('dry') || p.includes('no water') || p.includes('no rain') || p.includes('heatwave') || p.includes('hot')) {
      actionType = 'drought_stress_simulation';
      const lossPct = waterCount === 0 ? 55 : paddyCount > 0 ? 30 : 18;
      const stressedYield = estYieldKg * (1 - lossPct / 100);

      content = `### ☀️ Scenario Analysis: Drought & Heat Stress (14-Day Projection)\n\n`;
      content += `**Microclimate & Soil Impact:**\n`;
      content += `- Reference Evapotranspiration (ET₀) spikes from 4.2 mm/day to 7.8 mm/day due to high vapor pressure deficit (VPD).\n`;
      content += `- Root-zone moisture depletes from 68% down to ~20% in 5 days if supplemental irrigation is absent.\n\n`;
      
      content += `**Crop-Specific Physiological Response:**\n`;
      if (paddyCount > 0) {
        content += `- Paddy Rice: High vulnerability. Paddy requires 5–10 cm water ponding; moisture drop will cause leaf rolling and spikelet sterility.\n`;
      }
      if (sugarcaneCount > 0) {
        content += `- Sugarcane: High water demand. Will initiate internode shortening and reduce sucrose accumulation.\n`;
      }
      if (bananaCount > 0) {
        content += `- Banana: Broadleaf foliage rapidly wilts to minimize transpiration surface.\n`;
      }
      if (wheatCount > 0 || carrotCount > 0) {
        content += `- Wheat & Carrots: Stomata close to conserve moisture; root hairs lose turgor pressure and fibrous roots lignify.\n`;
      }
      if (treeCount > 0) {
        content += `- Deep-Rooted Trees (Neem, Mango, Coconut): Resist topsoil drying and provide beneficial canopy shade.\n`;
      }
      content += `- Projected Yield Impact: Net harvest drops by **-${lossPct}%** (from ~${estYieldKg.toFixed(1)} kg to **${stressedYield.toFixed(1)} kg**).\n\n`;

      content += `**Recommended Mitigations:**\n`;
      if (waterCount === 0) {
        content += `1. **Immediate Irrigation:** Add **Water Canals** or **Wells** adjacent to crop beds to maintain root-zone moisture above 60%.\n`;
      } else {
        content += `1. **Maintain Irrigation Network:** Your ${waterCount} water sources buffer the plot, limiting drought impact to only ~${lossPct}%.\n`;
      }
      content += `2. **Soil Cover with Grass Turf:** Place grass or mulch borders to reduce surface evaporation by up to 35%.\n`;
      content += `3. **Windbreak Protection:** Position **Neem Trees** or **Orchard Trees** along the windward perimeter to reduce wind-driven evaporative stress.`;
    }
    // 2. SCENARIO: Flood / Overwatering / Heavy Rain / Excess Water / Storm
    else if (p.includes('flood') || p.includes('heavy rain') || p.includes('too much water') || p.includes('overwater') || p.includes('storm')) {
      actionType = 'flood_saturation_simulation';
      content = `### 🌧️ Scenario Analysis: Heavy Rainfall & Soil Waterlogging\n\n`;
      content += `**Soil Hydrodynamics:**\n`;
      content += `- Soil moisture exceeds 85%, saturating macropores and expelling dissolved soil oxygen.\n`;
      content += `- Root hypoxia develops within 48 hours, inhibiting active nutrient uptake and respiration.\n\n`;

      content += `**Crop-Specific Vulnerabilities:**\n`;
      if (paddyCount > 0) {
        content += `- Paddy Rice: Thrives in standing water. Paddy root aerenchyma tissue tolerates submersion up to 10 days.\n`;
      }
      if (carrotCount > 0) {
        content += `- Carrot Patches: Severe risk. Root rot, cavity spot, and taproot splitting occur rapidly in waterlogged soil.\n`;
      }
      if (wheatCount > 0) {
        content += `- Wheat Plots: Susceptible to fungal root pathogens (*Fusarium*, *Pythium*) and lodging under soggy topsoil.\n`;
      }
      if (bananaCount > 0 || sugarcaneCount > 0) {
        content += `- Banana & Sugarcane: Benefit from elevated moisture but require adequate drainage to prevent pseudo-stem rot.\n`;
      }
      content += `\n**Recommended Layout Adjustments:**\n`;
      content += `1. Align water-sensitive root crops (Carrots, Wheat) on elevated ridges.\n`;
      content += `2. Channel excess runoff into dedicated **Water Canals** or **Ponds** at lower elevations.\n`;
      content += `3. Separate standing-water crops (Paddy) from dry-land vegetables using border fences or stone paths.`;
    }
    // 3. SCENARIO: Crop Comparison / What to plant
    else if (p.includes('compare') || p.includes('which crop') || p.includes('what to plant') || p.includes('paddy') || p.includes('sugarcane')) {
      actionType = 'crop_comparative_analysis';
      content = `### 🌾 Crop Variety Comparison & Plot Suitability\n\n`;
      content += `| Crop Variety | Water Demand | Root Depth | Harvest Cycle | Est. Yield/Plot |\n`;
      content += `|---|---|---|---|---|\n`;
      content += `| 🌾 Wheat Crop | Moderate (ET₀ × 1.15) | 40–60 cm | 100–120 Days | ~9.9 kg |\n`;
      content += `| 🥕 Carrot Patch | Moderate (ET₀ × 1.05) | 25–35 cm | 70–80 Days | ~8.4 kg |\n`;
      content += `| 🍚 Paddy Rice | Very High (Ponded) | 20–30 cm | 110–130 Days | ~18.0 kg |\n`;
      content += `| 🎋 Sugarcane | High (1200mm) | 60–100 cm | 270–360 Days | ~32.0 kg |\n`;
      content += `| 🍌 Banana Grove | High (ET₀ × 1.10) | 30–50 cm | Perennial | ~24.0 kg |\n`;
      content += `| 🌳 Neem/Mango | Resilient (ET₀ × 0.80) | 100–200 cm | Perennial | ~12.0 kg |\n\n`;

      content += `**Agronomic Recommendation for Your Farm:**\n`;
      if (crops.length === 0) {
        content += `- Place **Paddy Rice** or **Sugarcane** adjacent to **Water Canals** for high yields, and companion-plant **Wheat** or **Carrots** in well-drained central plots.`;
      } else {
        content += `- You currently have **${crops.length} crop beds** cultivated across **${farmStats?.cropSummary || 'multiple varieties'}**. Polyculture reduces pest outbreaks and stabilizes soil fertility!`;
      }
    }
    // 4. SCENARIO: Yield Estimation / Harvest Output / Biomass
    else if (p.includes('yield') || p.includes('harvest') || p.includes('how much') || p.includes('output') || p.includes('biomass') || p.includes('kg')) {
      actionType = 'yield_biomass_computation';
      content = `### ⚖️ Projected Harvest & Biomass Yield Computation\n\n`;
      if (totalItems === 0) {
        content += `Currently, no crops are placed on the canvas. Drag Paddy, Wheat, Sugarcane, Carrots, or Orchard Trees from the palette onto the canvas to calculate projected yields.`;
      } else {
        content += `**Yield Breakdown by Asset:**\n`;
        if (paddyCount > 0) content += `- Paddy Rice (${paddyCount} plots): ~${(paddyCount * 18.0).toFixed(1)} kg\n`;
        if (sugarcaneCount > 0) content += `- Sugarcane (${sugarcaneCount} plots): ~${(sugarcaneCount * 32.0).toFixed(1)} kg\n`;
        if (bananaCount > 0) content += `- Banana Groves (${bananaCount} plots): ~${(bananaCount * 24.0).toFixed(1)} kg\n`;
        if (wheatCount > 0) content += `- Wheat (${wheatCount} plots): ~${(wheatCount * 9.9).toFixed(1)} kg\n`;
        if (carrotCount > 0) content += `- Carrots (${carrotCount} plots): ~${(carrotCount * 8.4).toFixed(1)} kg\n`;
        if (tomatoCount > 0) content += `- Tomatoes (${tomatoCount} plots): ~${(tomatoCount * 11.2).toFixed(1)} kg\n`;
        if (cornCount > 0) content += `- Sweet Corn (${cornCount} plots): ~${(cornCount * 14.5).toFixed(1)} kg\n`;
        if (pumpkinCount > 0) content += `- Pumpkins (${pumpkinCount} plots): ~${(pumpkinCount * 22.0).toFixed(1)} kg\n`;
        if (treeCount > 0) content += `- Orchard & Fruit Trees (${treeCount} units): ~${(treeCount * 12.0).toFixed(1)} kg fruit\n`;

        content += `\n**Total Estimated Plot Biomass:** **~${estYieldKg.toFixed(1)} kg**\n\n`;
        content += `**Yield Optimization Multipliers:**\n`;
        content += `- Irrigation Factor: ${waterCount > 0 ? '1.0× (Optimal with irrigation sources)' : '0.65× (Yield penalized due to moisture stress)'}\n`;
        content += `- Canopy & Spacing: ${treeCount > 0 ? 'Trees provide windbreak and microclimate stabilization' : 'Add perimeter trees to protect against wind desiccation'}`;
      }
    }
    // 5. SCENARIO: Layout / General Diagnosis
    else {
      actionType = 'farm_plot_inspection';
      content = `### 🌾 Plot Field Diagnosis & Agronomic Status\n\n`;
      if (totalItems === 0) {
        content += `Your farm canvas is currently empty.\n\n`;
        content += `**Recommended Next Steps:**\n`;
        content += `1. Drag **Paddy Rice**, **Wheat**, or **Carrot** patches onto the canvas.\n`;
        content += `2. Place a **Water Canal** adjacent to your crops to secure steady irrigation.\n`;
        content += `3. Surround with a **Wood Fence** or **Neem Trees** to define your perimeter.`;
      } else {
        content += `**Current Canvas Assets:**\n`;
        content += `- Active Crops: ${crops.length} plots (${farmStats?.cropSummary || 'Crops placed'})\n`;
        content += `- Infrastructure: ${waterCount} Irrigation Sources, ${treeCount} Trees, ${fenceCount} Fences, ${grassCount} Grass Plots\n`;
        content += `- Projected Harvest: **~${estYieldKg.toFixed(1)} kg**\n\n`;

        content += `**Soil & Water Balance:**\n`;
        if (waterCount === 0 && crops.length > 0) {
          content += `- ⚠️ Water Deficit Alert: No irrigation placed on the farm! Add a **Water Canal** or **Well** adjacent to crop beds to prevent drought stress.\n`;
        } else {
          content += `- ✅ Hydration: Irrigation coverage is active. Root-zone soil moisture is balanced.\n`;
        }

        content += `\n**What-If Questions You Can Ask Me:**\n`;
        content += `- *"What will happen if a 2-week drought hits?"*\n`;
        content += `- *"What if there is heavy flood / rainfall?"*\n`;
        content += `- *"Compare wheat vs paddy vs sugarcane for this layout"*\n`;
        content += `- *"How can I improve my crop yield and layout?"*`;
      }
    }

    return {
      final_response: content,
      execution_steps: [
        {
          step: 1,
          thought: `Analyzing question intent ('${prompt.slice(0, 40)}...') and evaluating 2D farm layout assets...`,
          action: actionType,
          result: { 
            total_items: totalItems, 
            crops: crops.length, 
            water_sources: waterCount,
            est_yield_kg: estYieldKg 
          },
        },
      ],
      actions_taken: [actionType],
      provider_used: 'AI Agronomist Engine',
      model_used: 'decision-engine-v2',
    };
  };

  /**
   * Direct Gemini API client in browser when API Key is provided
   */
  const callDirectGemini = async (apiKey, prompt, chatHistory) => {
    const crops = state.items.filter((i) => i.type === ITEM_TYPES.WHEAT || i.type === ITEM_TYPES.CARROT);
    const wheatCount = state.items.filter((i) => i.type === ITEM_TYPES.WHEAT).length;
    const carrotCount = state.items.filter((i) => i.type === ITEM_TYPES.CARROT).length;
    const waterCount = state.items.filter((i) => i.type === ITEM_TYPES.WATER).length;
    const treeCount = state.items.filter((i) => i.type === ITEM_TYPES.TREE).length;
    const grassCount = state.items.filter((i) => i.type === ITEM_TYPES.GRASS).length;
    const fenceCount = state.items.filter((i) => i.type === ITEM_TYPES.FENCE).length;

    const farmContextStr = `Current Farm Plot Context:
- Total Placed Assets: ${state.items.length}
- Cultivated Crops: ${crops.length} (${wheatCount} Wheat plots, ${carrotCount} Carrot patches)
- Irrigation Infrastructure: ${waterCount} Water Canals
- Perimeter & Flora: ${treeCount} Orchard Trees, ${fenceCount} Wood Fences, ${grassCount} Grass Plots
- Simulation Day: ${state.currentDay}
- Ambient Weather: Temp avg 22°C, Solar Radiation 450 W/m², Reference ET0 4.2 mm/day`;

    const systemInstruction = `You are GreenTwin's AI Agronomist and Digital Farmland Twin reasoning engine.
You have full access to the user's virtual farm layout.
${farmContextStr}

Answer any question the user asks—whether about hypothetical scenarios ("what if"), agronomy, soil physics, biology, planting layouts, climate extremes, or general inquiries—with deep expertise, clear formatting, and actionable insight.`;

    const validHistory = (chatHistory || []).filter(
      (m) => m.content && m.content.trim() && m.id !== 'welcome'
    );

    const contents = [];
    for (const msg of validHistory) {
      const role = msg.role === 'user' ? 'user' : 'model';
      // Gemini API requires the first content message to be role 'user'
      if (contents.length === 0 && role === 'model') continue;

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${msg.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Append current prompt as user role
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n${prompt}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    const candidateModels = [model || 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const mod of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

          return {
            final_response: candidateText,
            execution_steps: [
              {
                step: 1,
                thought: `Invoked Google Gemini (${mod}) with live farm layout context and chat history.`,
                action: 'gemini_multiturn_reasoning',
                result: { model: mod, status: 'success' },
              },
            ],
            actions_taken: ['gemini_inference'],
            provider_used: 'Google Gemini',
            model_used: mod,
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error?.message || `HTTP ${res.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    throw new Error(lastError || 'Gemini API call failed across all candidate models.');
  };

  /**
   * Direct Ollama client in browser when local Ollama daemon is running (Qwen 3.5 / 2.5)
   */
  const callDirectOllama = async (prompt, chatHistory, requestedModel = null) => {
    const crops = state.items.filter((i) => 
      i.type === ITEM_TYPES.WHEAT || 
      i.type === ITEM_TYPES.CARROT || 
      i.type === ITEM_TYPES.TOMATO || 
      i.type === ITEM_TYPES.CORN || 
      i.type === ITEM_TYPES.PUMPKIN || 
      i.type === ITEM_TYPES.STRAWBERRY
    );
    const wheatCount = state.items.filter((i) => i.type === ITEM_TYPES.WHEAT).length;
    const carrotCount = state.items.filter((i) => i.type === ITEM_TYPES.CARROT).length;
    const waterCount = state.items.filter((i) => i.type === ITEM_TYPES.WATER || i.type === ITEM_TYPES.WELL).length;
    const treeCount = state.items.filter((i) => i.type === ITEM_TYPES.TREE).length;
    const grassCount = state.items.filter((i) => i.type === ITEM_TYPES.GRASS).length;
    const fenceCount = state.items.filter((i) => i.type === ITEM_TYPES.FENCE).length;

    const farmContextStr = `Current Farm Plot Context:
- Total Placed Assets: ${state.items.length}
- Cultivated Crops: ${crops.length} (${wheatCount} Wheat, ${carrotCount} Carrot)
- Irrigation Infrastructure: ${waterCount} Water Canals/Wells
- Perimeter & Flora: ${treeCount} Trees, ${fenceCount} Fences, ${grassCount} Grass Plots
- Simulation Day: ${state.currentDay}
- Ambient Weather: Temp avg 22°C, Solar Radiation 450 W/m², Reference ET0 4.2 mm/day`;

    const systemInstruction = `You are GreenTwin's AI Agronomist and Digital Farmland Twin reasoning engine.
You have full access to the virtual farm layout:
${farmContextStr}

Answer the user's questions clearly, concisely, and with expert agronomy and simulation reasoning.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      ...(chatHistory || [])
        .filter((m) => m.content && m.content.trim() && m.id !== 'welcome')
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: prompt },
    ];

    let modelName = requestedModel || 'qwen3.5';
    let baseOllamaUrl = '/ollama';

    try {
      let tagsRes = await fetch('/ollama/api/tags', { method: 'GET' }).catch(() => null);
      if (!tagsRes || !tagsRes.ok) {
        baseOllamaUrl = 'http://localhost:11434';
        tagsRes = await fetch('http://localhost:11434/api/tags', { method: 'GET' }).catch(() => null);
      }

      if (tagsRes && tagsRes.ok) {
        const tagsData = await tagsRes.json();
        const available = tagsData.models?.map((m) => m.name) || [];
        if (available.length > 0) {
          if (requestedModel) {
            const exact = available.find((m) => m === requestedModel);
            const partial = available.find((m) => m.toLowerCase().includes(requestedModel.toLowerCase()));
            modelName = exact || partial || available[0];
          } else {
            // Prioritize Qwen or Llama 3.2:1b models installed in local Ollama
            const qwenMatch = available.find((m) => m.toLowerCase().includes('qwen'));
            const llamaMatch = available.find((m) => m.toLowerCase().includes('llama') || m.toLowerCase().includes('3.2'));
            modelName = qwenMatch || llamaMatch || available[0];
          }
        }
      }
    } catch {
      // default model name
    }

    const res = await fetch(`${baseOllamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: false,
        think: false,
        options: { temperature: 0.3 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data = await res.json();
    let reply = data.message?.content || 'No response generated.';
    // Strip reasoning thinking tags if present
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return {
      final_response: reply,
      execution_steps: [
        {
          step: 1,
          thought: `Queried local Ollama Qwen model (${modelName}) with farm context and conversation history.`,
          action: 'ollama_inference',
          result: { model: modelName, status: 'success' },
        },
      ],
      actions_taken: ['ollama_inference'],
      provider_used: 'Local Ollama',
      model_used: modelName,
    };
  };

  /**
   * Build complete 2D Farm spatial topology and UI patch details
   */
  const buildFrontendFarmContext = useCallback((options = {}) => {
    const waterSources = state.items.filter((i) => 
      i.type === ITEM_TYPES.WATER || 
      i.type === ITEM_TYPES.POND || 
      i.type === ITEM_TYPES.WELL || 
      i.type === ITEM_TYPES.SPRINKLER
    );

    return {
      canvas_scale: { pixels_per_meter: 40, grid_snap_m: 0.5 },
      farm_name: state.farmName || 'GreenTwin Farm',
      current_day: state.currentDay,
      total_items: state.items.length,
      active_model: {
        label: activeAiModel.label,
        provider: activeAiModel.providerLabel,
        is_local: activeAiModel.isLocal,
      },
      ui_patch_details: {
        title: 'GreenTwin',
        theme: 'Minimal Dark Agronomy',
        active_tab: options.activeTab || 'chat',
        selected_scenario: options.selectedScenario || null,
        has_simulation_panel: true,
        has_scenario_comparison_modal: true,
      },
      items_2d: state.items.map((item) => {
        const x_m = Number((item.x / 40).toFixed(2));
        const y_m = Number((item.y / 40).toFixed(2));
        const w_m = Number((item.width / 40).toFixed(2));
        const h_m = Number((item.height / 40).toFixed(2));

        let nearestWaterDistM = null;
        if (waterSources.length > 0) {
          const distances = waterSources.map((w) => {
            const wx = w.x / 40;
            const wy = w.y / 40;
            return Math.hypot(wx - x_m, wy - y_m);
          });
          nearestWaterDistM = Number(Math.min(...distances).toFixed(2));
        }

        return {
          id: item.id,
          type: item.type,
          x_m,
          y_m,
          width_m: w_m,
          height_m: h_m,
          nearest_water_dist_m: nearestWaterDistM,
          category: getItemDefinition(item.type)?.category || 'Other',
        };
      }),
    };
  }, [state.items, state.farmName, state.currentDay, activeAiModel]);

  /**
   * Send user prompt to Autonomous AI Agronomist Agent
   */
  const sendAgentChat = useCallback(async (prompt, chatHistory = [], maxSteps = 5, options = {}) => {
    const { preferredProvider = 'auto', model = null, geminiApiKey: customKey = null } = options;

    const storedKey = typeof window !== 'undefined'
      ? (localStorage.getItem('GREENTWIN_GEMINI_KEY') || localStorage.getItem('DIGIFARM_GEMINI_KEY') || import.meta.env?.VITE_GEMINI_API_KEY)
      : null;
    const effectiveGeminiKey = (customKey || storedKey || '').trim();

    // 1. If backend is connected, prioritize the full multi-step backend agent
    if (state.farmId && state.backendStatus === 'connected') {
      try {
        if (state.items.length > 0) {
          await syncCanvasToBackend();
        }

        const frontendFarmContext = buildFrontendFarmContext(options);

        const response = await apiClient.sendAgentChat(state.farmId, {
          prompt,
          chatHistory,
          maxSteps,
          geminiApiKey: effectiveGeminiKey || null,
          model,
          preferredProvider,
          frontendFarmContext,
        });

        // Refresh farm state after agent execution
        try {
          const [updatedWorld, updatedSummary] = await Promise.all([
            apiClient.getFarmState(state.farmId),
            apiClient.getFarmSummary(state.farmId),
          ]);
          dispatch({
            type: ACTION_TYPES.SET_FARM_DATA,
            payload: {
              farmId: state.farmId,
              farmName: updatedWorld.name,
              world: updatedWorld,
              summary: updatedSummary,
            },
          });
        } catch (refreshErr) {
          console.warn('Could not refresh farm state after agent execution:', refreshErr);
        }

        return { success: true, data: response };
      } catch (err) {
        console.warn('Backend agent chat call failed, falling back to direct browser clients:', err);
      }
    }

    // 2. Direct Gemini browser client if key is provided and not forced to Ollama
    if (preferredProvider !== 'ollama' && effectiveGeminiKey) {
      try {
        const geminiRes = await callDirectGemini(effectiveGeminiKey, prompt, chatHistory, model);
        return { success: true, data: geminiRes };
      } catch (geminiErr) {
        console.warn('Direct Gemini API error, attempting local fallback:', geminiErr);
        if (preferredProvider === 'gemini') {
          return {
            success: false,
            error: `Gemini API Error: ${geminiErr.message}. Check your API key.`,
          };
        }
      }
    }

    // 3. Direct Local Ollama connection (Qwen 3.5 / 2.5)
    if (preferredProvider !== 'gemini') {
      try {
        const ollamaRes = await callDirectOllama(prompt, chatHistory, model);
        return { success: true, data: ollamaRes };
      } catch (ollamaErr) {
        console.debug('Direct Ollama call not available, checking local rules:', ollamaErr);
      }
    }

    // 4. Dynamic Local Agronomist Engine Fallback
    const localData = generateLocalAnalysis(prompt);
    return { success: true, data: localData };
  }, [state.farmId, state.backendStatus, state.items, state.currentDay]);

  /**
   * Save farm snapshot
   */
  const saveFarmSnapshot = useCallback(async () => {
    if (!state.farmId || state.backendStatus !== 'connected') {
      return { success: false, error: 'Backend not connected' };
    }

    try {
      const res = await apiClient.saveFarmSnapshot(state.farmId);
      return { success: true, data: res };
    } catch (err) {
      console.error('Save farm error:', err);
      return { success: false, error: err.message };
    }
  }, [state.farmId, state.backendStatus]);

  /**
   * Update farm profile (location, climate, soil texture, water source)
   */
  const updateFarmProfile = useCallback(async (profileData) => {
    if (!state.farmId || state.backendStatus !== 'connected') {
      dispatch({
        type: ACTION_TYPES.SET_FARM_PROFILE,
        payload: { profile: profileData },
      });
      return { success: true, offline: true };
    }

    try {
      const res = await apiClient.updateFarmProfile(state.farmId, profileData);
      dispatch({
        type: ACTION_TYPES.SET_FARM_PROFILE,
        payload: {
          profile: res.profile,
          summary: res.summary,
          environment: res.summary?.environment,
        },
      });
      return { success: true, data: res };
    } catch (err) {
      console.error('Failed to update farm profile:', err);
      return { success: false, error: err.message };
    }
  }, [state.farmId, state.backendStatus]);

  const value = useMemo(() => ({
    ...state,
    selectedItem,
    canUndo,
    canRedo,
    farmStats,
    // Canvas actions
    addItem,
    updatePosition,
    updateDimensions,
    selectItem,
    deselectAll,
    deleteItem,
    duplicateItem,
    updateItemProperties,
    clearCanvas,
    loadPresetFarm,
    toggleSnap,
    bringToFront,
    snapCoordinate,
    undo,
    redo,
    setZoom,
    updateFarmSettings,
    // Backend & simulation actions
    connectBackend,
    syncCanvasToBackend,
    stepSimulation,
    runWhatIf,
    sendAgentChat,
    buildFrontendFarmContext,
    saveFarmSnapshot,
    updateFarmProfile,
    // AI Configuration and Active Model
    aiProvider,
    setAiProvider,
    geminiModel,
    setGeminiModel,
    localModel,
    setLocalModel,
    geminiApiKey,
    setGeminiApiKey,
    activeAiModel,
  }), [
    state,
    selectedItem,
    canUndo,
    canRedo,
    farmStats,
    addItem,
    updatePosition,
    updateDimensions,
    selectItem,
    deselectAll,
    deleteItem,
    duplicateItem,
    updateItemProperties,
    clearCanvas,
    loadPresetFarm,
    toggleSnap,
    bringToFront,
    snapCoordinate,
    undo,
    redo,
    setZoom,
    updateFarmSettings,
    connectBackend,
    syncCanvasToBackend,
    stepSimulation,
    runWhatIf,
    sendAgentChat,
    buildFrontendFarmContext,
    saveFarmSnapshot,
    updateFarmProfile,
    aiProvider,
    setAiProvider,
    geminiModel,
    setGeminiModel,
    localModel,
    setLocalModel,
    geminiApiKey,
    setGeminiApiKey,
    activeAiModel,
  ]);

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};
