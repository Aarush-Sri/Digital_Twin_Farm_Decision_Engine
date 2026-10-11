import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Sprout, 
  Magnet, 
  Trash2, 
  Layers,
  Sparkles,
  Settings
} from 'lucide-react';

export const Header = ({ onOpenAgentChat, onOpenProfile }) => {
  const { 
    snapToGrid, 
    toggleSnap, 
    clearCanvas, 
    items,
    farmProfile
  } = useFarm();

  const handleClear = () => {
    if (items.length === 0) return;
    if (window.confirm('Clear all placed farm pieces from canvas?')) {
      clearCanvas();
    }
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-5 flex items-center justify-between select-none z-30">
      {/* Title & Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 shadow-sm">
          <Sprout className="w-5 h-5" />
        </div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center space-x-2">
            <span>DigiFarm</span>
            <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Farm Canvas
            </span>
            {farmProfile?.farm_name && (
              <span className="hidden lg:inline text-xs font-normal text-zinc-400 border-l border-zinc-800 pl-2">
                {farmProfile.farm_name}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Center Stats */}
      <div className="hidden sm:flex items-center space-x-2 text-xs text-zinc-400">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Placed Items: <strong className="text-zinc-200">{items.length}</strong></span>
        </div>
      </div>

      {/* Right Action Controls: Profile, AI Chat, Snap & Clear */}
      <div className="flex items-center space-x-2.5">
        {/* Farm Profile Settings Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all shadow-sm"
          title="Edit Farm Location, Soil & Climate Profile"
        >
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">{farmProfile?.location_name || 'Farm Profile'}</span>
          <span className="md:hidden">Profile</span>
        </button>

        {/* Ask AI Agent Drawer Button */}
        <button
          type="button"
          onClick={onOpenAgentChat}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 hover:bg-emerald-900/80 hover:border-emerald-500 transition-all shadow-sm"
          title="Open AI Agronomist chat"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ask AI</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        {/* Snap to Grid Toggle */}
        <button
          type="button"
          onClick={toggleSnap}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            snapToGrid
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/70 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
          title="Toggle 20px grid snapping"
        >
          <Magnet className={`w-3.5 h-3.5 ${snapToGrid ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>Snap {snapToGrid ? 'ON' : 'OFF'}</span>
        </button>

        {/* Clear Canvas */}
        <button
          type="button"
          onClick={handleClear}
          disabled={items.length === 0}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
            items.length > 0
              ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/60'
              : 'bg-zinc-900/50 text-zinc-600 border-zinc-900 cursor-not-allowed'
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
