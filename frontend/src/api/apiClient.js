/**
 * GreenTwin REST API Client
 * Connects frontend UI to FastAPI backend simulation engine, farm state manager, and AI agent orchestrator.
 */

const API_BASE = import.meta.env?.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost:8000');

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { detail: res.statusText };
      }
      throw new ApiError(
        errorData?.detail || `API request failed with status ${res.status}`,
        res.status,
        errorData
      );
    }
    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network connection failed', 0, null);
  }
}

export const apiClient = {
  /**
   * Check backend health status
   */
  async checkHealth() {
    return request('/health');
  },

  /**
   * Root system info
   */
  async getRootInfo() {
    return request('/');
  },

  /**
   * Farm Management
   */
  async createFarm(name = 'My Virtual Farm', width = 10, height = 10) {
    return request('/api/v1/farm/create', {
      method: 'POST',
      body: JSON.stringify({ name, width, height }),
    });
  },

  async listSavedFarms() {
    return request('/api/v1/farm/list');
  },

  async getFarmState(farmId) {
    return request(`/api/v1/farm/${encodeURIComponent(farmId)}`);
  },

  async getFarmSummary(farmId) {
    return request(`/api/v1/farm/${encodeURIComponent(farmId)}/summary`);
  },

  async getFarmProfile(farmId) {
    return request(`/api/v1/farm/${encodeURIComponent(farmId)}/profile`);
  },

  async updateFarmProfile(farmId, profileData) {
    return request(`/api/v1/farm/${encodeURIComponent(farmId)}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  async updateTile(farmId, { x, y, cropType, irrigationType, irrigationRateMm, soilMoisturePct, soilNitrogenPpm, soilPh }) {
    return request(`/api/v1/farm/${encodeURIComponent(farmId)}/tile/update`, {
      method: 'POST',
      body: JSON.stringify({
        x,
        y,
        crop_type: cropType,
        irrigation_type: irrigationType,
        irrigation_rate_mm: irrigationRateMm,
        soil_moisture_pct: soilMoisturePct,
        soil_nitrogen_ppm: soilNitrogenPpm,
        soil_ph: soilPh,
      }),
    });
  },

  async batchPlant(farmId, { cropType, startX, startY, endX, endY }) {
    return request(`/api/v1/farm/${encodeURIComponent(farmId)}/batch/plant`, {
      method: 'POST',
      body: JSON.stringify({
        crop_type: cropType,
        start_x: startX,
        start_y: startY,
        end_x: endX,
        end_y: endY,
      }),
    });
  },

  async saveFarmSnapshot(farmId) {
    return request(`/api/v1/farm/${encodeURIComponent(farmId)}/save`, {
      method: 'POST',
    });
  },

  /**
   * Simulation Engine
   */
  async stepSimulation(farmId, { days = 1, tempOverrideC, rainfallOverrideMm, solarRadiationOverrideWm2 } = {}) {
    return request(`/api/v1/simulation/${encodeURIComponent(farmId)}/step`, {
      method: 'POST',
      body: JSON.stringify({
        days,
        temp_override_c: tempOverrideC,
        rainfall_override_mm: rainfallOverrideMm,
        solar_radiation_override_wm2: solarRadiationOverrideWm2,
      }),
    });
  },

  async runWhatIf(farmId, { days = 14, candidateActions = [], weatherModifier = null } = {}) {
    return request(`/api/v1/simulation/${encodeURIComponent(farmId)}/what-if`, {
      method: 'POST',
      body: JSON.stringify({
        days,
        candidate_actions: candidateActions,
        weather_modifier: weatherModifier,
      }),
    });
  },

  /**
   * AI Orchestrator Agent
   */
  async getAgentStatus() {
    return request('/api/v1/agent/status');
  },

  async sendAgentChat(farmId, { prompt, chatHistory = [], maxSteps = 5, geminiApiKey = null, model = null, preferredProvider = 'auto', frontendFarmContext = null }) {
    return request(`/api/v1/agent/${encodeURIComponent(farmId)}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        chat_history: chatHistory,
        max_steps: maxSteps,
        gemini_api_key: geminiApiKey,
        model,
        preferred_provider: preferredProvider,
        frontend_farm_context: frontendFarmContext,
      }),
    });
  },
};
