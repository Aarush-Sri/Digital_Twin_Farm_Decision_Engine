import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFarm } from '../../hooks/useFarm';
import { FarmItem } from './FarmItem';
import { Sparkles, Grid, Compass } from 'lucide-react';
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

  // Virtual 2D pan camera offset (allows infinite, unconstrained 360° navigation anywhere)
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const panRef = useRef(pan);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const boundaryWidthPx = metersToPx(farmSettings?.boundaryWidthM || 100);
  const boundaryHeightPx = metersToPx(farmSettings?.boundaryHeightM || 100);
  const baseCanvasWidth = Math.max(3200, boundaryWidthPx + 600);
  const baseCanvasHeight = Math.max(2600, boundaryHeightPx + 600);

  // Center the farm boundary in the canvas viewport
  const handleCenterFarm = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const farmW = boundaryWidthPx * zoom;
    const farmH = boundaryHeightPx * zoom;
    const targetX = Math.round((rect.width - farmW) / 2);
    const targetY = Math.round((rect.height - farmH) / 2);
    setPan({ x: targetX, y: targetY });
  }, [boundaryWidthPx, boundaryHeightPx, zoom]);

  // Keyboard Shortcuts (Undo, Redo, Duplicate, Delete, Esc, Pan with Arrows, Center with 'C')
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
        return;
      }

      // Center board with 'c' or 'C'
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleCenterFarm();
        return;
      }

      // Unconstrained keyboard pan navigation with Arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 80 : 30;
        setPan((prev) => {
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = step;
          if (e.key === 'ArrowDown') dy = -step;
          if (e.key === 'ArrowLeft') dx = step;
          if (e.key === 'ArrowRight') dx = -step;
          return { x: prev.x + dx, y: prev.y + dy };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedId, duplicateItem, deleteItem, deselectAll, handleCenterFarm]);

  // Pan state for canvas drag navigation
  const isPanning = useRef(false);
  const panStart = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });

  // Unconstrained 360° Mouse wheel navigation and Canvas Drag Panning
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();

      // 1. Zoom with Ctrl/Cmd + Wheel or Trackpad Pinch
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        const current = Number(zoom) || 1.0;
        const next = Math.max(0.4, Math.min(2.5, Number((current + delta).toFixed(2))));
        if (next !== current) {
          const rect = el.getBoundingClientRect();
          const cursorX = e.clientX - rect.left;
          const cursorY = e.clientY - rect.top;
          const canvasX = (cursorX - panRef.current.x) / current;
          const canvasY = (cursorY - panRef.current.y) / current;
          const newPanX = cursorX - canvasX * next;
          const newPanY = cursorY - canvasY * next;
          setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
          setZoom(next);
        }
        return;
      }

      // 2. Unconstrained 2D Panning (Move anywhere: Up, Down, Left, Right)
      let deltaX = e.deltaX;
      let deltaY = e.deltaY;
      if (e.shiftKey) {
        // Shift+Wheel translates to horizontal movement
        deltaX = e.deltaY;
        deltaY = 0;
      }

      setPan((prev) => ({
        x: Math.round(prev.x - deltaX),
        y: Math.round(prev.y - deltaY),
      }));
    };

    const onMouseDown = (e) => {
      // Middle click (wheel) or clicking empty canvas background / transform layer allows drag panning
      const isCanvasBackground = 
        e.target === el || 
        e.target.classList?.contains('farm-canvas-grid') ||
        e.target.classList?.contains('canvas-background') ||
        e.target.classList?.contains('canvas-sizer-layer') ||
        e.target.classList?.contains('canvas-transform-layer');

      if (e.button === 1 || (e.button === 0 && isCanvasBackground)) {
        if (e.button === 1) e.preventDefault();
        isPanning.current = true;
        panStart.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        };
      }
    };

    const onMouseMove = (e) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.mouseX;
      const dy = e.clientY - panStart.current.mouseY;
      setPan({
        x: Math.round(panStart.current.panX + dx),
        y: Math.round(panStart.current.panY + dy),
      });
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
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const rawData = e.dataTransfer?.getData('application/json');
    if (!rawData) return;

    try {
      const itemDef = JSON.parse(rawData);
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (e.clientX - rect.left - pan.x) / zoom;
      const dropY = (e.clientY - rect.top - pan.y) / zoom;

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
      e.target.classList?.contains('farm-canvas-grid') ||
      e.target.classList?.contains('canvas-background') ||
      e.target.classList?.contains('canvas-transform-layer') ||
      e.target.classList?.contains('canvas-sizer-layer')
    ) {
      deselectAll();
    }
  };

  return (
    <div className="relative flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden select-none">
      {/* Editor Compact Action Toolbar (Undo, Redo, Duplicate, Delete, Zoom, Snap, Clear, Dimensions, Center) */}
      <EditorToolbar 
        onOpenFarmSettings={() => setShowBoundaryModal(true)} 
        onCenterFarm={handleCenterFarm}
      />

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
        className="relative w-full h-full farm-canvas-grid farm-canvas-grid-fine overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px, ${40 * zoom}px ${40 * zoom}px, ${40 * zoom}px ${40 * zoom}px, ${324 * zoom}px ${190 * zoom}px`,
        }}
      >
        {/* Exact-scale layer for virtual canvas hierarchy */}
        <div className="canvas-sizer-layer relative w-full h-full pointer-events-none">
          {/* Virtual 2D Transformable Canvas Layer with Translation Pan and Zoom Scaling */}
          <div
            className="canvas-transform-layer absolute top-0 left-0 transition-none origin-top-left pointer-events-auto"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
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
                  zoom={zoom}
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
      </main>

      {/* Subdued Bottom-Right Coordinates / Grid Status */}
      <div className="fixed bottom-3 right-4 z-30 flex items-center space-x-3 text-[11px] font-mono text-amber-200 bg-stone-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-amber-900/60 pointer-events-none shadow-lg">
        <div className="flex items-center space-x-1.5">
          <Grid className="w-3.5 h-3.5 text-amber-400" />
          <span>Snap: {snapToGrid ? '20px Grid' : 'Freeform'}</span>
        </div>
        <span className="text-stone-600">|</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="text-stone-600">|</span>
        <span>Pos: ({pan.x}, {pan.y})</span>
        <span className="text-stone-600">|</span>
        <span>Objects: {items.length}</span>
      </div>
    </div>
  );
};
