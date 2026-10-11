import React, { useRef, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFarm } from '../../hooks/useFarm';
import { FarmItem } from './FarmItem';
import { Sparkles, Grid, MapPin, Compass, LayoutTemplate } from 'lucide-react';
import { EditorToolbar } from '../toolbar/EditorToolbar';
import { ObjectInspector } from '../inspector/ObjectInspector';
import { FarmBoundaryModal } from '../settings/FarmBoundaryModal';
import { pxToMeters, metersToPx } from '../../types/farm';

export const FarmCanvas = () => {
  const {
    items,
    selectedId,
    snapToGrid,
    addItem,
    updatePosition,
    updateDimensions,
    updateRotation,
    selectItem,
    deselectAll,
    deleteItem,
    duplicateItem,
    undo,
    redo,
    bringToFront,
    snapCoordinate,
    zoom,
    setZoom,
    farmSettings,
    farmStats,
    loadPresetFarm,
  } = useFarm();

  const canvasRef = useRef(null);
  const [showBoundaryModal, setShowBoundaryModal] = useState(false);

  // Keyboard Shortcuts (Undo, Redo, Duplicate, Delete, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not intercept if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z (without Shift)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedId) {
          e.preventDefault();
          duplicateItem(selectedId);
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteItem(selectedId);
        }
        return;
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        deselectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedId, duplicateItem, deleteItem, deselectAll]);

  // Pan state for canvas drag navigation
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Mouse wheel zoom (Ctrl+Wheel or Pinch) and Canvas Drag Panning
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // 1. Zoom with Ctrl/Cmd + Wheel or Trackpad Pinch
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        const current = Number(zoom) || 1.0;
        const next = Math.max(0.4, Math.min(2.5, Number((current + delta).toFixed(2))));
        setZoom(next);
        return;
      }

      // 2. Smooth 2D Vertical & Horizontal Scrolling
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Wheel scrolls horizontally
        el.scrollLeft += e.deltaY;
      } else {
        // Standard wheel: vertical deltaY to scrollTop, horizontal deltaX to scrollLeft
        el.scrollTop += e.deltaY;
        if (e.deltaX) {
          el.scrollLeft += e.deltaX;
        }
      }
    };

    const onMouseDown = (e) => {
      // Middle click (wheel) or clicking empty canvas background / transform layer allows drag panning
      const isCanvasBackground = 
        e.target === el || 
        e.target.classList?.contains('canvas-background') ||
        e.target.classList?.contains('canvas-sizer-layer') ||
        e.target.classList?.contains('canvas-transform-layer');

      if (e.button === 1 || (e.button === 0 && isCanvasBackground)) {
        if (e.button === 1) e.preventDefault();
        isPanning.current = true;
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
        };
      }
    };

    const onMouseMove = (e) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      el.scrollLeft = panStart.current.scrollLeft - dx;
      el.scrollTop = panStart.current.scrollTop - dy;
    };

    const onMouseUp = () => {
      isPanning.current = false;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [zoom, setZoom]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const itemDef = JSON.parse(rawData);
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (e.clientX - rect.left + canvasRef.current.scrollLeft) / zoom;
      const dropY = (e.clientY - rect.top + canvasRef.current.scrollTop) / zoom;

      // Center the dropped item at mouse pointer
      const rawX = dropX - itemDef.defaultWidth / 2;
      const rawY = dropY - itemDef.defaultHeight / 2;

      const x = Math.max(0, snapCoordinate(rawX));
      const y = Math.max(0, snapCoordinate(rawY));

      const newItem = {
        id: `farm-piece-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: itemDef.type,
        x,
        y,
        width: itemDef.defaultWidth,
        height: itemDef.defaultHeight,
        minWidth: itemDef.minWidth,
        minHeight: itemDef.minHeight,
        isPointIcon: Boolean(itemDef.isPointIcon),
      };

      addItem(newItem);
    } catch (err) {
      console.error('Failed to parse dropped item', err);
    }
  };

  const handleCanvasClick = (e) => {
    // Only deselect if clicked directly on canvas background or transform container
    if (
      e.target === canvasRef.current || 
      e.target.classList.contains('canvas-background') ||
      e.target.classList.contains('canvas-transform-layer') ||
      e.target.classList.contains('canvas-sizer-layer')
    ) {
      deselectAll();
    }
  };

  const boundaryWidthPx = metersToPx(farmSettings?.boundaryWidthM || 100);
  const boundaryHeightPx = metersToPx(farmSettings?.boundaryHeightM || 100);
  const baseCanvasWidth = Math.max(3200, boundaryWidthPx + 600);
  const baseCanvasHeight = Math.max(2600, boundaryHeightPx + 600);

  return (
    <div className="relative flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden select-none">
      {/* Editor Compact Action Toolbar (Undo, Redo, Duplicate, Delete, Zoom, Snap, Clear, Dimensions) */}
      <EditorToolbar onOpenFarmSettings={() => setShowBoundaryModal(true)} />

      {/* Object Inspector (Slides in automatically when an item is selected) */}
      <ObjectInspector />

      {/* Farm Boundary Real-World Setup Modal */}
      <FarmBoundaryModal
        isOpen={showBoundaryModal}
        onClose={() => setShowBoundaryModal(false)}
      />

      <main
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        className="relative w-full h-full farm-canvas-grid farm-canvas-grid-fine overflow-auto select-none"
      >

      {/* Exact-scale container so scrollbars dynamically reflect both horizontal and vertical virtual dimensions */}
      <div
        className="canvas-sizer-layer relative"
        style={{
          width: `${Math.round(baseCanvasWidth * zoom)}px`,
          height: `${Math.round(baseCanvasHeight * zoom)}px`,
        }}
      >
        {/* Transformable Canvas Layer with Zoom Scaling */}
        <div
          className="canvas-transform-layer absolute top-0 left-0 transition-transform duration-75 ease-out origin-top-left"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${baseCanvasWidth}px`,
            height: `${baseCanvasHeight}px`,
          }}
        >
        {/* Real-World Farm Boundary Marker Fence & Dimensions */}
        <div 
          className="absolute border-2 border-dashed border-amber-600/50 rounded-2xl pointer-events-none transition-all shadow-[0_0_50px_rgba(217,119,6,0.06)]"
          style={{
            left: '40px',
            top: '40px',
            width: `${boundaryWidthPx}px`,
            height: `${boundaryHeightPx}px`,
          }}
        >
          {/* Top-left boundary pill */}
          <div className="absolute -top-3.5 left-4 px-2.5 py-0.5 rounded-full bg-stone-950 border border-amber-600/70 text-[10px] font-mono text-amber-200 shadow-md flex items-center space-x-1">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>
              Boundary: {farmSettings?.boundaryWidthM || 100}m × {farmSettings?.boundaryHeightM || 100}m ({farmSettings?.totalSize || 2.5} {farmSettings?.unit || 'Acres'})
            </span>
          </div>

          {/* Bottom-right boundary label */}
          <div className="absolute -bottom-3 right-4 px-2 py-0.5 rounded bg-stone-950/90 border border-stone-800 text-[9px] font-mono text-stone-400">
            {farmSettings?.location || 'Zone 6b'}
          </div>
        </div>

        {/* Empty State Banner (Stardew / Clash of Clans Mission Board) */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 space-y-4">
            <div className="max-w-md w-full bg-gradient-to-b from-stone-900/95 to-stone-950/95 border-2 border-amber-900/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-center space-y-3 pointer-events-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-500/70 flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-bold text-amber-200 tracking-wide font-sans">
                  Build Your Digital Twin Farm Plot
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Drag elements from the left palette to start planning and building your digital twin:
                </p>
              </div>

              <div className="grid grid-cols-4 gap-1.5 py-1 text-[10px] font-mono text-amber-100">
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/crop_wheat.png" alt="Wheat" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">🌾 Wheat</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/crop_carrot.png" alt="Carrot" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">🥕 Carrot</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/crop_tomato.png" alt="Tomato" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">🍅 Tomato</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/crop_corn.png" alt="Corn" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">🌽 Corn</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/crop_pumpkin.png" alt="Pumpkin" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">🎃 Pumpkin</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/crop_strawberry.png" alt="Berry" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">🍓 Berry</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/tree_transparent.png" alt="Tree" className="w-5 h-5 pixel-crisp object-contain" />
                  <span className="truncate">🌳 Tree</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/fence_transparent.png" alt="Fence" className="w-5 h-5 pixel-crisp object-contain" />
                  <span className="truncate">🪵 Fence</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/building_barn.png" alt="Barn" className="w-5 h-5 pixel-crisp object-contain" />
                  <span className="truncate">🏠 Barn</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/decor_well.png" alt="Well" className="w-5 h-5 pixel-crisp object-contain" />
                  <span className="truncate">🪣 Well</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/path_stone.png" alt="Path" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">🪨 Path</span>
                </div>
                <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800 flex flex-col items-center space-y-1">
                  <img src="/assets/water_canal.png" alt="Canal" className="w-5 h-5 pixel-crisp" />
                  <span className="truncate">💧 Canal</span>
                </div>
              </div>

              <p className="text-[11px] text-amber-400 font-medium pt-1">
                💡 Tip: Once placed, tap <strong>"⚡ Ask AI Agronomist"</strong> to test drought or flood what-if scenarios!
              </p>
            </div>
          </div>
        )}

        {/* Placed Items on Canvas */}
        <AnimatePresence>
          {items.map((item) => (
            <FarmItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              snapToGrid={snapToGrid}
              onSelect={selectItem}
              onUpdatePosition={updatePosition}
              onUpdateDimensions={updateDimensions}
              onUpdateRotation={updateRotation}
              onDelete={deleteItem}
              onBringToFront={bringToFront}
            />
          ))}
        </AnimatePresence>
        </div>
      </div>

      {/* Subdued Bottom-Right Coordinates / Grid Status */}
      <div className="fixed bottom-3 right-4 z-30 flex items-center space-x-3 text-[11px] font-mono text-amber-200 bg-stone-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-amber-900/60 pointer-events-none shadow-lg">
        <div className="flex items-center space-x-1.5">
          <Grid className="w-3.5 h-3.5 text-amber-400" />
          <span>Snap: {snapToGrid ? '20px Grid' : 'Freeform'}</span>
        </div>
        <span className="text-stone-600">|</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="text-stone-600">|</span>
        <span>Objects: {items.length}</span>
      </div>
    </main>
    </div>
  );
};
