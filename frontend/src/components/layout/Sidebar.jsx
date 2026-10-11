import { FARM_ITEMS, pxToMeters } from '../../types/farm';
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
    <aside className="w-72 md:w-80 h-full flex flex-col bg-stone-950 border-r border-amber-950/80 z-20 select-none shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-amber-950/80 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-amber-900/60 border border-amber-600/60 flex items-center justify-center text-amber-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold tracking-wider text-amber-100 uppercase">
              Farm Palette
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">
            {FARM_ITEMS.length} Elements
          </span>
        </div>
        <p className="mt-1 text-[11px] text-stone-400">
          Drag & drop onto pasture to build your digital twin
        </p>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {FARM_ITEMS.map((item) => (
          <PaletteCard 
            key={item.type} 
            itemDef={item} 
            onQuickAdd={handleQuickAdd} 
          />
        ))}
      </div>

      {/* Helpful Instructions Footer */}
      <div className="p-3.5 border-t border-amber-950/80 bg-stone-900/40 text-[11px] text-stone-400 space-y-2">
        <div className="flex items-start space-x-2">
          <MousePointerClick className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <span>Click any placed plot to resize handles or change dimensions.</span>
        </div>
        <div className="flex items-start space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <span>Fences sit on top of land & water to protect crop rows.</span>
        </div>

        {selectedItem && (
          <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between font-mono text-[10px] text-amber-300">
            <span className="truncate">Selected: {selectedItem.type.toUpperCase()}</span>
            <span className="font-bold">{pxToMeters(selectedItem.width)} × {pxToMeters(selectedItem.height)}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
