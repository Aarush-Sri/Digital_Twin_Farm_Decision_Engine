import React from 'react';
import { FARM_ITEMS } from '../../types/farm';
import { PaletteCard } from '../palette/PaletteCard';
import { useFarm } from '../../hooks/useFarm';
import { Layers, MousePointerClick, Sparkles } from 'lucide-react';

export const Sidebar = () => {
  const { addItem, items, selectedItem, snapCoordinate } = useFarm();

  const handleQuickAdd = (itemDef) => {
    // Generate position staggered based on item count
    const offset = (items.length % 5) * 40;
    const x = snapCoordinate(260 + offset);
    const y = snapCoordinate(120 + offset);

    addItem({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: itemDef.type,
      x,
      y,
      width: itemDef.defaultWidth,
      height: itemDef.defaultHeight,
      minWidth: itemDef.minWidth,
      minHeight: itemDef.minHeight,
    });
  };

  return (
    <aside className="w-72 md:w-80 h-full flex flex-col bg-zinc-950 border-r border-zinc-800/80 z-20 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              Farm Palette
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
            6 Elements
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Drag and drop elements to design your land layout.
        </p>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {FARM_ITEMS.map((item) => (
          <PaletteCard 
            key={item.type} 
            itemDef={item} 
            onQuickAdd={handleQuickAdd} 
          />
        ))}
      </div>

      {/* Helpful Instructions Footer */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 text-[11px] text-zinc-400 space-y-2">
        <div className="flex items-start space-x-2">
          <MousePointerClick className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
          <span>Click any placed piece to unlock 8-point interactive resize handles.</span>
        </div>
        <div className="flex items-start space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <span>Smooth spring animations provide physical drag & drop feedback.</span>
        </div>

        {selectedItem && (
          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between font-mono text-[10px] text-emerald-400">
            <span className="truncate">Selected: {selectedItem.type.toUpperCase()}</span>
            <span>{selectedItem.width} × {selectedItem.height}px</span>
          </div>
        )}
      </div>
    </aside>
  );
};
