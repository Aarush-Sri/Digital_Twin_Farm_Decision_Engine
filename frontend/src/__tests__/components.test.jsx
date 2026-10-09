import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaletteCard } from '../components/palette/PaletteCard';
import { FARM_ITEMS } from '../types/farm';
import { FarmProvider } from '../context/FarmContext';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { FarmCanvas } from '../components/canvas/FarmCanvas';
import { DimensionBadge } from '../components/canvas/DimensionBadge';

describe('Farm UI Components', () => {
  it('renders PaletteCard with label, category, and quick add button', () => {
    const mockQuickAdd = vi.fn();
    const grassDef = FARM_ITEMS[0];

    render(<PaletteCard itemDef={grassDef} onQuickAdd={mockQuickAdd} />);

    expect(screen.getByText('Grass Plot')).toBeInTheDocument();
    expect(screen.getByText('Terrain')).toBeInTheDocument();

    const quickAddBtn = screen.getByTitle('Click to spawn on canvas');
    fireEvent.click(quickAddBtn);
    expect(mockQuickAdd).toHaveBeenCalledWith(grassDef);
  });

  it('renders Header with brand and controls', () => {
    render(
      <FarmProvider>
        <Header />
      </FarmProvider>
    );

    expect(screen.getByText('DigiFarm')).toBeInTheDocument();
    expect(screen.getByText(/Snap Grid:/)).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('renders Sidebar with all 6 farm items', () => {
    render(
      <FarmProvider>
        <Sidebar />
      </FarmProvider>
    );

    expect(screen.getByText('Farm Palette')).toBeInTheDocument();
    expect(screen.getByText('Grass Plot')).toBeInTheDocument();
    expect(screen.getByText('Orchard Tree')).toBeInTheDocument();
    expect(screen.getByText('Wood Fence')).toBeInTheDocument();
    expect(screen.getByText('Water Canal')).toBeInTheDocument();
    expect(screen.getByText('Wheat Crop')).toBeInTheDocument();
    expect(screen.getByText('Carrot Patch')).toBeInTheDocument();
  });

  it('renders FarmCanvas with empty state hint', () => {
    render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    expect(
      screen.getByText(/Drag elements from the left palette to start planning/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Objects: 0/)).toBeInTheDocument();
  });

  it('updates dimensions from DimensionBadge numeric inputs and presets', () => {
    const mockUpdateDimensions = vi.fn();
    const mockDelete = vi.fn();
    const mockBringToFront = vi.fn();

    const item = {
      id: 'test-item',
      type: 'grass',
      width: 140,
      height: 140,
      minWidth: 40,
      minHeight: 30,
    };

    render(
      <DimensionBadge
        item={item}
        onUpdateDimensions={mockUpdateDimensions}
        onDelete={mockDelete}
        onBringToFront={mockBringToFront}
      />
    );

    // Click 2:1 preset
    const presetBtn = screen.getByText('2:1');
    fireEvent.click(presetBtn);
    expect(mockUpdateDimensions).toHaveBeenCalledWith({
      id: 'test-item',
      width: 200,
      height: 100,
    });

    // Click delete
    const deleteBtn = screen.getByTitle('Delete piece');
    fireEvent.click(deleteBtn);
    expect(mockDelete).toHaveBeenCalledWith('test-item');
  });
});
