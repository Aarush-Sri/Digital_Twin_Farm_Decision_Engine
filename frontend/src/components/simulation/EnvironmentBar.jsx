import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Sun, 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  Sprout, 
  Scale, 
  Sparkles,
  Calendar
} from 'lucide-react';

export const EnvironmentBar = () => {
  const { environment, farmSummary, currentDay, backendStatus } = useFarm();

  const tempAvg = environment?.temp_avg_c ?? 22.0;
  const solarRad = environment?.solar_radiation_wm2 ?? 450;
  const rain = environment?.rainfall_mm ?? 0.0;
  const humidity = environment?.humidity_pct ?? 60;
  const et0 = environment?.et0_mm ?? 4.2;

  const totalCrops = Object.values(farmSummary?.crops_distribution || {}).reduce((a, b) => a + b, 0);
  const projectedYield = farmSummary?.total_projected_yield_kg ?? 0.0;

  return (
    <div className="h-10 bg-zinc-900/90 border-b border-zinc-800/80 px-4 flex items-center justify-between text-xs text-zinc-300 select-none overflow-x-auto">
      {/* Left: Simulation Day & Live Weather */}
      <div className="flex items-center space-x-4">
        {/* Day Indicator */}
        <div className="flex items-center space-x-1.5 font-mono px-2.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-semibold shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Day {currentDay}</span>
        </div>

        {/* Solar Radiation */}
        <div className="flex items-center space-x-1 text-zinc-400" title="Solar Radiation (W/m²)">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-zinc-200">{Math.round(solarRad)}</span>
          <span className="text-[10px] text-zinc-500">W/m²</span>
        </div>

        {/* Temperature */}
        <div className="flex items-center space-x-1 text-zinc-400" title="Average Daily Temperature">
          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-mono text-zinc-200">{tempAvg.toFixed(1)}°C</span>
        </div>

        {/* Rainfall */}
        <div className="flex items-center space-x-1 text-zinc-400" title="Daily Rainfall">
          <CloudRain className={`w-3.5 h-3.5 ${rain > 0 ? 'text-sky-400 animate-bounce' : 'text-zinc-500'}`} />
          <span className="font-mono text-zinc-200">{rain.toFixed(1)} mm</span>
        </div>

        {/* Humidity & ET0 */}
        <div className="hidden lg:flex items-center space-x-3 text-zinc-400">
          <div className="flex items-center space-x-1" title="Relative Humidity">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-zinc-200">{Math.round(humidity)}%</span>
          </div>
          <div className="flex items-center space-x-1" title="Reference Evapotranspiration ET0">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono text-zinc-200">{et0.toFixed(1)}</span>
            <span className="text-[10px] text-zinc-500">mm ET₀</span>
          </div>
        </div>
      </div>

      {/* Right: Crop Vitals & Yield Projections */}
      <div className="flex items-center space-x-4 font-mono text-[11px]">
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Crops:</span>
          <span className="text-emerald-300 font-bold">{totalCrops}</span>
          {totalCrops > 0 && (
            <span className="text-[10px] text-zinc-500">
              ({Object.entries(farmSummary.crops_distribution)
                .map(([type, count]) => `${count} ${type}`)
                .join(', ')})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 text-zinc-300">
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>Est. Yield:</span>
          <span className="text-amber-300 font-bold">{projectedYield} kg</span>
        </div>
      </div>
    </div>
  );
};
