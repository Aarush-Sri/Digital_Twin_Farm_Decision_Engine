import React, { useState } from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  X, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Droplets, 
  Scale, 
  DollarSign, 
  Sparkles,
  Layers,
  CheckCircle2,
  Download
} from 'lucide-react';
import { getItemDefinition, pxToMeters } from '../../types/farm';

export const ScenarioComparisonModal = ({ isOpen, onClose, scenarioData }) => {
  const { items, farmSettings } = useFarm();
  const [activeTab, setActiveTab] = useState('side_by_side'); // 'side_by_side' | 'delta_table'

  if (!isOpen) return null;

  const scenario = scenarioData || {
    id: 'drought',
    title: 'Reduced rainfall for 14 days',
    type: 'Drought & Heatwave',
    yieldDeltaPct: -18,
    waterDemandStr: 'Higher (+45%)',
    soilMoistureDropPct: -38,
    costImpactUsd: -42.50,
  };

  const waterSources = items.filter(
    (i) => i.type === 'water' || i.type === 'well' || i.type === 'pond' || i.type === 'sprinkler'
  );

  // Calculate baseline yields
  const wheatCount = items.filter((i) => i.type === 'wheat').length;
  const carrotCount = items.filter((i) => i.type === 'carrot').length;
  const tomatoCount = items.filter((i) => i.type === 'tomato').length;
  const cornCount = items.filter((i) => i.type === 'corn').length;
  const pumpkinCount = items.filter((i) => i.type === 'pumpkin').length;
  const strawberryCount = items.filter((i) => i.type === 'strawberry').length;
  const treeCount = items.filter((i) => i.type.includes('tree')).length;

  const baselineYieldKg = Number((
    wheatCount * 9.9 + 
    carrotCount * 8.4 + 
    tomatoCount * 11.2 + 
    cornCount * 14.5 + 
    pumpkinCount * 22.0 + 
    strawberryCount * 6.5 + 
    treeCount * 12.0
  ).toFixed(1));

  // If farm has water sources near crops, mitigate losses
  const hasWaterBuffer = waterSources.length > 0;
  const effectiveYieldDeltaPct = hasWaterBuffer 
    ? Math.round(scenario.yieldDeltaPct * 0.45) 
    : scenario.yieldDeltaPct;

  const simulatedYieldKg = Number(
    Math.max(0, baselineYieldKg * (1 + effectiveYieldDeltaPct / 100)).toFixed(1)
  );

  const baselineWaterL = Math.max(20, items.length * 8);
  const simulatedWaterL = Math.round(baselineWaterL * 1.55);

  const baselineRevUsd = Number((baselineYieldKg * 3.2).toFixed(2));
  const simulatedRevUsd = Number((simulatedYieldKg * 3.2).toFixed(2));
  const revenueDeltaUsd = Number((simulatedRevUsd - baselineRevUsd).toFixed(2));

  // Check if an item is buffered by nearby water source (< 140px)
  const isItemBuffered = (item) => {
    if (waterSources.length === 0) return false;
    return waterSources.some((w) => {
      const dx = Math.abs(w.x - item.x);
      const dy = Math.abs(w.y - item.y);
      return Math.sqrt(dx * dx + dy * dy) < 160;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-5xl bg-stone-950 border-2 border-amber-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-amber-950/80 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 border border-yellow-300 flex items-center justify-center text-stone-950 shadow-md">
              <Sparkles className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-amber-200 tracking-wide font-sans">
                  Digital Twin Scenario Comparison
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 uppercase">
                  {scenario.type || 'What-If Simulation'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Original farm plan compared beside simulated twin: <strong>{scenario.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-stone-900 p-1 rounded-lg border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('side_by_side')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'side_by_side'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Side-by-Side Plots
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('delta_table')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'delta_table'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Outcome Delta Report
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Top Key Indicator Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span>Projected Yield Delta</span>
                <Scale className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-1.5 font-mono">
                <span className={`text-xl font-extrabold ${effectiveYieldDeltaPct < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {effectiveYieldDeltaPct > 0 ? `+${effectiveYieldDeltaPct}%` : `${effectiveYieldDeltaPct}%`}
                </span>
                <span className="text-xs text-stone-400">
                  ({simulatedYieldKg - baselineYieldKg > 0 ? '+' : ''}{(simulatedYieldKg - baselineYieldKg).toFixed(1)} kg)
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block">
                {baselineYieldKg} kg → {simulatedYieldKg} kg
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span>Water Demand Surge</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-baseline space-x-1.5 font-mono">
                <span className="text-xl font-extrabold text-sky-300">
                  +{simulatedWaterL - baselineWaterL} L/d
                </span>
                <span className="text-xs text-stone-400">(+55%)</span>
              </div>
              <span className="text-[10px] text-stone-500 block">
                {baselineWaterL} L → {simulatedWaterL} L/day
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span>Economic Impact</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-1.5 font-mono">
                <span className={`text-xl font-extrabold ${revenueDeltaUsd < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {revenueDeltaUsd > 0 ? `+$${revenueDeltaUsd}` : `-$${Math.abs(revenueDeltaUsd)}`}
                </span>
                <span className="text-xs text-stone-400">Revenue</span>
              </div>
              <span className="text-[10px] text-stone-500 block">
                ${baselineRevUsd} → ${simulatedRevUsd}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span>Irrigation Buffer Protection</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-1.5 font-mono">
                <span className={`text-xl font-extrabold ${hasWaterBuffer ? 'text-emerald-300' : 'text-amber-400'}`}>
                  {hasWaterBuffer ? 'Active' : 'Missing'}
                </span>
                <span className="text-xs text-stone-400">
                  ({waterSources.length} sources)
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block">
                {hasWaterBuffer ? 'Buffers crop stress by ~55%' : 'Plots fully exposed to dry spell'}
              </span>
            </div>
          </div>

          {/* TAB 1: Side by Side Canvas Comparison */}
          {activeTab === 'side_by_side' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT: Original Farm Plan */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border-2 border-stone-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      Original Farm Plan (Baseline)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                    Normal Weather • 100% Potential
                  </span>
                </div>

                {/* Canvas Mini Mock View */}
                <div className="relative h-64 bg-stone-950/90 rounded-xl border border-stone-800 overflow-hidden p-2 flex flex-col justify-between">
                  <div className="absolute inset-0 opacity-20 pointer-events-none farm-canvas-grid" />
                  
                  {/* Items representation */}
                  <div className="relative w-full h-full">
                    {items.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-stone-500">
                        No crops placed yet on canvas.
                      </div>
                    ) : (
                      items.map((item) => {
                        const def = getItemDefinition(item.type);
                        const isCropPlot = def.category === 'Crops' || def.category === 'Trees';
                        return (
                          <div
                            key={`base-${item.id}`}
                            className="absolute rounded border transition-all flex items-center justify-center text-[9px] font-mono font-bold text-stone-100 shadow-sm"
                            style={{
                              left: `${Math.min(220, item.x / 3)}px`,
                              top: `${Math.min(180, item.y / 3)}px`,
                              width: `${Math.max(24, item.width / 3)}px`,
                              height: `${Math.max(20, item.height / 3)}px`,
                              backgroundColor: def.color.bg,
                              borderColor: def.color.border,
                            }}
                          >
                            <span className="truncate px-0.5">
                              {item.type.slice(0, 4)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Bottom Mini Status */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] text-stone-400 bg-stone-900/90 px-2.5 py-1 rounded border border-stone-800 font-mono">
                    <span>Est. Yield: <strong className="text-emerald-300">{baselineYieldKg} kg</strong></span>
                    <span>Soil Moisture: <strong className="text-sky-300">65% (Optimal)</strong></span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-stone-300">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Unstressed transpiration rate (ET₀ = 4.2 mm/day).</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Roots absorb balanced nitrogen, phosphorus, and potassium.</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Simulated Twin Scenario */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border-2 border-amber-600/60 shadow-[0_0_20px_rgba(217,119,6,0.15)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Simulated Farm Twin ({scenario.title})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    Affected Plots Highlighted
                  </span>
                </div>

                {/* Simulated Canvas Mock View with Highlighted Stress */}
                <div className="relative h-64 bg-stone-950/90 rounded-xl border border-amber-900/60 overflow-hidden p-2 flex flex-col justify-between">
                  <div className="absolute inset-0 opacity-15 pointer-events-none farm-canvas-grid" />
                  
                  {/* Items representation with simulated stress glow */}
                  <div className="relative w-full h-full">
                    {items.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-stone-500">
                        No crops placed yet on canvas.
                      </div>
                    ) : (
                      items.map((item) => {
                        const def = getItemDefinition(item.type);
                        const isCropPlot = def.category === 'Crops' || def.category === 'Trees';
                        const buffered = isItemBuffered(item);

                        return (
                          <div
                            key={`sim-${item.id}`}
                            className={`absolute rounded border transition-all flex items-center justify-center text-[9px] font-mono font-bold shadow-md ${
                              isCropPlot && !buffered
                                ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-950/80 text-amber-200 animate-pulse'
                                : buffered
                                ? 'ring-1 ring-emerald-500 border-emerald-400 text-emerald-200 bg-emerald-950/80'
                                : 'border-stone-700 bg-stone-900 text-stone-400'
                            }`}
                            style={{
                              left: `${Math.min(220, item.x / 3)}px`,
                              top: `${Math.min(180, item.y / 3)}px`,
                              width: `${Math.max(24, item.width / 3)}px`,
                              height: `${Math.max(20, item.height / 3)}px`,
                            }}
                          >
                            <span className="truncate px-0.5">
                              {isCropPlot && !buffered ? '⚠️ STRESS' : buffered ? '🛡️ OK' : def.label.slice(0, 4)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Bottom Mini Status */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] bg-stone-900/95 px-2.5 py-1 rounded border border-amber-800/80 font-mono">
                    <span className="text-amber-200">
                      Sim. Yield: <strong>{simulatedYieldKg} kg ({effectiveYieldDeltaPct}%)</strong>
                    </span>
                    <span className="text-amber-400">
                      Soil Moisture: <strong>{hasWaterBuffer ? '42% (Buffered)' : '22% (Severe Deficit)'}</strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-stone-300">
                  <div className="flex items-center space-x-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Stomatal closure triggers premature senescence without irrigation.</span>
                  </div>
                  {hasWaterBuffer ? (
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Nearby irrigation canals reduced catastrophic losses by ~55%.</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Zero water buffers active! All plots suffer severe moisture stress.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Detailed Outcome Delta Report Table */}
          {activeTab === 'delta_table' && (
            <div className="space-y-4">
              <div className="border border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-900/90 border-b border-stone-800 text-stone-400 font-mono text-[11px]">
                      <th className="p-3">Agricultural Metric</th>
                      <th className="p-3">Baseline Plan</th>
                      <th className="p-3">Simulated Twin</th>
                      <th className="p-3">Delta Difference</th>
                      <th className="p-3">Agronomic Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    <tr className="hover:bg-stone-900/40">
                      <td className="p-3 font-sans font-medium text-stone-200">Total Crop Biomass Yield</td>
                      <td className="p-3 text-emerald-300">{baselineYieldKg} kg</td>
                      <td className="p-3 text-amber-300">{simulatedYieldKg} kg</td>
                      <td className={`p-3 font-bold ${effectiveYieldDeltaPct < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {effectiveYieldDeltaPct}% ({(simulatedYieldKg - baselineYieldKg).toFixed(1)} kg)
                      </td>
                      <td className="p-3 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          {effectiveYieldDeltaPct < -15 ? 'High Risk' : 'Moderate'}
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-900/40">
                      <td className="p-3 font-sans font-medium text-stone-200">Irrigation Demand per Day</td>
                      <td className="p-3 text-stone-300">{baselineWaterL} L/day</td>
                      <td className="p-3 text-sky-300">{simulatedWaterL} L/day</td>
                      <td className="p-3 font-bold text-sky-400">+{simulatedWaterL - baselineWaterL} L/day (+55%)</td>
                      <td className="p-3 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                          Water Deficit
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-900/40">
                      <td className="p-3 font-sans font-medium text-stone-200">Economic Harvest Revenue</td>
                      <td className="p-3 text-stone-300">${baselineRevUsd}</td>
                      <td className="p-3 text-stone-300">${simulatedRevUsd}</td>
                      <td className={`p-3 font-bold ${revenueDeltaUsd < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {revenueDeltaUsd < 0 ? `-$${Math.abs(revenueDeltaUsd)}` : `+$${revenueDeltaUsd}`}
                      </td>
                      <td className="p-3 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          Direct Loss
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-900/40">
                      <td className="p-3 font-sans font-medium text-stone-200">Soil Moisture Depletion</td>
                      <td className="p-3 text-stone-300">65% (Optimal)</td>
                      <td className="p-3 text-stone-300">{hasWaterBuffer ? '42%' : '22%'}</td>
                      <td className="p-3 font-bold text-amber-400">
                        {hasWaterBuffer ? '-23% Moisture' : '-43% Critical Deficit'}
                      </td>
                      <td className="p-3 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Wilting Point Risk
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-4 rounded-xl bg-stone-900/50 border border-amber-900/60 space-y-2">
                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                  Agronomic Prescriptions for this Layout:
                </h4>
                <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                  <li>
                    Place <strong>Water Canals</strong> or <strong>Rotary Sprinklers</strong> directly adjacent to high-transpiration crops (Wheat, Sweet Corn).
                  </li>
                  <li>
                    Incorporate <strong>Orchard Trees</strong> along the western boundary to act as a windbreak and reduce vapor pressure deficit.
                  </li>
                  <li>
                    Apply organic mulching on <strong>Carrot Patches</strong> to maintain root-zone temperature below 28°C.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-amber-950/80 bg-stone-950 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-stone-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Digital Twin Calibrated for {farmSettings?.location || 'Zone 6b'}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md transition-all"
            >
              Back to Farm Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
