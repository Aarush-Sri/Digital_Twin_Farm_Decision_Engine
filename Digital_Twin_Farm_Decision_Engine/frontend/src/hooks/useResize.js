import { useState, useCallback } from 'react';
import { GRID_SIZE } from '../types/farm';

export const useResize = ({ item, snapToGrid, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);

  const startResize = useCallback(
    (e, handle) => {
      e.stopPropagation();
      if (e.preventDefault) e.preventDefault();

      setIsResizing(true);
      setActiveHandle(handle);

      const startClientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
      const startClientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
      const startWidth = item.width;
      const startHeight = item.height;
      const startX = item.x;
      const startY = item.y;

      const minW = Math.max(10, item.minWidth ?? 12);
      const minH = Math.max(10, item.minHeight ?? 12);

      const handleMove = (moveEvent) => {
        const clientX = moveEvent.clientX ?? (moveEvent.touches ? moveEvent.touches[0].clientX : startClientX);
        const clientY = moveEvent.clientY ?? (moveEvent.touches ? moveEvent.touches[0].clientY : startClientY);

        let deltaX = clientX - startClientX;
        let deltaY = clientY - startClientY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startX;
        let newY = startY;

        if (handle.includes('e')) {
          newWidth = Math.max(minW, startWidth + deltaX);
        }
        if (handle.includes('w')) {
          const calculatedWidth = startWidth - deltaX;
          if (calculatedWidth >= minW) {
            newWidth = calculatedWidth;
            newX = startX + deltaX;
          } else {
            newWidth = minW;
            newX = startX + (startWidth - minW);
          }
        }
        if (handle.includes('s')) {
          newHeight = Math.max(minH, startHeight + deltaY);
        }
        if (handle.includes('n')) {
          const calculatedHeight = startHeight - deltaY;
          if (calculatedHeight >= minH) {
            newHeight = calculatedHeight;
            newY = startY + deltaY;
          } else {
            newHeight = minH;
            newY = startY + (startHeight - minH);
          }
        }

        if (snapToGrid) {
          newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
          newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;
          newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
          newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        } else {
          newWidth = Math.round(newWidth);
          newHeight = Math.round(newHeight);
          newX = Math.round(newX);
          newY = Math.round(newY);
        }

        onResize({
          id: item.id,
          width: Math.max(minW, newWidth),
          height: Math.max(minH, newHeight),
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        });
      };

      const handleEnd = () => {
        setIsResizing(false);
        setActiveHandle(null);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleEnd);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleEnd);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    },
    [item, snapToGrid, onResize]
  );

  return {
    isResizing,
    activeHandle,
    startResize,
  };
};
