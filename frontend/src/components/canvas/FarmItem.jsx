import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { getItemDefinition, GRID_SIZE } from '../../types/farm';
import { ResizeHandles } from './ResizeHandles';
import { DimensionBadge } from './DimensionBadge';
import { useResize } from '../../hooks/useResize';
import { 
  Sprout, 
  Trees, 
  Waves, 
  Fence as FenceIcon, 
  Wheat as WheatIcon, 
  Carrot as CarrotIcon 
} from 'lucide-react';

const ICON_MAP = {
  Sprout,
  Trees,
  Waves,
  Fence: FenceIcon,
  Wheat: WheatIcon,
  Carrot: CarrotIcon,
};

export const FarmItem = ({
  item,
  isSelected,
  snapToGrid,
  onSelect,
  onUpdatePosition,
  onUpdateDimensions,
  onDelete,
  onBringToFront,
}) => {
  const itemDef = getItemDefinition(item.type);
  const IconComponent = ICON_MAP[itemDef.iconName] || Sprout;
  const isDraggingItem = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  const { isResizing, activeHandle, startResize } = useResize({
    item,
    snapToGrid,
    onResize: onUpdateDimensions,
  });

  const handlePointerDown = (e) => {
    if (e.target.closest('[data-testid^="resize-handle"]')) return;
    e.stopPropagation();
    onSelect(item.id);

    isDraggingItem.current = true;
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      itemX: item.x,
      itemY: item.y,
    };

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingItem.current) return;
      let dx = moveEvent.clientX - dragStartPos.current.mouseX;
      let dy = moveEvent.clientY - dragStartPos.current.mouseY;

      let newX = dragStartPos.current.itemX + dx;
      let newY = dragStartPos.current.itemY + dy;

      if (snapToGrid) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      } else {
        newX = Math.round(newX);
        newY = Math.round(newY);
      }

      onUpdatePosition(item.id, Math.max(0, newX), Math.max(0, newY));
    };

    const handlePointerUp = () => {
      isDraggingItem.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      whileHover={{ scale: isResizing ? 1 : 1.008 }}
      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: item.zIndex,
      }}
      onPointerDown={handlePointerDown}
      className={`absolute cursor-move select-none rounded-xl border transition-shadow ${
        isSelected
          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950 shadow-xl'
          : 'hover:border-zinc-500 shadow-md'
      }`}
    >
      {/* Visual Content Layer */}
      <div
        className="w-full h-full rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-2"
        style={{
          backgroundColor: itemDef.color.bg,
          borderColor: itemDef.color.border,
          boxShadow: isSelected ? `0 0 25px ${itemDef.color.glow}` : 'none',
        }}
      >
        {/* Subtle decorative background texture depending on element */}
        {item.type === 'grass' && (
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />
        )}
        {item.type === 'water' && (
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,#0284c7,#0284c7_10px,#0369a1_10px,#0369a1_20px)] animate-pulse" />
        )}
        {item.type === 'fence' && (
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,#78350f,#78350f_6px,#451a03_6px,#451a03_20px)]" />
        )}
        {item.type === 'wheat' && (
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#facc15_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
        )}
        {item.type === 'carrot' && (
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#f97316_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
        )}

        {/* Center icon & element label */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1">
          <div 
            className="p-1.5 rounded-lg border shadow-sm backdrop-blur-sm"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.4)', 
              borderColor: itemDef.color.border,
              color: itemDef.color.accent 
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <span 
            className="text-[11px] font-semibold tracking-wider font-mono uppercase text-white drop-shadow-sm px-1.5 py-0.5 rounded bg-black/40"
          >
            {itemDef.label}
          </span>
          <span className="text-[9px] font-mono text-zinc-300 drop-shadow-sm">
            {item.width} × {item.height}
          </span>
        </div>
      </div>

      {/* When selected: Show Resize Handles & Floating Dimension Toolbar */}
      {isSelected && (
        <>
          <ResizeHandles
            activeHandle={activeHandle}
            onStartResize={startResize}
          />
          <DimensionBadge
            item={item}
            onUpdateDimensions={onUpdateDimensions}
            onDelete={onDelete}
            onBringToFront={onBringToFront}
          />
        </>
      )}
    </motion.div>
  );
};
