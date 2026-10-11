import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Undo2, 
  Redo2, 
  Copy, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Magnet, 
  Settings2,
  MapPin
} from 'lucide-react';

export const EditorToolbar = ({ onOpenFarmSettings }) => {
  const { 
    items,
    selectedId,
    selectedItem,
    canUndo,
    canRedo,
    undo,
    redo,
    duplicateItem,
    deleteItem,
    clearCanvas,
    snapToGrid,
    toggleSnap,
    zoom,
    setZoom,
    farmSettings,
    farmStats
  } = useFarm();

  const handleClear = () => {
    if (items.length === 0) return;
    if (window.confirm('Clear all placed farm plots from canvas?')) {
      clearCanvas();
    }
  };

  const handleZoomIn = () => {
    const next = Math.min(2.0, Number((zoom + 0.15).toFixed(2)));
    setZoom(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(0.5, Number((zoom - 0.15).toFixed(2)));
    setZoom(next);
  };

  const handleZoomReset = () => {
    setZoom(1.0);
  };

  return (
    <div className="absolute top-3 left-4 z-30 flex items-center space-x-1.5 p-1.5 rounded-xl bg-stone-950/90 backdrop-blur-md border border-amber-900/70 shadow-2xl select-none text-xs">
      {/* 1. History (Undo / Redo) */}
      <div className="flex items-center space-x-0.5 pr-1.5 border-r border-stone-800">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded-lg transition-all ${
            canUndo
              ? 'text-amber-200 hover:bg-stone-800 active:scale-95'
              : 'text-stone-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded-lg transition-all ${
            canRedo
              ? 'text-amber-200 hover:bg-stone-800 active:scale-95'
              : 'text-stone-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Selection Actions (Duplicate / Delete) */}
      <div className="flex items-center space-x-0.5 pr-1.5 border-r border-stone-800">
        <button
          type="button"
          onClick={() => selectedId && duplicateItem(selectedId)}
          disabled={!selectedId}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all ${
            selectedId
              ? 'text-amber-200 hover:bg-stone-800 hover:text-amber-300'
              : 'text-stone-600 cursor-not-allowed'
          }`}
          title="Duplicate selected item (Ctrl+D)"
        >
          <Copy className="w-3 h-3" />
          <span className="hidden sm:inline text-[11px]">Duplicate</span>
        </button>

        <button
          type="button"
          onClick={() => selectedId && deleteItem(selectedId)}
          disabled={!selectedId}
          className={`p-1.5 rounded-lg transition-all ${
            selectedId
              ? 'text-red-400 hover:bg-red-950/70 hover:text-red-300'
              : 'text-stone-600 cursor-not-allowed'
          }`}
          title="Delete selected item (Delete)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Zoom Controls */}
      <div className="flex items-center space-x-1 pr-1.5 border-r border-stone-800 font-mono">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-1 rounded text-stone-300 hover:bg-stone-800 hover:text-amber-200 disabled:text-stone-600 disabled:cursor-not-allowed"
          title="Zoom Out (Ctrl -)"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={handleZoomReset}
          className="px-1.5 py-0.5 rounded text-[10px] text-amber-300 hover:bg-stone-800 tracking-tighter"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 2.0}
          className="p-1 rounded text-stone-300 hover:bg-stone-800 hover:text-amber-200 disabled:text-stone-600 disabled:cursor-not-allowed"
          title="Zoom In (Ctrl +)"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>

      {/* 4. Grid Snapping */}
      <div className="pr-1.5 border-r border-stone-800">
        <button
          type="button"
          onClick={toggleSnap}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-mono transition-all border ${
            snapToGrid
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
          title="Toggle 20px grid snapping"
        >
          <Magnet className={`w-3 h-3 ${snapToGrid ? 'text-emerald-400' : 'text-stone-500'}`} />
          <span className="hidden sm:inline">Snap</span>
          <span>{snapToGrid ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 5. Clear Canvas */}
      <button
        type="button"
        onClick={handleClear}
        disabled={items.length === 0}
        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] transition-all border ${
          items.length > 0
            ? 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-700/60'
            : 'bg-stone-900/40 text-stone-600 border-stone-900 cursor-not-allowed'
        }`}
        title="Clear all canvas items"
      >
        <Trash2 className="w-3 h-3" />
        <span>Clear</span>
      </button>

      {/* 6. Farm Boundary / Real-world Dimensions */}
      <button
        type="button"
        onClick={onOpenFarmSettings}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/60 text-amber-200 transition-all font-mono text-[11px]"
        title="Configure Real-World Farm Boundary & Acreage"
      >
        <Settings2 className="w-3 h-3 text-amber-400" />
        <span>{farmSettings?.totalSize || 2.5} {farmSettings?.unit || 'Acres'}</span>
      </button>
    </div>
  );
};
