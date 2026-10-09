import { useState, useCallback } from 'react';
import { GRID_SIZE } from '../types/farm';

export const useResize = ({ item, snapToGrid, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);

  const startResize = useCallback(
    (e, handle) => {
      e.stopPropagation();
      e.preventDefault();

      setIsResizing(true);
      setActiveHandle(handle);

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startWidth = item.width;
      const startHeight = item.height;
      const startX = item.x;
      const startY = item.y;

      const handleMouseMove = (moveEvent) => {
        let deltaX = moveEvent.clientX - startClientX;
        let deltaY = moveEvent.clientY - startClientY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startX;
        let newY = startY;

        const minW = Math.max(40, item.minWidth || 40);
        const minH = Math.max(30, item.minHeight || 30);

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

      const handleMouseUp = () => {
        setIsResizing(false);
        setActiveHandle(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [item, snapToGrid, onResize]
  );

  return {
    isResizing,
    activeHandle,
    startResize,
  };
};
