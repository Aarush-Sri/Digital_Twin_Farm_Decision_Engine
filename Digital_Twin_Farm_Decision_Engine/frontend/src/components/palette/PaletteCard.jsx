import React from 'react';
import { 
  Sprout, 
  Trees, 
  Waves, 
  Fence as FenceIcon, 
  Wheat as WheatIcon, 
  Carrot as CarrotIcon,
  GripVertical,
  Plus
} from 'lucide-react';

import { pxToMeters } from '../../types/farm';

const ICON_MAP = {
  Sprout,
  Trees,
  Waves,
  Fence: FenceIcon,
  Wheat: WheatIcon,
  Carrot: CarrotIcon,
};

export const PaletteCard = ({ itemDef, onQuickAdd }) => {
  const IconComponent = ICON_MAP[itemDef.iconName] || Sprout;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: itemDef.type,
      defaultWidth: itemDef.defaultWidth,
      defaultHeight: itemDef.defaultHeight,
      minWidth: itemDef.minWidth,
      minHeight: itemDef.minHeight,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative flex flex-col p-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-sm select-none"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2.5">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105 duration-150"
            style={{ 
              backgroundColor: itemDef.color.bg, 
              borderColor: itemDef.color.border,
              color: itemDef.color.accent 
            }}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white tracking-wide">
              {itemDef.label}
            </h4>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
              {itemDef.category}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            title="Click to spawn on canvas"
            onClick={() => onQuickAdd(itemDef)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2 font-sans">
        {itemDef.description}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
        <span>Default {pxToMeters(itemDef.defaultWidth)} × {pxToMeters(itemDef.defaultHeight)}</span>
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: itemDef.color.accent }}
        />
      </div>
    </div>
  );
};
