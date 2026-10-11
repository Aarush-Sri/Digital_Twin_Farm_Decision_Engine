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
  Footprints
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

  const isPoint = Boolean(item.isPointIcon || itemDef.isPointIcon);
  const isSlim = item.height < 32 || item.width < 32;
  const isCompact = item.height < 60 || item.width < 60;

  const isFrameless = isPoint || item.type === 'tree' || item.type.includes('tree') || item.type === 'fence' || item.type === 'barn' || item.type === 'well' || item.type === 'gate' || item.type === 'shed';

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
        {/* GRASS PLOT */}
        {item.type === 'grass' && (
          <div 
            className="absolute inset-0 pixel-crisp"
            style={{
              backgroundImage: "url('/assets/grass_tile.png')",
              backgroundSize: '80px 46px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border-2 border-emerald-500/40 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* TILLED SOIL: Loamy soil tile */}
        {item.type === 'soil' && (
          <div 
            className="absolute inset-0 pixel-crisp shadow-inner"
            style={{
              backgroundImage: "url('/assets/soil_tile.png')",
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-amber-800/60 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* WATER CANAL: Sparkling freshwater canal */}
        {item.type === 'water' && (
          <div 
            className="absolute inset-0 pixel-crisp shadow-inner"
            style={{
              backgroundImage: "url('/assets/water_canal.png')",
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 bg-sky-400/10 mix-blend-overlay animate-pulse" />
          </div>
        )}

        {/* WHEAT FIELD: Golden ripe grain rows */}
        {item.type === 'wheat' && (
          <div 
            className="absolute inset-0 pixel-crisp"
            style={{
              backgroundImage: "url('/assets/crop_wheat.png')",
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-amber-600/50 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* CARROT PATCH: Loamy soil with carrot tops */}
        {item.type === 'carrot' && (
          <div 
            className="absolute inset-0 pixel-crisp"
            style={{
              backgroundImage: "url('/assets/crop_carrot.png')",
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-orange-700/50 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* TOMATO VINE */}
        {item.type === 'tomato' && (
          <div 
            className="absolute inset-0 pixel-crisp"
            style={{
              backgroundImage: "url('/assets/crop_tomato.png')",
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-red-700/50 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* SWEET CORN */}
        {item.type === 'corn' && (
          <div 
            className="absolute inset-0 pixel-crisp"
            style={{
              backgroundImage: "url('/assets/crop_corn.png')",
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-lime-700/50 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* PUMPKIN PATCH */}
        {item.type === 'pumpkin' && (
          <div 
            className="absolute inset-0 pixel-crisp"
            style={{
              backgroundImage: "url('/assets/crop_pumpkin.png')",
              backgroundSize: '100px 100px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-orange-800/50 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* STRAWBERRY BED */}
        {item.type === 'strawberry' && (
          <div 
            className="absolute inset-0 pixel-crisp"
            style={{
              backgroundImage: "url('/assets/crop_strawberry.png')",
              backgroundSize: '80px 80px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-rose-700/50 rounded-lg pointer-events-none" />
          </div>
        )}

        {/* COBBLESTONE PATH */}
        {item.type === 'stone_path' && (
          <div 
            className="absolute inset-0 pixel-crisp shadow-inner"
            style={{
              backgroundImage: "url('/assets/path_stone.png')",
              backgroundSize: '120px 40px',
              backgroundRepeat: 'repeat',
            }}
          >
            <div className="absolute inset-0 border border-stone-600/40 rounded-lg pointer-events-none" />
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

        {/* ORCHARD TREE: Authentic Stardew Tree with isometric ground shadow */}
        {item.type === 'tree' && (
          <div className="relative w-full h-full flex flex-col items-center justify-end overflow-visible pointer-events-none">
            <div className="absolute bottom-1 w-[70%] h-3 bg-black/45 rounded-full blur-[1.5px] -z-0" />
            <img 
              src="/assets/tree_transparent.png" 
              alt="Orchard Tree" 
              className="w-full h-full object-contain pixel-crisp z-10 drop-shadow-md transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {/* TIMBER BARN */}
        {item.type === 'barn' && (
          <div className="relative w-full h-full flex flex-col items-center justify-end overflow-visible pointer-events-none">
            <div className="absolute bottom-1 w-[80%] h-4 bg-black/45 rounded-full blur-[2px] -z-0" />
            <img 
              src="/assets/building_barn.png" 
              alt="Timber Barn" 
              className="w-full h-full object-contain pixel-crisp z-10 drop-shadow-lg transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {/* STONE WELL */}
        {item.type === 'well' && (
          <div className="relative w-full h-full flex flex-col items-center justify-end overflow-visible pointer-events-none">
            <div className="absolute bottom-1 w-[75%] h-3 bg-black/45 rounded-full blur-[1.5px] -z-0" />
            <img 
              src="/assets/decor_well.png" 
              alt="Stone Well" 
              className="w-full h-full object-contain pixel-crisp z-10 drop-shadow-md transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {/* Content Badge / Scale Dimension Label */}
        {!isSlim && !isFrameless && (
          <div className="relative z-20 flex flex-col items-center justify-center text-center p-1 space-y-0.5 pointer-events-none">
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
            
            <span className="text-[8px] font-mono font-semibold text-zinc-300 drop-shadow px-1 rounded bg-black/60">
              {pxToMeters(item.width)} × {pxToMeters(item.height)}
            </span>
          </div>
        )}

        {/* Frameless scale indicator pill */}
        {isFrameless && item.type !== 'fence' && (
          <div className="absolute bottom-0 z-20 pointer-events-none px-1 rounded bg-black/65 border border-amber-500/50 text-[8px] font-mono font-bold text-amber-200">
            {pxToMeters(item.width)} × {pxToMeters(item.height)}
          </div>
        )}

        {/* Slim view for fences */}
        {item.type === 'fence' && (
          <div className="absolute bottom-0 z-20 flex items-center justify-center w-full px-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[8px] font-mono font-bold text-amber-100 drop-shadow px-1.5 py-0.2 rounded bg-black/75 border border-amber-800/60 truncate">
              Fence ({pxToMeters(item.width)})
            </span>
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
