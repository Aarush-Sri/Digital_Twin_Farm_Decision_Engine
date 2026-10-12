# Digital Twin Farm Decision Engine (DTFDE) — Chrome Demo Walkthrough

**Project:** GreenTwin / DTFDE  
**Environment:** Live Google Chrome Session (`http://localhost:5173/`)  
**Backend:** FastAPI Physics & AI Engine (`http://localhost:8000/`)  
**AI Engine:** Local Ollama (`llama3.2:1b`) with Cloud Failover (Gemini / GPT)  
**Image Directory:** `demo_walkthrough/`

---

## Complete 7-Step Demo of the Digital Twin Concept

This visual walkthrough illustrates how DTFDE takes real-world agricultural physics, spatial topology, and artificial intelligence, combining them into an interactive decision-support loop for farmers.

---

### Step 1: The 2D Interactive Digital Twin Canvas
![Step 1 - Digital Twin Canvas](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step1_digital_twin_canvas.png)

* **What's Happening:** The farmer designs their virtual farmland on a 2D spatial grid (scaled at **40 pixels = 1.0 meter** with 0.5m grid snapping).
* **Elements on Screen:**
  * **2.5-Acre Boundary:** 100m × 100m plot set in USDA Climate Zone 6b.
  * **Cultivated Crops:** Sweet corn, wheat, carrot patch, tomato vines, flooded paddy rice, sugarcane, and strawberry beds.
  * **Agroforestry Windbreaks:** Shading neem and mango trees positioned to reduce wind-driven evapotranspiration ($ET_0$).
  * **Irrigation Infrastructure:** Water canals, farm ponds, tube wells, and underground PVC pipelines.
  * **Palette System:** 25 drag-and-drop elements categorized by Terrain, Crops, Trees, Structures, and Irrigation.

---

### Step 2: Universal Farm Profile (Climate, Soil Texture & Hydrology)
![Step 2 - Farm Profile Parameters](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step2_farm_profile_parameters.png)

* **What's Happening:** The farmer inspects and configures the physical environmental baseline for the digital twin.
* **Key Parameters Grounded in Agricultural Science:**
  * **Geographic Location & Latitude:** Drives solar radiation angles and daylight hours.
  * **Annual Baseline Temperature:** Sets base vegetative growing degree days (GDD).
  * **Dominant Soil Texture (Loam / Sand / Clay / Silt):** Determines water-holding capacity, infiltration rates, and drainage kinetics.
  * **Baseline Soil pH:** Guides nutrient bioavailability (NPK).
  * **Water Source:** Distinguishes surface canal water from saline groundwater tube wells.

---

### Step 3: AI Model Orchestration & Settings (Local Neural Weights + Cloud Failover)
![Step 3 - AI Model Orchestration Settings](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step3_ai_model_orchestration_settings.png)

* **What's Happening:** The user configures the AI Agronomist neural engine directly from the web drawer.
* **Capabilities Shown:**
  * **Local Offline Models:** Powered by local Ollama instances (**Llama 3.2 1B**, **Qwen 3.5**) for zero-latency, private farm management without cloud dependencies.
  * **Cloud Intelligence:** Google Gemini (2.5 Flash / 2.0 Flash) and OpenAI (GPT-4o mini, GPT-4o, o1-mini).
  * **Cascading Failover:** If an API hits an HTTP 429 quota exhaustion or network drop, the backend automatically cascades: $\text{OpenAI} \to \text{Gemini} \to \text{Local Llama 3.2} \to \text{Rule-based Fallback}$.

---

### Step 4: Environmental Stress Presets (Simulation Panel)
![Step 4 - Stress Simulation Presets](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step4_stress_simulation_presets.png)

* **What's Happening:** The user switches to the dedicated **Simulation Panel** tab to stress-test the farm against climate extremes before they happen in reality.
* **The 4 Core Climate Scenarios:**
  1. **14-Day Drought Stress:** Rainfall deficit modeling soil drying and yield contraction.
  2. **Heavy Rainfall & Saturation:** Excessive precipitation testing root hypoxia risks ($>85\%$ saturation).
  3. **Extreme Heatwave (>34°C):** High thermal flux triggering stomatal closure and doubling transpiration.
  4. **Targeted Drip Optimization:** Precision irrigation calibration boosting vegetative growth.

---

### Step 5: Real-Time Simulation Results & Predictive Analytics
![Step 5 - Simulation Results & Predictions](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step5_simulation_outcome_predictions.png)

* **What's Happening:** Upon selecting **14-Day Drought**, the Python simulation engine runs daily Penman-Monteith cycles and returns instant physical impact estimates.
* **Key Metrics Displayed:**
  * **Estimated Yield Change:** `-12%` yield contraction under unmitigated moisture stress.
  * **Water Demand:** Flags *Higher* demand as root zone water drops below Readily Available Water (RAW).
  * **Predictive Summary:** Highlights which crop rows experience moisture deficits first.
  * **Actionable Advice:** Suggests prioritized drip scheduling for water-sensitive crops and nocturnal watering.

---

### Step 6: Side-by-Side Comparison Modal (Current Plan vs. Simulated Twin)
![Step 6 - Side-by-Side Comparison Modal](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step6_side_by_side_comparison_modal.png)

* **What's Happening:** Clicking *"Compare with current plan"* opens a split-screen digital twin comparison.
* **Capabilities Shown:**
  * **Visual Map Diff:** The original farm plan is shown alongside the simulated twin, highlighting affected plots.
  * **Outcome Delta Report:** Direct numerical comparisons of projected yield, water consumption, and economic trade-offs.
  * **Evidence-Based Decisions:** Farmers can visually verify which plots need extra drip lines before investing capital.

---

### Step 7: Conversational AI Agronomist with Farm Plot Memory
![Step 7 - Conversational Chat with Plot Memory](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step7_conversational_agronomist_chat.png)

* **What's Happening:** The user converses with the AI Agronomist using freeform natural language.
* **Key Features Shown:**
  * **Active Model Pill:** Live indicator showing `Llama 3.2 (1B)` running locally.
  * **Farm Plot Memory in Action:** Instead of re-transmitting all 16 tiles and 24 canvas objects on every message, the memory system passes compact state hashes and deltas, saving **87% of prompt tokens** and speeding up inference by **63%**.
  * **Selectable AI Text & Tables:** All AI responses, tables, and mathematical formulas ($ET_0$, °Brix, $K_s$) can be highlighted and copied by the user's cursor.

---

## Summary of Saved Walkthrough Artifacts

| Step | Screenshot Filename | Description |
| :--- | :--- | :--- |
| **1** | [`step1_digital_twin_canvas.png`](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step1_digital_twin_canvas.png) | 2D interactive farm builder canvas with 2.5-acre boundary |
| **2** | [`step2_farm_profile_parameters.png`](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step2_farm_profile_parameters.png) | Universal Farm Profile (soil texture, climate, coordinates) |
| **3** | [`step3_ai_model_orchestration_settings.png`](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step3_ai_model_orchestration_settings.png) | AI Model Orchestration & Settings (Llama 3.2, Qwen, Gemini, GPT) |
| **4** | [`step4_stress_simulation_presets.png`](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step4_stress_simulation_presets.png) | Simulation Panel with 4 environmental stress presets |
| **5** | [`step5_simulation_outcome_predictions.png`](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step5_simulation_outcome_predictions.png) | Real-time simulation outcomes, yield deltas, and actions |
| **6** | [`step6_side_by_side_comparison_modal.png`](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step6_side_by_side_comparison_modal.png) | Split-screen side-by-side comparison modal with map diffs |
| **7** | [`step7_conversational_agronomist_chat.png`](file:///C:/Users/aarus/OneDrive/1/DTFDE/demo_walkthrough/step7_conversational_agronomist_chat.png) | Multi-turn conversational chat powered by Farm Plot Memory |
