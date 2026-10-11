import React, { createContext, useReducer, useMemo, useCallback, useEffect } from 'react';
import { farmReducer, INITIAL_STATE, ACTION_TYPES } from './farmReducer';
import { GRID_SIZE, ITEM_TYPES } from '../types/farm';
import { apiClient } from '../api/apiClient';

export const FarmContext = createContext(null);

export const FarmProvider = ({ children }) => {
  const [state, dispatch] = useReducer(farmReducer, INITIAL_STATE);

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

  const toggleSnap = useCallback(() => {
    dispatch({ type: ACTION_TYPES.TOGGLE_SNAP });
  }, []);

  const bringToFront = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.BRING_TO_FRONT, payload: { id } });
  }, []);

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
      const createRes = await apiClient.createFarm('Digital Farm 1', 10, 10);
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
      for (const item of state.items) {
        const startX = Math.max(0, Math.floor(item.x / 40));
        const startY = Math.max(0, Math.floor(item.y / 40));
        const endX = Math.max(startX, Math.floor((item.x + item.width - 1) / 40));
        const endY = Math.max(startY, Math.floor((item.y + item.height - 1) / 40));

        if (item.type === ITEM_TYPES.WHEAT || item.type === ITEM_TYPES.CARROT) {
          const cropType = item.type === ITEM_TYPES.WHEAT ? 'wheat' : 'carrot';
          await apiClient.batchPlant(state.farmId, {
            cropType,
            startX: Math.min(startX, 9),
            startY: Math.min(startY, 9),
            endX: Math.min(endX, 9),
            endY: Math.min(endY, 9),
          });
        } else if (item.type === ITEM_TYPES.WATER) {
          // Set irrigation for this area
          for (let x = Math.min(startX, 9); x <= Math.min(endX, 9); x++) {
            for (let y = Math.min(startY, 9); y <= Math.min(endY, 9); y++) {
              await apiClient.updateTile(state.farmId, {
                x,
                y,
                irrigationType: 'drip',
                irrigationRateMm: 8.0,
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
    const tomatoCount = state.items.filter((i) => i.type === ITEM_TYPES.TOMATO).length;
    const cornCount = state.items.filter((i) => i.type === ITEM_TYPES.CORN).length;
    const pumpkinCount = state.items.filter((i) => i.type === ITEM_TYPES.PUMPKIN).length;
    const strawberryCount = state.items.filter((i) => i.type === ITEM_TYPES.STRAWBERRY).length;
    const waterCount = state.items.filter((i) => i.type === ITEM_TYPES.WATER || i.type === ITEM_TYPES.WELL).length;
    const treeCount = state.items.filter((i) => i.type === ITEM_TYPES.TREE).length;
    const grassCount = state.items.filter((i) => i.type === ITEM_TYPES.GRASS).length;
    const fenceCount = state.items.filter((i) => i.type === ITEM_TYPES.FENCE).length;
    const totalItems = state.items.length;

    const estYieldKg = (
      wheatCount * 9.9 + 
      carrotCount * 8.4 + 
      tomatoCount * 11.2 + 
      cornCount * 14.5 + 
      pumpkinCount * 22.0 + 
      strawberryCount * 6.5 + 
      treeCount * 12.0
    );

    let content = '';
    let actionType = 'agronomic_consultation';

    // 0. SCENARIO: Conversational Greetings (hello, hi, hey, who are you)
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo)\b/i.test(p.trim()) || p.trim() === 'hello' || p.trim() === 'hi') {
      actionType = 'conversational_greeting';
      content = `Hello! 👋 I am your AI Agronomist & Digital Farmland Twin decision engine for **${state.farmName}**.\n\n`;
      if (totalItems === 0) {
        content += `Your farm plot canvas is currently empty and ready for design. You can drag **Wheat**, **Carrots**, **Trees**, or **Water Canals** from the left palette onto the grid to start cultivating.\n\n`;
      } else {
        content += `I am currently tracking your **${totalItems} placed assets** (${crops.length} crop plots, ${waterCount} water canals, ${treeCount} trees).\n\n`;
      }
      content += `What would you like to explore today? You can ask me any farming questions, layout optimization advice, or simulation scenarios like *"What if a 2-week drought hits?"*!`;
    }
    // 1. SCENARIO: Drought / No Rain / Water Deficit / Dry Spell
    else if (p.includes('drought') || p.includes('dry') || p.includes('no water') || p.includes('no rain') || p.includes('heatwave') || p.includes('hot')) {
      actionType = 'drought_stress_simulation';
      const lossPct = waterCount === 0 ? 55 : 20;
      const stressedYield = estYieldKg * (1 - lossPct / 100);

      content = `### ☀️ Scenario Analysis: Drought & Heat Stress (14-Day Projection)\n\n`;
      content = content + `**Atmospheric Impact:**\n`;
      content = content + `- **Reference Evapotranspiration ($ET_0$):** Spikes from \`4.2 mm/day\` up to \`7.5 mm/day\` due to elevated vapor pressure deficit (VPD).\n`;
      content = content + `- **Soil Moisture Depletion:** Soil moisture drops rapidly from \`65%\` down to \`~22%\` within 4–6 days without irrigation.\n\n`;
      content = content + `**Crop Phenology & Physiological Response:**\n`;
      content = content + `- **Stomatal Conductance:** Crops close stomata to conserve water, halting $CO_2$ assimilation and photosynthesis.\n`;
      content = content + `- **Canopy Stunting:** Leaf area expansion halts; wheat heads abort spikelets and carrot taproots become woody and fibrous.\n`;
      content = content + `- **Projected Harvest Impact:** Projected yield drops by **-${lossPct}%** (from ~${estYieldKg.toFixed(1)} kg down to **${stressedYield.toFixed(1)} kg**).\n\n`;
      content = content + `**🛡️ Recommended Mitigations:**\n`;
      if (waterCount === 0) {
        content = content + `1. **Immediate Irrigation:** Add **Water Canals** directly adjacent to your crop rows to maintain root-zone moisture above 60%.\n`;
      } else {
        content = content + `1. **Irrigation Network Active:** Your ${waterCount} water canals provide a critical buffer, limiting drought losses to only ~${lossPct}%.\n`;
      }
      content = content + `2. **Mulching with Grass:** Place Grass plots around crop borders to suppress evaporative moisture loss.\n`;
      content = content + `3. **Tree Windbreaks:** Orchard trees reduce hot ambient wind speed, cutting crop transpiration demand by ~18%.`;
    }
    // 2. SCENARIO: Flood / Overwatering / Heavy Rain / Excess Water
    else if (p.includes('flood') || p.includes('heavy rain') || p.includes('too much water') || p.includes('overwater') || p.includes('storm')) {
      actionType = 'flood_saturation_simulation';
      content = `### 🌧️ Scenario Analysis: Heavy Rainfall & Soil Saturation\n\n`;
      content = content + `**Soil Hydrodynamics:**\n`;
      content = content + `- **Soil Water Saturation:** Moisture levels exceed \`85%\`, completely filling soil macropores and displacing dissolved oxygen.\n`;
      content = content + `- **Root Hypoxia:** Lack of oxygen induces root suffocation within 48 hours, inhibiting active nutrient uptake.\n\n`;
      content = content + `**Crop Specific Vulnerabilities:**\n`;
      content = content + `- **Carrot Patches:** Highly vulnerable to taproot splitting, rot, and cavity spot in standing water.\n`;
      content = content + `- **Wheat Plots:** Risk of root fungal pathogens (*Fusarium*) and lodging under waterlogged topsoil.\n\n`;
      content = content + `**🛡️ Recommended Layout Adjustments:**\n`;
      content = content + `1. Maintain perimeter drainage by flanking water canals with absorbent Grass Turf.\n`;
      content = content + `2. Ensure crop rows are aligned on elevated beds (2×2m grid layout).`;
    }
    // 3. SCENARIO: Crop Comparison / What to plant / Wheat vs Carrot vs Trees
    else if (p.includes('compare') || p.includes('carrot') || p.includes('wheat') || p.includes('tree') || p.includes('which crop') || p.includes('what to plant')) {
      actionType = 'crop_comparative_analysis';
      content = `### 🌾 Crop Variety Comparison & Plot Suitability\n\n`;
      content = content + `| Metric | 🌾 Wheat Crop | 🥕 Carrot Patch | 🌳 Orchard Tree |\n`;
      content = content + `|---|---|---|---|\n`;
      content = content + `| **Default Footprint** | 2.0 × 2.0 m (80×80px) | 2.0 × 2.0 m (80×80px) | 1.0 × 1.0 m (40×40px) |\n`;
      content = content + `| **Root Depth** | 40–60 cm (fibrous) | 25–35 cm (taproot) | 80–120 cm (deep) |\n`;
      content = content + `| **Water Demand ($K_c$)** | 1.15 (High at heading) | 1.05 (Moderate) | 0.85 (Steady) |\n`;
      content = content + `| **Growth Cycle** | ~100–120 Days | ~70–80 Days | Perennial Harvest |\n`;
      content = content + `| **Yield per Unit** | ~9.9 kg biomass | ~8.4 kg fresh root | ~12.0 kg fruit |\n\n`;
      content = content + `**Agronomic Recommendation for Your Plot:**\n`;
      if (crops.length === 0) {
        content = content + `- Start by placing **2–4 Wheat crops** near a **Water Canal** for reliable high-calorie grain production, and add **Carrot patches** for faster harvest turnaround.`;
      } else {
        content = content + `- You currently have **${wheatCount} Wheat** and **${carrotCount} Carrots**. This multi-crop polyculture helps diversify water uptake and pest resistance!`;
      }
    }
    // 4. SCENARIO: Yield Estimation / Harvest Output / Biomass
    else if (p.includes('yield') || p.includes('harvest') || p.includes('how much') || p.includes('output') || p.includes('biomass') || p.includes('kg')) {
      actionType = 'yield_biomass_computation';
      content = `### ⚖️ Projected Harvest & Yield Computation\n\n`;
      if (totalItems === 0) {
        content = content + `Currently, no crops are placed on the canvas. Drag Wheat, Carrots, or Orchard Trees from the palette onto the canvas to calculate projected yields.`;
      } else {
        content = content + `**Yield Breakdown by Asset:**\n`;
        if (wheatCount > 0) content = content + `- **Wheat (${wheatCount} plots):** ~${(wheatCount * 4.5 * 2.2).toFixed(1)} kg (${wheatCount} × 9.9 kg/plot)\n`;
        if (carrotCount > 0) content = content + `- **Carrots (${carrotCount} plots):** ~${(carrotCount * 3.8 * 2.2).toFixed(1)} kg (${carrotCount} × 8.4 kg/plot)\n`;
        if (treeCount > 0) content = content + `- **Orchard Trees (${treeCount} units):** ~${(treeCount * 12.0).toFixed(1)} kg fruit\n`;
        content = content + `\n**Total Estimated Field Biomass:** **~${estYieldKg.toFixed(1)} kg**\n\n`;
        content = content + `**Optimization Factors:**\n`;
        content = content + `- **Irrigation Coefficient:** ${waterCount > 0 ? '1.0× (Optimal with water sources)' : '0.65× (Reduced due to moisture deficit)'}\n`;
        content = content + `- **Canopy Spacing:** ${treeCount > 4 ? 'Dense tree canopy may shade understory crops' : 'Good solar exposure across beds'}`;
      }
    }
    // 5. SCENARIO: Layout / Advice / General Inspection
    else {
      actionType = 'farm_plot_inspection';
      content = `### 🌾 Plot Field Diagnosis & Agronomic Status\n\n`;
      if (totalItems === 0) {
        content = content + `Your farm canvas is currently empty.\n\n`;
        content = content + `**Recommended Next Steps:**\n`;
        content = content + `1. Drag **Wheat** or **Carrot** patches from the left sidebar onto the canvas.\n`;
        content = content + `2. Place a **Water Canal** adjacent to your crops to secure drip irrigation.\n`;
        content = content + `3. Surround with a **Wood Fence** to mark your plot boundaries.`;
      } else {
        content = content + `**Current Canvas Assets:**\n`;
        content = content + `- **Active Crops:** ${crops.length} plots (${wheatCount} Wheat, ${carrotCount} Carrots)\n`;
        content = content + `- **Infrastructure:** ${waterCount} Water Canals, ${treeCount} Trees, ${fenceCount} Fences, ${grassCount} Grass Plots\n`;
        content = content + `- **Projected Harvest:** **~${estYieldKg.toFixed(1)} kg**\n\n`;

        content = content + `**Soil & Water Balance:**\n`;
        if (waterCount === 0 && crops.length > 0) {
          content = content + `- ⚠️ **Water Deficit Alert:** No water bodies placed on the farm! Add a **Water Canal** adjacent to crop beds to prevent drought stress.\n`;
        } else {
          content = content + `- ✅ **Hydration:** Irrigation coverage is active. Root-zone soil moisture is balanced.\n`;
        }

        content = content + `\n**What-If Questions You Can Ask Me:**\n`;
        content = content + `- *"What will happen if a 2-week drought hits?"*\n`;
        content = content + `- *"What if there is heavy flood / rainfall?"*\n`;
        content = content + `- *"Compare wheat vs carrots for this layout"*\n`;
        content = content + `- *"How much yield will I harvest from this plot?"*`;
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

    const systemInstruction = `You are DigiFarm's AI Agronomist and Digital Farmland Twin reasoning engine.
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = err.error?.message || `Gemini API returned HTTP status ${res.status}`;
      throw new Error(errMsg);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return {
      final_response: candidateText,
      execution_steps: [
        {
          step: 1,
          thought: 'Invoked Google Gemini 1.5 Flash with live farm layout context and chat history.',
          action: 'gemini_multiturn_reasoning',
          result: { model: 'gemini-1.5-flash-latest', status: 'success' },
        },
      ],
      actions_taken: ['gemini_inference'],
      provider_used: 'Google Gemini',
      model_used: 'gemini-1.5-flash-latest',
    };
  };

  /**
   * Direct Ollama client in browser when local Ollama daemon is running
   */
  const callDirectOllama = async (prompt, chatHistory) => {
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

    const systemInstruction = `You are DigiFarm's AI Agronomist and Digital Farmland Twin reasoning engine.
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

    let modelName = 'llama3.2:1b';
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
          modelName = available.includes('llama3.2:1b') ? 'llama3.2:1b' : available[0];
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
        options: { temperature: 0.3 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data = await res.json();
    const reply = data.message?.content || 'No response generated.';

    return {
      final_response: reply,
      execution_steps: [
        {
          step: 1,
          thought: `Queried local Ollama model (${modelName}) with farm context and conversation history.`,
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
   * Send user prompt to Autonomous AI Agronomist Agent
   */
  const sendAgentChat = useCallback(async (prompt, chatHistory = [], maxSteps = 5) => {
    // 1. If user provided a Gemini API Key (in localStorage or env), query live Gemini model
    const geminiKey = typeof window !== 'undefined' 
      ? (localStorage.getItem('DIGIFARM_GEMINI_KEY') || import.meta.env?.VITE_GEMINI_API_KEY)
      : null;

    if (geminiKey && geminiKey.trim()) {
      try {
        const geminiRes = await callDirectGemini(geminiKey.trim(), prompt, chatHistory);
        return { success: true, data: geminiRes };
      } catch (geminiErr) {
        console.error('Direct Gemini API error:', geminiErr);
        return {
          success: false,
          error: `Gemini API Error: ${geminiErr.message}. Please check your API key or network connection.`,
        };
      }
    }

    // 2. Direct Local Ollama connection (100% local, no key needed)
    try {
      const ollamaRes = await callDirectOllama(prompt, chatHistory);
      return { success: true, data: ollamaRes };
    } catch (ollamaErr) {
      console.debug('Direct Ollama call not available, checking backend / local fallback:', ollamaErr);
    }

    // 3. If backend is connected, use FastAPI backend orchestrator
    if (state.farmId && state.backendStatus === 'connected') {
      try {
        if (state.items.length > 0) {
          await syncCanvasToBackend();
        }

        const response = await apiClient.sendAgentChat(state.farmId, {
          prompt,
          chatHistory,
          maxSteps,
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
        console.warn('Backend agent chat call failed, falling back to local agronomist:', err);
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
    // Canvas actions
    addItem,
    updatePosition,
    updateDimensions,
    selectItem,
    deselectAll,
    deleteItem,
    clearCanvas,
    toggleSnap,
    bringToFront,
    snapCoordinate,
    // Backend & simulation actions
    connectBackend,
    syncCanvasToBackend,
    stepSimulation,
    runWhatIf,
    sendAgentChat,
    saveFarmSnapshot,
    updateFarmProfile,
  }), [
    state,
    selectedItem,
    addItem,
    updatePosition,
    updateDimensions,
    selectItem,
    deselectAll,
    deleteItem,
    clearCanvas,
    toggleSnap,
    bringToFront,
    snapCoordinate,
    connectBackend,
    syncCanvasToBackend,
    stepSimulation,
    runWhatIf,
    sendAgentChat,
    saveFarmSnapshot,
    updateFarmProfile,
  ]);

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};
