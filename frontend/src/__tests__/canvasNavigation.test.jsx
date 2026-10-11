import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FarmCanvas } from '../components/canvas/FarmCanvas';
import { FarmProvider } from '../context/FarmContext';

describe('FarmCanvas 2D Unconstrained Navigation', () => {
  it('allows wheel panning in all directions: up, down, left, and right without clamping at 0', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    expect(canvasMain).toBeInTheDocument();

    const transformLayer = container.querySelector('.canvas-transform-layer');
    expect(transformLayer).toBeInTheDocument();

    // Initial transform: should have non-zero or defined translate
    const initialTransform = transformLayer.style.transform;
    expect(initialTransform).toMatch(/translate\(-?\d+px,\s*-?\d+px\)/);

    // 1. Scroll Up (deltaY < 0) - MUST be able to move up (increasing pan.y without clamping to 0)
    fireEvent.wheel(canvasMain, { deltaY: -120, deltaX: 0 });
    const afterScrollUpTransform = transformLayer.style.transform;
    expect(afterScrollUpTransform).not.toEqual(initialTransform);

    // 2. Scroll Left (deltaX < 0) - MUST be able to move left (increasing pan.x without clamping to 0)
    fireEvent.wheel(canvasMain, { deltaY: 0, deltaX: -150 });
    const afterScrollLeftTransform = transformLayer.style.transform;
    expect(afterScrollLeftTransform).not.toEqual(afterScrollUpTransform);

    // 3. Scroll Down (deltaY > 0)
    fireEvent.wheel(canvasMain, { deltaY: 200, deltaX: 0 });
    const afterScrollDownTransform = transformLayer.style.transform;
    expect(afterScrollDownTransform).not.toEqual(afterScrollLeftTransform);

    // 4. Scroll Right (deltaX > 0)
    fireEvent.wheel(canvasMain, { deltaY: 0, deltaX: 180 });
    const afterScrollRightTransform = transformLayer.style.transform;
    expect(afterScrollRightTransform).not.toEqual(afterScrollDownTransform);

    // 5. Shift + Scroll (Horizontal Scroll with shiftKey)
    fireEvent.wheel(canvasMain, { deltaY: -80, deltaX: 0, shiftKey: true });
    const afterShiftScrollTransform = transformLayer.style.transform;
    expect(afterShiftScrollTransform).not.toEqual(afterScrollRightTransform);
  });

  it('allows free navigation into negative coordinate quadrants (pan.x < 0 and pan.y < 0)', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    const transformLayer = container.querySelector('.canvas-transform-layer');

    // Scroll far down and right (deltaY > 0, deltaX > 0) to push into negative pan
    for (let i = 0; i < 10; i++) {
      fireEvent.wheel(canvasMain, { deltaY: 500, deltaX: 500 });
    }

    const transform = transformLayer.style.transform;
    expect(transform).toMatch(/translate\(-\d+px,\s*-\d+px\)/);

    // Now scroll back up and left (deltaY < 0, deltaX < 0) freely
    for (let i = 0; i < 20; i++) {
      fireEvent.wheel(canvasMain, { deltaY: -500, deltaX: -500 });
    }

    const transformPositive = transformLayer.style.transform;
    // Should now be positive pan in quadrant II
    expect(transformPositive).toMatch(/translate\(\d+px,\s*\d+px\)/);
  });

  it('supports background drag panning using mouse down, move, and up', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    const transformLayer = container.querySelector('.canvas-transform-layer');
    const initialTransform = transformLayer.style.transform;

    // Mouse down on empty canvas background
    fireEvent.mouseDown(canvasMain, { button: 0, clientX: 200, clientY: 200 });

    // Drag move to a new position
    fireEvent.mouseMove(window, { clientX: 350, clientY: 420 });

    const draggedTransform = transformLayer.style.transform;
    expect(draggedTransform).not.toEqual(initialTransform);

    // Release mouse
    fireEvent.mouseUp(window);

    // Moving mouse after mouseUp should NOT change transform
    fireEvent.mouseMove(window, { clientX: 500, clientY: 600 });
    expect(transformLayer.style.transform).toEqual(draggedTransform);
  });

  it('supports middle-click (mouse button 1) drag panning anywhere', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    const transformLayer = container.querySelector('.canvas-transform-layer');
    const initialTransform = transformLayer.style.transform;

    // Middle-click down
    fireEvent.mouseDown(canvasMain, { button: 1, clientX: 300, clientY: 300 });

    // Drag move
    fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });

    const draggedTransform = transformLayer.style.transform;
    expect(draggedTransform).not.toEqual(initialTransform);

    fireEvent.mouseUp(window);
  });

  it('allows keyboard arrow keys to pan the board in all directions', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const transformLayer = container.querySelector('.canvas-transform-layer');
    const beforeArrow = transformLayer.style.transform;

    // Press ArrowUp
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(transformLayer.style.transform).not.toEqual(beforeArrow);

    // Press ArrowDown
    const beforeDown = transformLayer.style.transform;
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(transformLayer.style.transform).not.toEqual(beforeDown);

    // Press ArrowLeft
    const beforeLeft = transformLayer.style.transform;
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(transformLayer.style.transform).not.toEqual(beforeLeft);

    // Press ArrowRight
    const beforeRight = transformLayer.style.transform;
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(transformLayer.style.transform).not.toEqual(beforeRight);
  });

  it('supports focal zoom via Ctrl + mouse wheel', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    const transformLayer = container.querySelector('.canvas-transform-layer');
    const initialTransform = transformLayer.style.transform;

    // Zoom In with Ctrl + Wheel Up (deltaY < 0)
    fireEvent.wheel(canvasMain, { deltaY: -100, ctrlKey: true, clientX: 400, clientY: 300 });
    const zoomedInTransform = transformLayer.style.transform;
    expect(zoomedInTransform).not.toEqual(initialTransform);
    expect(zoomedInTransform).toMatch(/scale\(1\.15\)/);

    // Zoom Out with Ctrl + Wheel Down (deltaY > 0)
    fireEvent.wheel(canvasMain, { deltaY: 100, ctrlKey: true, clientX: 400, clientY: 300 });
    const zoomedOutTransform = transformLayer.style.transform;
    expect(zoomedOutTransform).toMatch(/scale\(1\)/);
  });

  it('provides a Center Board button in the EditorToolbar that centers the board', () => {
    render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const centerBtn = screen.getByTitle(/Center Board/i);
    expect(centerBtn).toBeInTheDocument();
    fireEvent.click(centerBtn);
  });

  it('supports pressing "C" key to center the board', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    // Scroll far away
    fireEvent.wheel(canvasMain, { deltaY: 1000, deltaX: 1000 });

    // Press 'c' to center
    fireEvent.keyDown(window, { key: 'c' });
  });

  it('calculates drop coordinates correctly using virtual pan offset and zoom', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    expect(canvasMain).toBeInTheDocument();

    const dataTransfer = {
      getData: (format) => {
        if (format === 'application/json') {
          return JSON.stringify({
            type: 'carrot',
            defaultWidth: 80,
            defaultHeight: 80,
            minWidth: 40,
            minHeight: 40,
            isPointIcon: false,
          });
        }
        return '';
      },
      dropEffect: 'none',
    };

    // Drag over
    fireEvent.dragOver(canvasMain, { dataTransfer });

    // Drop at screen coordinate (400, 300)
    fireEvent.drop(canvasMain, {
      clientX: 400,
      clientY: 300,
      dataTransfer,
    });

    // Object count should increase
    expect(screen.getByText(/Objects: 23/)).toBeInTheDocument();
  });
});
