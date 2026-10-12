import React, { useState } from 'react';
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
  Plus,
  Maximize2,
  Minus,
  Check
} from 'lucide-react';

import { pxToMeters, pxToMetersNum, metersToPx } from '../../types/farm';

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

const RESIZE_PRESETS = [
  { label: '1×1m', w: 1, h: 1 },
  { label: '2×2m', w: 2, h: 2 },
  { label: '3×3m', w: 3, h: 3 },
  { label: '4×4m', w: 4, h: 4 },
];

export const PaletteCard = ({ itemDef, onQuickAdd, globalSize = null }) => {
  const IconComponent = ICON_MAP[itemDef.iconName] || Sprout;
  const isPoint = Boolean(itemDef.isPointIcon);

  // Dimension state in meters
  const defaultWMeters = pxToMetersNum(itemDef.defaultWidth) || 2;
  const defaultHMeters = pxToMetersNum(itemDef.defaultHeight) || 2;

  const [customWidthM, setCustomWidthM] = useState(globalSize ? globalSize.w : defaultWMeters);
  const [customHeightM, setCustomHeightM] = useState(globalSize ? globalSize.h : defaultHMeters);
  const [showResize, setShowResize] = useState(false);

  // Sync if globalSize changes and card hasn't been locally customized
  React.useEffect(() => {
    if (globalSize && !isPoint) {
      setCustomWidthM(globalSize.w);
      setCustomHeightM(globalSize.h);
    }
  }, [globalSize, isPoint]);

  const activeWidthPx = metersToPx(customWidthM);
  const activeHeightPx = metersToPx(customHeightM);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: itemDef.type,
      defaultWidth: activeWidthPx,
      defaultHeight: activeHeightPx,
      width: activeWidthPx,
      height: activeHeightPx,
      minWidth: itemDef.minWidth,
      minHeight: itemDef.minHeight,
      isPointIcon: Boolean(itemDef.isPointIcon),
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSpawn = () => {
    if (activeWidthPx === itemDef.defaultWidth && activeHeightPx === itemDef.defaultHeight) {
      onQuickAdd(itemDef);
    } else {
      onQuickAdd({
        ...itemDef,
        defaultWidth: activeWidthPx,
        defaultHeight: activeHeightPx,
        width: activeWidthPx,
        height: activeHeightPx,
      });
    }
  };

  const setPreset = (w, h) => {
    setCustomWidthM(w);
    setCustomHeightM(h);
  };

  const adjustWidth = (delta) => {
    setCustomWidthM((prev) => Math.max(0.5, +(prev + delta).toFixed(1)));
  };

  const adjustHeight = (delta) => {
    setCustomHeightM((prev) => Math.max(0.5, +(prev + delta).toFixed(1)));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative flex flex-col p-2.5 rounded-xl border transition-all duration-200 select-none shadow-md ${
        showResize
          ? 'border-amber-500/80 bg-stone-900 shadow-amber-950/40'
          : 'border-stone-800/80 bg-gradient-to-b from-stone-900/90 to-stone-950/95 hover:border-amber-500/70 hover:from-stone-900 hover:to-amber-950/30 hover:shadow-amber-950/30'
      }`}
    >
      {/* Main card row */}
      <div className="flex items-center cursor-grab active:cursor-grabbing">
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
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs font-bold text-amber-100 group-hover:text-amber-300 tracking-wide truncate">
              {itemDef.label}
            </h4>
          </div>
          <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5 font-sans">
            {itemDef.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Resize option button */}
          {!isPoint && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowResize(!showResize);
              }}
              title={`Resize ${itemDef.label} (Current: ${customWidthM}m × ${customHeightM}m)`}
              className={`px-1.5 py-1 rounded-md text-[10px] font-mono border transition-all flex items-center space-x-1 ${
                showResize
                  ? 'bg-amber-600 text-stone-950 font-bold border-amber-500 shadow-sm'
                  : 'bg-stone-950/80 text-stone-400 hover:text-amber-200 border-stone-800 hover:border-amber-600/60'
              }`}
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>{customWidthM}×{customHeightM}m</span>
            </button>
          )}

          <button
            type="button"
            title="Click to spawn on canvas"
            onClick={handleSpawn}
            className="p-1.5 rounded-lg text-amber-300 bg-amber-950/60 hover:bg-amber-600 hover:text-stone-950 border border-amber-700/60 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          
          <GripVertical className="w-3.5 h-3.5 text-stone-600 group-hover:text-amber-400 transition-colors" />
        </div>
      </div>

      {/* Expandable Resize Drawer / Options for this element */}
      {showResize && !isPoint && (
        <div className="mt-2.5 pt-2 border-t border-stone-800/80 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-mono text-amber-300 font-semibold flex items-center space-x-1">
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>Resize Plot:</span>
            </span>
            <span className="font-mono text-stone-400">
              Area: <strong className="text-emerald-400">{(customWidthM * customHeightM).toFixed(1)} m²</strong>
            </span>
          </div>

          {/* Quick meter presets */}
          <div className="flex items-center space-x-1 font-mono text-[10px]">
            {RESIZE_PRESETS.map((p) => {
              const isSelected = customWidthM === p.w && customHeightM === p.h;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreset(p.w, p.h);
                  }}
                  className={`flex-1 py-1 rounded border text-center transition-all ${
                    isSelected
                      ? 'bg-amber-600 text-stone-950 font-bold border-amber-500'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Fine-tuning W & H steppers */}
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] pt-0.5">
            <div className="flex items-center justify-between bg-stone-950 px-2 py-1 rounded border border-stone-800">
              <span className="text-stone-500">W:</span>
              <span className="text-amber-200 font-bold">{customWidthM}m</span>
              <div className="flex items-center space-x-0.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); adjustWidth(-0.5); }}
                  className="p-0.5 hover:text-amber-200 text-stone-400 rounded hover:bg-stone-850"
                  title="Decrease width by 0.5m"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); adjustWidth(0.5); }}
                  className="p-0.5 hover:text-amber-200 text-stone-400 rounded hover:bg-stone-850"
                  title="Increase width by 0.5m"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-stone-950 px-2 py-1 rounded border border-stone-800">
              <span className="text-stone-500">H:</span>
              <span className="text-amber-200 font-bold">{customHeightM}m</span>
              <div className="flex items-center space-x-0.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); adjustHeight(-0.5); }}
                  className="p-0.5 hover:text-amber-200 text-stone-400 rounded hover:bg-stone-850"
                  title="Decrease height by 0.5m"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); adjustHeight(0.5); }}
                  className="p-0.5 hover:text-amber-200 text-stone-400 rounded hover:bg-stone-850"
                  title="Increase height by 0.5m"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
