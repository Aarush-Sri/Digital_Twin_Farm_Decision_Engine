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
  Carrot as CarrotIcon,
  Cherry,
  CircleDot,
  Warehouse,
  Footprints,
  RotateCw
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

export const FarmItem = ({
  item,
  isSelected,
  snapToGrid,
  zoom = 1,
  onSelect,
  onUpdatePosition,
  onUpdateDimensions,
  onUpdateRotation,
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
      const zoomFactor = Number(zoom) || 1;
      let dx = (moveEvent.clientX - dragStartPos.current.mouseX) / zoomFactor;
      let dy = (moveEvent.clientY - dragStartPos.current.mouseY) / zoomFactor;

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

  const isPoint = Boolean(item.isPointIcon || itemDef.isPointIcon);
  const isLine = item.type === 'fence' || item.type === 'pipe';
  const isSlim = item.height < 32 || item.width < 32;
  const isCompact = item.height < 60 || item.width < 60;

  const isFrameless = isPoint || item.type === 'tree' || item.type.includes('tree') || item.type === 'fence' || item.type === 'barn' || item.type === 'well' || item.type === 'gate' || item.type === 'shed';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: item.rotation || 0 }}
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
      className={`absolute cursor-move select-none rounded-lg transition-all ${
        isSelected
          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 shadow-2xl z-50'
          : 'hover:ring-1 hover:ring-amber-300/60 shadow-lg'
      }`}
    >
      {/* Visual Content Layer */}
      <div
        className="w-full h-full rounded-lg overflow-hidden relative flex flex-col items-center justify-center pixel-crisp"
        style={{
          boxShadow: isSelected ? `0 0 24px rgba(251, 191, 36, 0.45)` : isFrameless ? 'none' : '0 4px 10px rgba(0,0,0,0.3)',
          border: isFrameless ? 'none' : `1.5px solid ${itemDef.color.border}`,
          backgroundColor: isFrameless ? 'transparent' : itemDef.color.bg,
        }}
      >
        {/* UPRIGHT SPRITES & POINT ICONS: Orchard Tree, Neem, Mango, Coconut, Barn, Well, Shed, Gate, Sprinkler */}
        {isFrameless && item.type !== 'fence' && (
          <div className="relative w-full h-full flex flex-col items-center justify-end overflow-visible pointer-events-none">
            <div className="absolute bottom-1 w-[75%] h-3 bg-black/45 rounded-full blur-[1.5px] -z-0" />
            <img 
              src={itemDef.image || '/assets/tree_transparent.png'} 
              alt={itemDef.label} 
              className="w-full h-full object-contain pixel-crisp z-10 drop-shadow-md transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {/* WOOD FENCE: Thick, longer, natural transparent Stardew wooden rails */}
        {item.type === 'fence' && (
          <div 
            className="absolute inset-0 pixel-crisp flex items-center justify-center overflow-visible"
            style={{
              backgroundImage: "url('/assets/fence_transparent.png')",
              backgroundSize: 'auto 100%',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'left center',
              filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))',
            }}
          />
        )}

        {/* TILED CROPS & TERRAIN SURFACES: Paddy, Sugarcane, Banana, Wheat, Carrot, Tomato, Corn, Pumpkin, Strawberry, Grass, Soil, Water, Stone Path */}
        {!isFrameless && (
          <div 
            className="absolute inset-0 pixel-crisp shadow-inner"
            style={{
              backgroundImage: `url('${itemDef.image || '/assets/soil_tile.png'}')`,
              backgroundSize: item.type === 'stone_path' 
                ? '120px 40px' 
                : item.type === 'grass'
                ? '80px 46px'
                : item.type === 'pumpkin'
                ? '100px 100px'
                : '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            {item.type === 'water' && (
              <div className="absolute inset-0 bg-sky-400/10 mix-blend-overlay animate-pulse" />
            )}
            <div 
              className="absolute inset-0 border rounded-lg pointer-events-none" 
              style={{ borderColor: `${itemDef.color?.border || '#ca8a04'}70` }} 
            />
          </div>
        )}

        {/* Content Badge */}
        {!isSlim && !isFrameless && (
          <div className="relative z-20 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
            <div 
              className="px-1.5 py-0.5 rounded shadow-md backdrop-blur-md flex items-center space-x-1 border"
              style={{ 
                backgroundColor: 'rgba(20, 15, 10, 0.75)', 
                borderColor: itemDef.color.border,
                color: itemDef.color.accent 
              }}
            >
              <IconComponent className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-amber-100">
                {itemDef.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* When selected: Show Resize Handles & Floating Dimension Toolbar */}
      {isSelected && (
        <>
          {!isPoint && (
            <ResizeHandles
              activeHandle={activeHandle}
              onStartResize={startResize}
            />
          )}
          {isLine && onUpdateRotation && (
            <button
              type="button"
              title="Rotate 90°"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateRotation(item.id, ((item.rotation || 0) + 90) % 360);
              }}
              className="absolute -top-3.5 -right-3.5 z-50 p-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-full shadow-xl border-2 border-stone-950 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
          <DimensionBadge
            item={item}
            onUpdateDimensions={onUpdateDimensions}
            onUpdateRotation={onUpdateRotation}
            onDelete={onDelete}
            onBringToFront={onBringToFront}
          />
        </>
      )}
    </motion.div>
  );
};
