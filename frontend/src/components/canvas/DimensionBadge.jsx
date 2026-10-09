import React, { useState, useEffect } from 'react';
import { Trash2, BringToFront, Check, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const DimensionBadge = ({ item, onUpdateDimensions, onDelete, onBringToFront }) => {
  const [widthInput, setWidthInput] = useState(item.width);
  const [heightInput, setHeightInput] = useState(item.height);

  useEffect(() => {
    setWidthInput(item.width);
    setHeightInput(item.height);
  }, [item.width, item.height]);

  const handleApplyDimensions = (e) => {
    if (e) e.preventDefault();
    const w = parseInt(widthInput, 10);
    const h = parseInt(heightInput, 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      onUpdateDimensions({
        id: item.id,
        width: Math.max(item.minWidth || 40, w),
        height: Math.max(item.minHeight || 30, h),
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyDimensions();
    }
  };

  const setPreset = (w, h) => {
    onUpdateDimensions({
      id: item.id,
      width: w,
      height: h,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2 bg-zinc-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700/80 shadow-2xl text-xs select-none"
    >
      {/* Dimension Inputs */}
      <div className="flex items-center space-x-1 font-mono text-[11px]">
        <span className="text-zinc-500 font-semibold">W</span>
        <input
          type="number"
          min={item.minWidth || 40}
          max={1200}
          step={20}
          value={widthInput}
          onChange={(e) => setWidthInput(e.target.value)}
          onBlur={handleApplyDimensions}
          onKeyDown={handleKeyDown}
          className="w-14 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500"
        />
        <span className="text-zinc-500">×</span>
        <span className="text-zinc-500 font-semibold">H</span>
        <input
          type="number"
          min={item.minHeight || 30}
          max={1200}
          step={20}
          value={heightInput}
          onChange={(e) => setHeightInput(e.target.value)}
          onBlur={handleApplyDimensions}
          onKeyDown={handleKeyDown}
          className="w-14 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Quick Aspect Presets */}
      <div className="flex items-center space-x-1 pl-1 border-l border-zinc-800">
        <button
          type="button"
          title="Square 100x100"
          onClick={() => setPreset(120, 120)}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          1:1
        </button>
        <button
          type="button"
          title="Wide 200x100"
          onClick={() => setPreset(200, 100)}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          2:1
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 pl-1 border-l border-zinc-800">
        <button
          type="button"
          title="Bring to front"
          onClick={() => onBringToFront(item.id)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <BringToFront className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Delete piece"
          onClick={() => onDelete(item.id)}
          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
