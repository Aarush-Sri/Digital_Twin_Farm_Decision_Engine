import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  X, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer, 
  Sparkles,
  MapPin,
  Calendar
} from 'lucide-react';

export const WeatherModal = ({ isOpen, onClose }) => {
  const { environment, currentDay, farmSettings } = useFarm();

  if (!isOpen) return null;

  const env = environment || {};
  const forecastDays = Array.from({ length: 7 }, (_, i) => {
    const dayNum = (currentDay || 1) + i;
    const temp = Math.round((env.temp_avg_c || 22) + (Math.sin(i * 1.3) * 3));
    const rain = i === 2 ? 8.5 : i === 5 ? 3.0 : 0.0;
    return {
      day: dayNum,
      label: `Day ${dayNum}`,
      temp,
      rain,
      condition: rain > 4 ? 'Rainy' : i % 2 === 0 ? 'Sunny' : 'Partly Cloudy',
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-stone-950 border-2 border-amber-900/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-amber-950/80 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/80 flex items-center justify-center text-amber-300 shadow-md">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-200 tracking-wide font-sans">
                Agro-Meteorological Forecast & Climate
              </h3>
              <p className="text-[11px] text-stone-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-amber-400 inline" />
                <span>{farmSettings?.location || 'Zone 6b • Greenfield Valley'}</span>
                <span>• 14-Day Outlook</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Day Stats Grid */}
        <div className="p-5 space-y-4 text-xs font-sans">
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
              <Thermometer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[10px] text-stone-400 block">Temperature</span>
              <strong className="text-amber-200 text-sm">{env.temp_avg_c || 22}°C</strong>
              <span className="text-[9px] text-stone-500 block">Min {env.temp_min_c || 16}° / Max {env.temp_max_c || 28}°</span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
              <Droplets className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <span className="text-[10px] text-stone-400 block">Humidity</span>
              <strong className="text-sky-300 text-sm">{env.humidity_pct || 60}%</strong>
              <span className="text-[9px] text-stone-500 block">VPD 1.2 kPa</span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
              <Sun className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <span className="text-[10px] text-stone-400 block">Solar Flux</span>
              <strong className="text-yellow-200 text-sm">{env.solar_radiation_wm2 || 450} W/m²</strong>
              <span className="text-[9px] text-stone-500 block">{env.sunlight_hours || 12}h Sun</span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
              <Wind className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] text-stone-400 block">Reference ET₀</span>
              <strong className="text-emerald-300 text-sm">{env.et0_mm || 4.2} mm</strong>
              <span className="text-[9px] text-stone-500 block">{env.wind_speed_ms || 2.5} m/s Wind</span>
            </div>
          </div>

          {/* 7-Day Forecast Horizon Cards */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-300 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Upcoming 7-Day Daily Horizon</span>
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {forecastDays.map((f) => (
                <div 
                  key={f.day}
                  className="flex items-center justify-between p-2 rounded-lg bg-stone-900/60 border border-stone-800/80 text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-amber-300 w-14">
                      {f.label}
                    </span>
                    <span className="text-stone-300">{f.condition}</span>
                  </div>

                  <div className="flex items-center space-x-4 font-mono text-[11px]">
                    {f.rain > 0 ? (
                      <span className="text-sky-300 flex items-center space-x-1">
                        <CloudRain className="w-3 h-3 text-sky-400" />
                        <span>{f.rain} mm</span>
                      </span>
                    ) : (
                      <span className="text-stone-500">0.0 mm</span>
                    )}

                    <span className="font-bold text-stone-200 w-10 text-right">
                      {f.temp}°C
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-amber-950/80 bg-stone-900/80 flex items-center justify-between text-xs text-stone-400">
          <span>Simulation Physics: Penman-Monteith FAO-56 Standard</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
