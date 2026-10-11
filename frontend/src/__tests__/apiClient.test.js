import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../api/apiClient';

describe('GreenTwin API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('checks backend health', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    });

    const result = await apiClient.checkHealth();
    expect(result.status).toBe('healthy');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.any(Object)
    );
  });

  it('creates farm session', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'created',
        farm_id: 'farm-123',
        name: 'Demo Farm',
        world: { width: 10, height: 10 },
      }),
    });

    const result = await apiClient.createFarm('Demo Farm', 10, 10);
    expect(result.farm_id).toBe('farm-123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/farm/create'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('steps simulation with days and overrides', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'stepped',
        current_day: 2,
        environment: { day: 2 },
      }),
    });

    const result = await apiClient.stepSimulation('farm-123', {
      days: 1,
      tempOverrideC: 25.0,
    });

    expect(result.current_day).toBe(2);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/simulation/farm-123/step'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('runs what-if scenario comparison', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        farm_id: 'farm-123',
        simulated_days: 14,
        baseline: { total_yield_kg: 50 },
        candidate: { total_yield_kg: 75 },
      }),
    });

    const result = await apiClient.runWhatIf('farm-123', { days: 14 });
    expect(result.candidate.total_yield_kg).toBe(75);
  });

  it('sends agent chat prompt and receives multi-step response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        final_response: 'Irrigation optimized.',
        actions_taken: ['Executed apply_irrigation'],
        execution_steps: [{ step_num: 1 }],
        provider_used: 'gemini',
        model_used: 'gemini-2.5-flash',
      }),
    });

    const result = await apiClient.sendAgentChat('farm-123', {
      prompt: 'Optimize irrigation',
    });

    expect(result.final_response).toBe('Irrigation optimized.');
    expect(result.actions_taken).toHaveLength(1);
  });

  it('fetches agent status and sends provider options in agent chat', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gemini: { configured: true, default_model: 'gemini-2.5-flash' },
          ollama: { reachable: true, default_model: 'qwen3.5' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          final_response: 'Qwen analysis completed.',
          actions_taken: [],
          execution_steps: [],
          provider_used: 'ollama',
          model_used: 'qwen3.5',
        }),
      });

    const status = await apiClient.getAgentStatus();
    expect(status.ollama.default_model).toBe('qwen3.5');

    const chatRes = await apiClient.sendAgentChat('farm-123', {
      prompt: 'Check crop vitals',
      geminiApiKey: 'AIzaSy123',
      model: 'qwen3.5',
      preferredProvider: 'ollama',
    });
    expect(chatRes.provider_used).toBe('ollama');
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/agent/farm-123/chat'),
      expect.objectContaining({
        body: expect.stringContaining('"preferred_provider":"ollama"'),
      })
    );
  });

  it('fetches and updates farm profile', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          farm_name: 'Green Acres',
          latitude_deg: 36.5,
          soil_texture: 'loam',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'updated',
          profile: {
            farm_name: 'Sunny Ridge',
            latitude_deg: 42.0,
            soil_texture: 'sandy',
          },
        }),
      });

    const profile = await apiClient.getFarmProfile('farm-123');
    expect(profile.soil_texture).toBe('loam');

    const updateRes = await apiClient.updateFarmProfile('farm-123', {
      farm_name: 'Sunny Ridge',
      latitude_deg: 42.0,
      soil_texture: 'sandy',
    });
    expect(updateRes.status).toBe('updated');
    expect(updateRes.profile.soil_texture).toBe('sandy');
  });
});
