import React, { useState } from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Sprout, 
  Magnet, 
  Trash2, 
  Sparkles,
  Sun,
  Droplets,
  Scale,
  MapPin,
  ChevronRight,
  Info
} from 'lucide-react';
import { WeatherModal } from './WeatherModal';

export const Header = ({ onOpenAgentChat }) => {
  const { 
    snapToGrid, 
    toggleSnap, 
    clearCanvas, 
    items,
    currentDay,
    environment,
    farmSettings,
    farmStats
  } = useFarm();

  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const handleClear = () => {
    if (items.length === 0) return;
    if (window.confirm('Clear all placed farm plots from canvas?')) {
      clearCanvas();
    }
  };

  const wheatCount = items.filter((i) => i.type === 'wheat').length;
  const carrotCount = items.filter((i) => i.type === 'carrot').length;
  const tomatoCount = items.filter((i) => i.type === 'tomato').length;
  const cornCount = items.filter((i) => i.type === 'corn').length;
  const pumpkinCount = items.filter((i) => i.type === 'pumpkin').length;
  const strawberryCount = items.filter((i) => i.type === 'strawberry').length;
  const treeCount = items.filter((i) => i.type.includes('tree')).length;
  const waterCount = items.filter((i) => i.type === 'water' || i.type === 'pond' || i.type === 'well' || i.type === 'sprinkler').length;

  const totalCropsCount = (farmStats?.cropsCount || (wheatCount + carrotCount + tomatoCount + cornCount + pumpkinCount + strawberryCount + treeCount));

  const estYieldKg = totalCropsCount > 0 ? (
    wheatCount * 9.9 + 
    carrotCount * 8.4 + 
    tomatoCount * 11.2 + 
    cornCount * 14.5 + 
    pumpkinCount * 22.0 + 
    strawberryCount * 6.5 + 
    treeCount * 12.0
  ).toFixed(0) : null;

  return (
    <>
      <header className="h-16 md:h-18 border-b border-amber-950/80 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 px-5 md:px-6 flex items-center justify-between select-none z-30 shadow-xl">
        {/* Left: Title & Brand */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400/80 flex items-center justify-center text-amber-100 shadow-md transform hover:rotate-3 transition-transform">
            <Sprout className="w-6 h-6 drop-shadow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold text-amber-200 tracking-wide font-sans drop-shadow-sm flex items-center space-x-2">
                <span>DigiFarm</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm">
                  Farm Canvas
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-stone-400 font-medium truncate max-w-[200px] sm:max-w-none">
              {farmSettings?.name || 'AgriTwin'} • {farmSettings?.location || 'Zone 6b'}
            </p>
          </div>
        </div>

        {/* Center: Reorganized Agricultural Decision HUD */}
        <div className="hidden xl:flex items-center space-x-3.5 text-xs">
          {/* 1. Weather & Forecast Horizon (Clickable for inspection) */}
          <button
            type="button"
            onClick={() => setShowWeatherModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-amber-900/60 shadow-inner hover:border-amber-500 hover:bg-stone-900/90 transition-all text-left group"
            title="Inspect 14-day climate forecast & solar radiation details"
          >
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <div>
              <div className="flex items-center space-x-1.5 text-amber-200 font-bold">
                <span>Day {currentDay || 1}-14 Forecast</span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-300">{environment?.temp_avg_c || 22}°C Sunny</span>
              </div>
              <span className="text-[9px] text-stone-400 group-hover:text-amber-300 transition-colors">
                {farmSettings?.location || 'Zone 6b'} (Click for details)
              </span>
            </div>
          </button>

          {/* 2. Irrigation Method & Water Availability */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-sky-900/60 shadow-inner">
            <Droplets className={`w-4 h-4 ${waterCount > 0 ? 'text-sky-400' : 'text-amber-500'}`} />
            <div>
              <div className="flex items-center space-x-1 text-stone-300">
                <span>Water:</span>
                <strong className={waterCount > 0 ? 'text-sky-300' : 'text-amber-400'}>
                  {waterCount > 0 ? `Drip & ${waterCount} Sources` : 'No Irrigation'}
                </strong>
              </div>
              <span className="text-[9px] text-stone-400">
                {waterCount > 0 ? '85% Water Reserve' : 'Rainfed / Deficit Risk'}
              </span>
            </div>
          </div>

          {/* 3. Projected Harvest Yield (Shows "Not calculated" until crops placed) */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-emerald-900/60 shadow-inner">
            <Scale className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="flex items-center space-x-1 text-stone-300">
                <span>Projected Yield:</span>
                <strong className={estYieldKg ? 'text-emerald-300' : 'text-stone-400'}>
                  {estYieldKg ? `${estYieldKg} kg` : 'Not calculated'}
                </strong>
              </div>
              <span className="text-[9px] text-stone-400">
                {totalCropsCount > 0 ? `${totalCropsCount} plots active` : 'Requires crop placement'}
              </span>
            </div>
          </div>

          {/* 4. Farm Area & Placed Items Summary (Secondary counter) */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-stone-800 shadow-inner">
            <div>
              <div className="text-amber-200 font-mono font-bold text-[11px]">
                {farmStats?.totalCultivatedAcres || 0} / {farmSettings?.totalSize || 2.5} {farmSettings?.unit || 'Acres'}
              </div>
              <span className="text-[9px] text-stone-400">
                Placed Items: <strong className="text-stone-300">{items.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Controls: AI Agronomist + Editing Tools */}
        <div className="flex items-center space-x-3.5 flex-shrink-0">
          {/* Ask AI Agent Drawer Button (With scenario-ready state indicator) */}
          <button
            type="button"
            onClick={onOpenAgentChat}
            className={`group relative flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-950 transition-all active:scale-95 shadow-md ${
              items.length > 0
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 border-2 border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.55)]'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
            }`}
            title="Open AI Agronomist Decision Engine & Simulation Panel"
          >
            <Sparkles className="w-4 h-4 text-stone-950 group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide uppercase font-sans">⚡ Ask AI Agronomist</span>
            {items.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <div className="h-6 w-px bg-stone-800 mx-1 hidden sm:block" />

          {/* Snap to Grid */}
          <button
            type="button"
            onClick={toggleSnap}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
              snapToGrid
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70 shadow-sm'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Toggle 20px grid snapping"
          >
            <Magnet className={`w-3.5 h-3.5 ${snapToGrid ? 'text-emerald-400' : 'text-stone-500'}`} />
            <span>Snap {snapToGrid ? 'ON' : 'OFF'}</span>
          </button>

          {/* Clear Canvas */}
          <button
            type="button"
            onClick={handleClear}
            disabled={items.length === 0}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs transition-all border ${
              items.length > 0
                ? 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-red-950/50 hover:text-red-300 hover:border-red-700/60'
                : 'bg-stone-900/40 text-stone-600 border-stone-900 cursor-not-allowed'
            }`}
            title="Clear all canvas items"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </header>

      {/* Weather Inspection Modal */}
      <WeatherModal
        isOpen={showWeatherModal}
        onClose={() => setShowWeatherModal(false)}
      />
    </>
  );
};
