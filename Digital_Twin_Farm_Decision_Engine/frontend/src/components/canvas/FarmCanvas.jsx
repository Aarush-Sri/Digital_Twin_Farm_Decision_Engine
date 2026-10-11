import React, { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFarm } from '../../hooks/useFarm';
import { FarmItem } from './FarmItem';
import { Sparkles, Grid } from 'lucide-react';

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
      className="relative flex-1 h-full farm-canvas-grid farm-canvas-grid-fine overflow-hidden select-none"
    >
      {/* Empty State Banner */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-zinc-500 space-y-3">
          <div className="w-16 h-16 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-emerald-400/80 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-zinc-300">
              Drag elements from the left palette to start planning
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Pick Grass, Tree, Fence, Water, Wheat, or Carrot • Snap to Grid is Active
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
      <div className="absolute bottom-3 right-4 flex items-center space-x-3 text-[11px] font-mono text-zinc-400 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 pointer-events-none shadow-sm">
        <div className="flex items-center space-x-1.5">
          <Grid className="w-3.5 h-3.5 text-emerald-400" />
          <span>Grid: {snapToGrid ? '20px Snap' : 'Freeform'}</span>
        </div>
        <span className="text-zinc-500">|</span>
        <span>Objects: {items.length}</span>
      </div>
    </main>
  );
};
