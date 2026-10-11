import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Sprout, 
  Magnet, 
  Trash2, 
  Sparkles,
  Sun,
  Droplets,
  Scale,
  Settings
} from 'lucide-react';

export const Header = ({ onOpenAgentChat, onOpenProfile }) => {
  const { 
    snapToGrid, 
    toggleSnap, 
    clearCanvas, 
    items,
    farmProfile,
    currentDay,
    environment,
  } = useFarm();

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
  const treeCount = items.filter((i) => i.type === 'tree').length;
  const waterCount = items.filter((i) => i.type === 'water' || i.type === 'well').length;
  const estYieldKg = (
    wheatCount * 9.9 + 
    carrotCount * 8.4 + 
    tomatoCount * 11.2 + 
    cornCount * 14.5 + 
    pumpkinCount * 22.0 + 
    strawberryCount * 6.5 + 
    treeCount * 12.0
  ).toFixed(0);

  return (
    <header className="h-16 border-b border-amber-950/80 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 px-5 flex items-center justify-between select-none z-30 shadow-xl">
      {/* Title & Brand (Stardew / Clash of Clans feel) */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400/80 flex items-center justify-center text-amber-100 shadow-md transform hover:rotate-3 transition-transform">
          <Sprout className="w-6 h-6 drop-shadow" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-extrabold text-amber-200 tracking-wide font-sans drop-shadow-sm flex items-center space-x-2">
              <span>DigiFarm</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm">
                Farm Canvas
              </span>
            </h1>
          </div>
          <p className="text-[10px] text-stone-400 font-medium">
            AgriTwin • Agricultural Decision Engine & Simulator
          </p>
        </div>
      </div>

      {/* Center Game HUD / Status Badges */}
      <div className="hidden lg:flex items-center space-x-3 text-xs">
        {/* Placed Items Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-amber-900/60 shadow-inner">
          <span className="text-stone-300">
            Placed Items: <strong className="text-amber-200">{items.length}</strong>
          </span>
        </div>

        {/* Weather & Day Widget */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-amber-900/60 shadow-inner">
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="font-bold text-amber-200">Day {currentDay || 1}</span>
          <span className="text-stone-500">•</span>
          <span className="text-stone-300">{environment?.temperature_c || 22}°C Sunny</span>
        </div>

        {/* Moisture / Irrigation status */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-sky-900/60 shadow-inner">
          <Droplets className={`w-3.5 h-3.5 ${waterCount > 0 ? 'text-sky-400' : 'text-amber-500'}`} />
          <span className="text-stone-300">
            Water: <strong className={waterCount > 0 ? `${waterCount} Canals` : 'No Irrigation'}>
              {waterCount > 0 ? `${waterCount} Canals` : 'No Irrigation'}
            </strong>
          </span>
        </div>

        {/* Harvest Yield projection */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-emerald-900/60 shadow-inner">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-stone-300">
            Proj. Yield: <strong className="text-emerald-300">{estYieldKg} kg</strong>
          </span>
        </div>
      </div>

      {/* Right Controls: Farm Profile, AI Agronomist, Snap, Clear */}
      <div className="flex items-center space-x-2.5">
        {/* Farm Profile Settings Button */}
        {onOpenProfile && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-stone-300 border border-amber-900/60 hover:border-amber-700/80 hover:bg-stone-800 transition-all shadow-sm"
            title="Edit Farm Location, Soil & Climate Profile"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">{farmProfile?.location_name || 'Farm Profile'}</span>
            <span className="md:hidden">Profile</span>
          </button>
        )}

        {/* Ask AI Agent Drawer Button (Clash of Clans Gem/Gold style) */}
        <button
          type="button"
          onClick={onOpenAgentChat}
          className="group relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 border-2 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.35)] hover:shadow-[0_0_20px_rgba(250,204,21,0.55)] transition-all active:scale-95"
          title="Open AI Agronomist & Simulation Engine"
        >
          <Sparkles className="w-4 h-4 text-stone-950 group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide uppercase font-sans">⚡ Ask AI Agronomist</span>
        </button>

        <div className="h-6 w-px bg-stone-800 mx-1" />

        {/* Snap to Grid Toggle */}
        <button
          type="button"
          onClick={toggleSnap}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
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
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
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
  );
};
