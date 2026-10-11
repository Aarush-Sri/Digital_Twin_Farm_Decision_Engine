import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { getItemDefinition, GRID_SIZE, pxToMeters } from '../../types/farm';
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
  const dragStartPos = useRef({ mouseX: 0, mouseY: 0, itemX: 0, itemY: 0 });

  const { isResizing, activeHandle, startResize } = useResize({
    item,
    snapToGrid,
    onResize: onUpdateDimensions,
  });

  const handlePointerDown = (e) => {
    // If clicking on resize handle or badge, ignore item dragging
    if (
      e.target.closest('[data-testid^="resize-handle"]') || 
      e.target.closest('button') || 
      e.target.closest('input')
    ) {
      return;
    }

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

  const isSlim = item.height < 32 || item.width < 32;
  const isCompact = item.height < 60 || item.width < 60;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      whileHover={{ scale: isResizing ? 1 : 1.01 }}
      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: isSelected ? Math.max(item.zIndex, 900) : item.zIndex,
      }}
      onPointerDown={handlePointerDown}
      className={`absolute cursor-move select-none rounded-lg border transition-shadow ${
        isSelected
          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950 shadow-2xl'
          : 'hover:border-zinc-400 shadow-md'
      }`}
    >
      {/* Visual Content Layer */}
      <div
        className="w-full h-full rounded-lg overflow-hidden relative flex flex-col items-center justify-center"
        style={{
          backgroundColor: itemDef.color.bg,
          borderColor: itemDef.color.border,
          boxShadow: isSelected ? `0 0 20px ${itemDef.color.glow}` : 'none',
        }}
      >
        {/* Subtle decorative background textures */}
        {item.type === 'grass' && (
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
        )}
        {item.type === 'water' && (
          <div className="absolute inset-0 opacity-35 bg-[repeating-linear-gradient(45deg,#0284c7,#0284c7_8px,#0369a1_8px,#0369a1_16px)] animate-pulse" />
        )}
        {item.type === 'fence' && (
          <div className="absolute inset-0 flex items-center justify-around px-1 opacity-80">
            {/* Wooden posts spaced along fence length */}
            <div className="w-1.5 h-full bg-amber-900 border-x border-amber-950 shadow" />
            <div className="w-1.5 h-full bg-amber-900 border-x border-amber-950 shadow" />
            <div className="w-1.5 h-full bg-amber-900 border-x border-amber-950 shadow" />
            <div className="w-1.5 h-full bg-amber-900 border-x border-amber-950 shadow" />
          </div>
        )}
        {item.type === 'wheat' && (
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#facc15_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
        )}
        {item.type === 'carrot' && (
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#f97316_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
        )}

        {/* Content Badge / Labels */}
        {!isSlim && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-1 space-y-0.5 pointer-events-none">
            <div 
              className="p-1 rounded border shadow-sm backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.45)', 
                borderColor: itemDef.color.border,
                color: itemDef.color.accent 
              }}
            >
              <IconComponent className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </div>
            
            {!isCompact && (
              <span 
                className="text-[10px] font-semibold tracking-wider font-mono uppercase text-white drop-shadow px-1 py-0.2 rounded bg-black/50"
              >
                {itemDef.label}
              </span>
            )}
            
            <span className="text-[9px] font-mono font-bold text-zinc-200 drop-shadow px-1 rounded bg-black/40">
              {pxToMeters(item.width)} × {pxToMeters(item.height)}
            </span>
          </div>
        )}

        {/* Slim view for fences or thin items */}
        {isSlim && (
          <div className="relative z-10 flex items-center justify-center w-full h-full px-2 pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-amber-200 drop-shadow truncate">
              {itemDef.label} ({pxToMeters(item.width)})
            </span>
          </div>
        )}
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
