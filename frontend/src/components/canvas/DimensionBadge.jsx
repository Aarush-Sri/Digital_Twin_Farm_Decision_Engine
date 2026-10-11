import React, { useState, useEffect } from 'react';
import { Trash2, BringToFront, Plus, Minus, Move, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  PIXELS_PER_METER, 
  pxToMetersNum, 
  pxToMeters,
  metersToPx, 
  GRID_SIZE,
  getItemDefinition 
} from '../../types/farm';

export const DimensionBadge = ({ item, onUpdateDimensions, onUpdateRotation, onDelete, onBringToFront }) => {
  const itemDef = getItemDefinition(item.type);
  const isPoint = Boolean(item.isPointIcon || itemDef.isPointIcon);
  const isLine = item.type === 'fence' || item.type === 'pipe';
  const [meterWidth, setMeterWidth] = useState(pxToMetersNum(item.width));
  const [meterHeight, setMeterHeight] = useState(pxToMetersNum(item.height));

  useEffect(() => {
    setMeterWidth(pxToMetersNum(item.width));
    setMeterHeight(pxToMetersNum(item.height));
  }, [item.width, item.height]);

  const applyMeters = (newW_m, newH_m) => {
    const wPx = Math.max(item.minWidth || itemDef.minWidth || 12, metersToPx(newW_m));
    const hPx = Math.max(item.minHeight || itemDef.minHeight || 12, metersToPx(newH_m));

    setMeterWidth(pxToMetersNum(wPx));
    setMeterHeight(pxToMetersNum(hPx));

    onUpdateDimensions({
      id: item.id,
      width: wPx,
      height: hPx,
    });
  };

  const handleWidthChange = (e) => {
    const val = parseFloat(e.target.value);
    setMeterWidth(e.target.value);
    if (!isNaN(val) && val > 0) {
      applyMeters(val, meterHeight);
    }
  };

  const handleHeightChange = (e) => {
    const val = parseFloat(e.target.value);
    setMeterHeight(e.target.value);
    if (!isNaN(val) && val > 0) {
      applyMeters(meterWidth, val);
    }
  };

  const adjustWidth = (deltaM) => {
    const current = pxToMetersNum(item.width);
    const updated = Math.max(0.3, +(current + deltaM).toFixed(1));
    applyMeters(updated, pxToMetersNum(item.height));
  };

  const adjustHeight = (deltaM) => {
    const current = pxToMetersNum(item.height);
    const updated = Math.max(0.3, +(current + deltaM).toFixed(1));
    applyMeters(pxToMetersNum(item.width), updated);
  };

  const setMeterPreset = (w_m, h_m) => {
    applyMeters(w_m, h_m);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: -(item.rotation || 0) }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-16 left-1/2 -translate-x-1/2 z-[9999] flex items-center space-x-2 bg-stone-950/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border-2 border-amber-800/80 shadow-[0_8px_25px_rgba(0,0,0,0.7)] text-xs select-none pointer-events-auto"
    >
      {/* Element Type Indicator */}
      <span className="font-mono text-[10px] uppercase font-bold text-amber-300 bg-amber-950/90 border border-amber-700/70 px-2 py-0.5 rounded shadow-sm">
        {item.type}
      </span>

      {/* Point Icons (Fixed Size Structures / Trees / Wells / Huts) */}
      {isPoint ? (
        <div className="flex items-center space-x-1.5 font-mono text-[11px] bg-stone-900/90 px-2.5 py-0.5 rounded-lg border border-amber-950 text-amber-200">
          <span>{pxToMeters(item.width)} × {pxToMeters(item.height)}</span>
          <span className="text-[9px] text-amber-400 font-sans font-medium bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
            Fixed Structure
          </span>
        </div>
      ) : isLine ? (
        /* Line Components (Fence, Pipe): Rotatable + Length Stepper */
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-0.5 font-mono text-[11px] bg-stone-900/90 px-2 py-0.5 rounded-lg border border-amber-950">
            <span className="text-amber-500 font-semibold text-[10px]">Length</span>
            <button
              type="button"
              title="Decrease length by 0.5m"
              onClick={() => adjustWidth(-0.5)}
              className="p-0.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input
              type="number"
              step="0.5"
              min="0.3"
              max="30"
              value={meterWidth}
              onChange={handleWidthChange}
              className="w-11 bg-transparent text-center text-amber-100 font-bold focus:outline-none focus:text-amber-300"
            />
            <span className="text-amber-500 text-[10px]">m</span>
            <button
              type="button"
              title="Increase length by 0.5m"
              onClick={() => adjustWidth(0.5)}
              className="p-0.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {onUpdateRotation && (
            <button
              type="button"
              title="Rotate 90 degrees"
              onClick={() => onUpdateRotation(item.id, ((item.rotation || 0) + 90) % 360)}
              className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 transition-colors shadow-sm"
            >
              <RotateCw className="w-3 h-3 text-amber-400" />
              <span>{(item.rotation || 0)}°</span>
            </button>
          )}
        </div>
      ) : (
        /* Resizable Terrain & Crop Plots: Width × Height Inputs */
        <div className="flex items-center space-x-1.5 font-mono text-[11px] bg-stone-900/90 px-2 py-0.5 rounded-lg border border-amber-950">
          {/* Width Control */}
          <div className="flex items-center space-x-0.5">
            <span className="text-amber-500 font-semibold text-[10px]">W</span>
            <button
              type="button"
              title="Decrease width by 0.5m"
              onClick={() => adjustWidth(-0.5)}
              className="p-0.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input
              type="number"
              step="0.5"
              min="0.3"
              max="30"
              value={meterWidth}
              onChange={handleWidthChange}
              className="w-11 bg-transparent text-center text-amber-100 font-bold focus:outline-none focus:text-amber-300"
            />
            <span className="text-amber-500 text-[10px]">m</span>
            <button
              type="button"
              title="Increase width by 0.5m"
              onClick={() => adjustWidth(0.5)}
              className="p-0.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          <span className="text-stone-600">×</span>

          {/* Height Control */}
          <div className="flex items-center space-x-0.5">
            <span className="text-amber-500 font-semibold text-[10px]">H</span>
            <button
              type="button"
              title="Decrease height by 0.5m"
              onClick={() => adjustHeight(-0.5)}
              className="p-0.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input
              type="number"
              step="0.5"
              min="0.3"
              max="30"
              value={meterHeight}
              onChange={handleHeightChange}
              className="w-11 bg-transparent text-center text-amber-100 font-bold focus:outline-none focus:text-amber-300"
            />
            <span className="text-amber-500 text-[10px]">m</span>
            <button
              type="button"
              title="Increase height by 0.5m"
              onClick={() => adjustHeight(0.5)}
              className="p-0.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Realistic Scale Presets (Only for resizable crops & terrain) */}
      {!isPoint && !isLine && (
        <div className="flex items-center space-x-1 pl-1 border-l border-amber-950">
          <button
            type="button"
            title="1m × 1m plot"
            onClick={() => setMeterPreset(1, 1)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-900 hover:bg-amber-950 text-stone-300 hover:text-amber-200 border border-stone-800 transition-colors"
          >
            1×1m
          </button>
          <button
            type="button"
            title="2m × 2m plot"
            onClick={() => setMeterPreset(2, 2)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-900 hover:bg-amber-950 text-stone-300 hover:text-amber-200 border border-stone-800 transition-colors"
          >
            2×2m
          </button>
          <button
            type="button"
            title="4m × 2m plot"
            onClick={() => setMeterPreset(4, 2)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-900 hover:bg-amber-950 text-stone-300 hover:text-amber-200 border border-stone-800 transition-colors"
          >
            4×2m
          </button>
        </div>
      )}

      {/* Layer Priority Tier & Actions */}
      <div className="flex items-center space-x-1 pl-1 border-l border-amber-950">
        <button
          type="button"
          title="Bring to front"
          onClick={() => onBringToFront(item.id)}
          className="p-1 rounded text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-colors"
        >
          <BringToFront className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Delete piece"
          onClick={() => onDelete(item.id)}
          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/60 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
