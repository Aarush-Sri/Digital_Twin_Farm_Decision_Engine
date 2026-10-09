import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Sprout, 
  Magnet, 
  Trash2, 
  Layers, 
  HelpCircle 
} from 'lucide-react';

export const Header = () => {
  const { snapToGrid, toggleSnap, clearCanvas, items } = useFarm();

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
        <div>
          <h1 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center space-x-2">
            <span>DigiFarm</span>
            <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Decision Engine
            </span>
          </h1>
          <p className="text-[11px] text-zinc-500 font-sans -mt-0.5">
            Spatial Farm Layout & Interactive Dimension Studio
          </p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Snap to Grid Toggle */}
        <button
          type="button"
          onClick={toggleSnap}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            snapToGrid
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/70 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
          title="Toggle 20px grid snapping"
        >
          <Magnet className={`w-3.5 h-3.5 ${snapToGrid ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>Snap Grid: {snapToGrid ? 'ON' : 'OFF'}</span>
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
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </header>
  );
};
