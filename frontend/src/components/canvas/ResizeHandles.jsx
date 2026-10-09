import React from 'react';

const HANDLES = [
  { id: 'nw', cursor: 'cursor-nwse-resize', position: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' },
  { id: 'n', cursor: 'cursor-ns-resize', position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
  { id: 'ne', cursor: 'cursor-nesw-resize', position: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
  { id: 'e', cursor: 'cursor-ew-resize', position: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
  { id: 'se', cursor: 'cursor-nwse-resize', position: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' },
  { id: 's', cursor: 'cursor-ns-resize', position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
  { id: 'sw', cursor: 'cursor-nesw-resize', position: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
  { id: 'w', cursor: 'cursor-ew-resize', position: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' },
];

export const ResizeHandles = ({ onStartResize, activeHandle }) => {
  return (
    <>
      {HANDLES.map(({ id, cursor, position }) => {
        const isActive = activeHandle === id;
        return (
          <div
            key={id}
            data-testid={`resize-handle-${id}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartResize(e, id);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartResize(e, id);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onStartResize(e, id);
            }}
            style={{ touchAction: 'none' }}
            className={`absolute z-50 w-3 h-3 rounded-full border border-zinc-950 bg-white hover:bg-emerald-400 hover:scale-125 transition-transform duration-100 ${cursor} ${position} shadow-md ${
              isActive ? 'scale-125 bg-emerald-400 ring-2 ring-emerald-500' : ''
            }`}
          />
        );
      })}
    </>
  );
};
