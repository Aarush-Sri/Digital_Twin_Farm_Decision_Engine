import React from 'react';
import { 
  Sprout, 
  Trees, 
  Waves, 
  Fence as FenceIcon, 
  Wheat as WheatIcon, 
  Carrot as CarrotIcon,
  Cherry,
  CircleDot,
  Warehouse,
  Footprints,
  GripVertical,
  Plus
} from 'lucide-react';

const ICON_MAP = {
  Sprout,
  Trees,
  Waves,
  Fence: FenceIcon,
  Wheat: WheatIcon,
  Carrot: CarrotIcon,
  Cherry,
  CircleDot,
  Warehouse,
  Footprints,
};

export const PaletteCard = ({ itemDef, onQuickAdd }) => {
  const IconComponent = ICON_MAP[itemDef.iconName] || Sprout;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: itemDef.type,
      defaultWidth: itemDef.defaultWidth,
      defaultHeight: itemDef.defaultHeight,
      width: itemDef.defaultWidth,
      height: itemDef.defaultHeight,
      minWidth: itemDef.minWidth,
      minHeight: itemDef.minHeight,
      isPointIcon: Boolean(itemDef.isPointIcon),
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative flex items-center p-2.5 rounded-xl border border-stone-800/80 bg-gradient-to-b from-stone-900/90 to-stone-950/95 hover:border-amber-500/70 hover:from-stone-900 hover:to-amber-950/30 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-md hover:shadow-amber-950/30 select-none"
    >
      {/* Thumbnail Box */}
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center border overflow-hidden relative mr-3 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-200"
        style={{ 
          backgroundColor: itemDef.color.bg, 
          borderColor: itemDef.color.border 
        }}
      >
        {itemDef.image ? (
          <img 
            src={itemDef.image} 
            alt={itemDef.label} 
            className="w-full h-full object-cover pixel-crisp"
            style={{
              objectFit: itemDef.type === 'tree' || itemDef.type.includes('tree') || itemDef.type === 'fence' ? 'contain' : 'cover'
            }}
          />
        ) : (
          <IconComponent className="w-5 h-5 text-amber-200" />
        )}

        {/* Mini category badge */}
        <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-center text-amber-200/90 py-0.2 tracking-tight">
          {itemDef.category}
        </div>
      </div>

      {/* Info Body */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-xs font-bold text-amber-100 group-hover:text-amber-300 tracking-wide truncate">
          {itemDef.label}
        </h4>
        <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5 font-sans">
          {itemDef.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 shrink-0">
        <button
          type="button"
          title="Click to spawn on canvas"
          onClick={() => onQuickAdd(itemDef)}
          className="p-1.5 rounded-lg text-amber-300 bg-amber-950/60 hover:bg-amber-600 hover:text-stone-950 border border-amber-700/60 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <GripVertical className="w-3.5 h-3.5 text-stone-600 group-hover:text-amber-400 transition-colors" />
      </div>
    </div>
  );
};
