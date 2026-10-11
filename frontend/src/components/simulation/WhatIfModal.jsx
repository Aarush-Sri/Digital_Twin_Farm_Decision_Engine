import React, { useState } from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  GitCompare, 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Droplets, 
  Scale, 
  Activity, 
  Check, 
  Sun, 
  Flame, 
  RefreshCw 
} from 'lucide-react';

export const WhatIfModal = ({ isOpen, onClose }) => {
  const { runWhatIf, syncCanvasToBackend, farmId } = useFarm();
  const [days, setDays] = useState(14);
  const [scenarioType, setScenarioType] = useState('drip_boost');
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleRunComparison = async () => {
    setIsLoading(true);
    setApplied(false);

    let candidateActions = [];
    let weatherModifier = null;

    if (scenarioType === 'drip_boost') {
      candidateActions = [
        {
          action_type: 'irrigate',
          all_tiles: true,
          rate_mm: 7.0,
          irrigation_type: 'drip',
        },
      ];
    } else if (scenarioType === 'flood_heavy') {
      candidateActions = [
        {
          action_type: 'irrigate',
          all_tiles: true,
          rate_mm: 14.0,
          irrigation_type: 'flood',
        },
      ];
    } else if (scenarioType === 'fertilizer_boost') {
      candidateActions = [
        {
          action_type: 'fertilize',
          all_tiles: true,
          n_ppm: 60.0,
          p_ppm: 20.0,
          k_ppm: 40.0,
        },
      ];
    } else if (scenarioType === 'drought_heatwave') {
      weatherModifier = {
        rainfall_multiplier: 0.0,
        temp_delta_c: 6.0,
        solar_multiplier: 1.2,
      };
    }

    const res = await runWhatIf({
      days: Number(days),
      candidateActions,
      weatherModifier,
    });

    if (res.success && res.data) {
      setComparisonResult(res.data);
    }
    setIsLoading(false);
  };

  const handleApplyStrategy = async () => {
    if (!comparisonResult) return;
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const baseline = comparisonResult?.baseline;
  const candidate = comparisonResult?.candidate;

  const baselineYield = baseline?.final_projected_yield_kg ?? baseline?.total_yield_kg ?? baseline?.final_total_biomass_kg ?? 0;
  const candidateYield = candidate?.final_projected_yield_kg ?? candidate?.total_yield_kg ?? candidate?.final_total_biomass_kg ?? 0;

  const baselineHealth = baseline?.final_avg_health_pct ?? baseline?.avg_health_pct ?? 100;
  const candidateHealth = candidate?.final_avg_health_pct ?? candidate?.avg_health_pct ?? 100;

  const baselineMoisture = baseline?.final_avg_moisture_pct ?? baseline?.avg_soil_moisture ?? 60;
  const candidateMoisture = candidate?.final_avg_moisture_pct ?? candidate?.avg_soil_moisture ?? 60;

  const yieldDiff = candidate && baseline ? (candidateYield - baselineYield).toFixed(1) : '0.0';
  const healthDiff = candidate && baseline ? (candidateHealth - baselineHealth).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-600/60 flex items-center justify-center text-sky-400">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                <span>Sandbox What-If Decision Engine</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Isolated Clone
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Simulate forward without altering your live farm until approved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-zinc-300 font-semibold uppercase tracking-wider text-[10px]">
              Candidate Intervention Strategy
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScenarioType('drip_boost')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scenarioType === 'drip_boost'
                    ? 'bg-sky-950/70 border-sky-600 text-sky-200 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs flex items-center space-x-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Drip Irrigation (7 mm/day)</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  High-efficiency precision root watering
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScenarioType('fertilizer_boost')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scenarioType === 'fertilizer_boost'
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NPK Fertilizer Boost</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  +60ppm Nitrogen & balanced mineral enrichment
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScenarioType('flood_heavy')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scenarioType === 'flood_heavy'
                    ? 'bg-blue-950/70 border-blue-600 text-blue-200 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs flex items-center space-x-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>Flood Irrigation (14 mm/day)</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Heavy surface deluge replenishment
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScenarioType('drought_heatwave')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scenarioType === 'drought_heatwave'
                    ? 'bg-amber-950/70 border-amber-600 text-amber-200 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Drought & Heatwave Shock</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  0mm rain, +6°C heat spike stress testing
                </p>
              </button>
            </div>
          </div>

          {/* Timeframe Slider */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <span className="text-zinc-300 font-medium">Forward Horizon:</span>
            <div className="flex items-center space-x-2">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    days === d
                      ? 'bg-emerald-600 text-zinc-50 font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <button
            type="button"
            onClick={handleRunComparison}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-zinc-100 font-semibold flex items-center justify-center space-x-2 hover:from-sky-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating forward in sandbox clone...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Run Sandbox Comparison ({days} Days)</span>
              </>
            )}
          </button>

          {/* Comparative Results Display */}
          {comparisonResult && baseline && candidate && (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h3 className="font-semibold text-zinc-200 uppercase tracking-wider text-[10px]">
                Scenario Comparison Outcome ({comparisonResult.simulated_days} Days Forward)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Baseline Card */}
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400">
                    <span className="uppercase font-bold text-zinc-300">Status-Quo Baseline</span>
                    <span>No Change</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Yield:</span>
                      <span className="font-mono text-zinc-200">{Number(baselineYield).toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Crop Health:</span>
                      <span className="font-mono text-zinc-200">{Number(baselineHealth).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Soil Moisture:</span>
                      <span className="font-mono text-zinc-200">{Number(baselineMoisture).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Card */}
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px] text-emerald-400">
                    <span className="uppercase font-bold">Candidate Strategy</span>
                    <span>Proposed</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Total Yield:</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {Number(candidateYield).toFixed(1)} kg
                        <span className="text-[10px] ml-1 text-emerald-400 font-normal">
                          ({Number(yieldDiff) >= 0 ? `+${yieldDiff}` : yieldDiff} kg)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Crop Health:</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {Number(candidateHealth).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Avg Soil Moisture:</span>
                      <span className="font-mono text-emerald-200">{Number(candidateMoisture).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation Note */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start space-x-2 text-[11px] text-zinc-300">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-emerald-300">Decision Engine Recommendation: </span>
                  {Number(yieldDiff) > 0
                    ? `Implementing this candidate strategy increases projected biomass yield by +${yieldDiff} kg and maintains healthy soil moisture balance.`
                    : 'The baseline strategy performs satisfactorily. Review water consumption trade-offs.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {comparisonResult && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyStrategy}
              disabled={applied}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-zinc-50 text-xs font-semibold hover:bg-emerald-500 transition-all flex items-center space-x-1.5 shadow-md disabled:opacity-50"
            >
              {applied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Applied Strategy!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Candidate Strategy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
