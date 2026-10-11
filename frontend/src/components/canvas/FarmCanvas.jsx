import React, { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFarm } from '../../hooks/useFarm';
import { FarmItem } from './FarmItem';
import { Sparkles, Grid, LayoutTemplate } from 'lucide-react';

export const FarmCanvas = () => {
  const {
    items,
    selectedId,
    snapToGrid,
    addItem,
    updatePosition,
    updateDimensions,
    selectItem,
    deselectAll,
    deleteItem,
    bringToFront,
    snapCoordinate,
    loadPresetFarm,
  } = useFarm();

  const canvasRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const itemDef = JSON.parse(rawData);
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      // Center the dropped item at mouse pointer
      const rawX = dropX - itemDef.defaultWidth / 2;
      const rawY = dropY - itemDef.defaultHeight / 2;

      const x = Math.max(0, snapCoordinate(rawX));
      const y = Math.max(0, snapCoordinate(rawY));

      const newItem = {
        id: `farm-piece-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: itemDef.type,
        x,
        y,
        width: itemDef.defaultWidth,
        height: itemDef.defaultHeight,
        minWidth: itemDef.minWidth,
        minHeight: itemDef.minHeight,
      };

      addItem(newItem);
    } catch (err) {
      console.error('Failed to parse dropped item', err);
    }
  };

  const handleCanvasClick = (e) => {
    // Only deselect if clicked directly on canvas background
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-background')) {
      deselectAll();
    }
  };

  return (
    <main
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      className="relative flex-1 h-full farm-canvas-grid farm-canvas-grid-fine overflow-hidden select-none isolate z-0"
    >
      {/* Empty State Banner (Stardew / Clash of Clans Mission Board) */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 space-y-4">
          <div className="max-w-md w-full bg-gradient-to-b from-stone-900/95 to-stone-950/95 border-2 border-amber-900/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-center space-y-3 pointer-events-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-500/70 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-200 tracking-wide font-sans">
                Build Your GreenTwin Farm Plot
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Drag elements from the left palette or load a preset layout to start simulating:
              </p>
            </div>

            <div className="pt-1 pb-1">
              <button
                type="button"
                onClick={() => loadPresetFarm('model')}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg border border-emerald-400/60 flex items-center justify-center space-x-2 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <LayoutTemplate className="w-4 h-4 text-emerald-100" />
                <span>🌾 Load Preset GreenTwin Farm</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 py-1 text-[10px] font-mono text-amber-100">
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/crop_wheat.png" alt="Wheat" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">🌾 Wheat</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/crop_carrot.png" alt="Carrot" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">🥕 Carrot</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/crop_tomato.png" alt="Tomato" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">🍅 Tomato</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/crop_corn.png" alt="Corn" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">🌽 Corn</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/crop_pumpkin.png" alt="Pumpkin" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">🎃 Pumpkin</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/crop_strawberry.png" alt="Berry" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">🍓 Berry</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/tree_transparent.png" alt="Tree" className="w-5 h-5 pixel-crisp object-contain" />
                <span className="truncate">🌳 Tree</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/fence_transparent.png" alt="Fence" className="w-5 h-5 pixel-crisp object-contain" />
                <span className="truncate">🪵 Fence</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/building_barn.png" alt="Barn" className="w-5 h-5 pixel-crisp object-contain" />
                <span className="truncate">🏠 Barn</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/decor_well.png" alt="Well" className="w-5 h-5 pixel-crisp object-contain" />
                <span className="truncate">🪣 Well</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/path_stone.png" alt="Path" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">🪨 Path</span>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                <img src="/assets/water_canal.png" alt="Canal" className="w-5 h-5 pixel-crisp" />
                <span className="truncate">💧 Canal</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-400 font-medium pt-1">
              💡 Tip: Once placed, tap <strong>"⚡ Ask AI Agronomist"</strong> to test drought or flood what-if scenarios!
            </p>
          </div>
        </div>
      )}

      {/* Placed Items on Canvas */}
      <AnimatePresence>
        {items.map((item) => (
          <FarmItem
            key={item.id}
            item={item}
            isSelected={item.id === selectedId}
            snapToGrid={snapToGrid}
            onSelect={selectItem}
            onUpdatePosition={updatePosition}
            onUpdateDimensions={updateDimensions}
            onDelete={deleteItem}
            onBringToFront={bringToFront}
          />
        ))}
      </AnimatePresence>

      {/* Subdued Bottom-Right Coordinates / Grid Status */}
      <div className="absolute bottom-3 right-4 flex items-center space-x-3 text-[11px] font-mono text-amber-200 bg-stone-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-amber-900/60 pointer-events-none shadow-lg">
        <div className="flex items-center space-x-1.5">
          <Grid className="w-3.5 h-3.5 text-amber-400" />
          <span>Snap: {snapToGrid ? '20px Grid' : 'Freeform'}</span>
        </div>
        <span className="text-stone-600">|</span>
        <span>Objects: {items.length}</span>
      </div>
    </main>
  );
};
