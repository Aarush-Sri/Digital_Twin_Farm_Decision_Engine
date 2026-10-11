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
import { EnvironmentBar } from '../components/simulation/EnvironmentBar';
import { WhatIfModal } from '../components/simulation/WhatIfModal';
import { AgentChatDrawer } from '../components/agent/AgentChatDrawer';
import { FarmProfileDrawer } from '../components/profile/FarmProfileDrawer';

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

  it('renders Header with brand, placed item count, and snap controls', () => {
    render(
      <FarmProvider>
        <Header />
      </FarmProvider>
    );

    expect(screen.getByText('DigiFarm')).toBeInTheDocument();
    expect(screen.getByText('Farm Canvas')).toBeInTheDocument();
    expect(screen.getByText(/Placed Items:/)).toBeInTheDocument();
    expect(screen.getByText(/Snap ON/)).toBeInTheDocument();
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

  it('renders WhatIfModal when open and shows scenario presets', () => {
    render(
      <FarmProvider>
        <WhatIfModal isOpen={true} onClose={vi.fn()} />
      </FarmProvider>
    );

    expect(screen.getByText('Sandbox What-If Decision Engine')).toBeInTheDocument();
    expect(screen.getByText(/Drip Irrigation/)).toBeInTheDocument();
    expect(screen.getByText(/NPK Fertilizer Boost/)).toBeInTheDocument();
  });

  it('renders AgentChatDrawer when open and shows multi-step console', () => {
    render(
      <FarmProvider>
        <AgentChatDrawer isOpen={true} onClose={vi.fn()} />
      </FarmProvider>
    );

    expect(screen.getByText('AI Agronomist')).toBeInTheDocument();
    expect(screen.getByText('Health Check')).toBeInTheDocument();
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

    // Click 2×2m preset
    const presetBtn = screen.getByText('2×2m');
    fireEvent.click(presetBtn);
    expect(mockUpdateDimensions).toHaveBeenCalledWith({
      id: 'test-item',
      width: 80,
      height: 80,
    });

    // Click delete
    const deleteBtn = screen.getByTitle('Delete piece');
    fireEvent.click(deleteBtn);
    expect(mockDelete).toHaveBeenCalledWith('test-item');
  });

  it('renders FarmProfileDrawer with side navigation tabs and presets', () => {
    const mockClose = vi.fn();

    render(
      <FarmProvider>
        <FarmProfileDrawer isOpen={true} onClose={mockClose} />
      </FarmProvider>
    );

    expect(screen.getByText('Farm Plot Profile')).toBeInTheDocument();
    expect(screen.getByText('Universal Config')).toBeInTheDocument();

    // Verify side navigation tabs
    expect(screen.getByText('Location & Terrain')).toBeInTheDocument();
    expect(screen.getByText('Climate & Weather')).toBeInTheDocument();
    expect(screen.getByText('Soil Chemistry')).toBeInTheDocument();
    expect(screen.getByText('Water Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Farm Operations')).toBeInTheDocument();

    // Click Climate & Weather tab
    fireEvent.click(screen.getByText('Climate & Weather'));
    expect(screen.getByText('Atmospheric & Thermal Dynamics')).toBeInTheDocument();

    // Click Soil Chemistry tab
    fireEvent.click(screen.getByText('Soil Chemistry'));
    expect(screen.getByText('Dominant Texture Class')).toBeInTheDocument();

    // Click Water Infrastructure tab
    fireEvent.click(screen.getByText('Water Infrastructure'));
    expect(screen.getByText('Water Supply & Storage Reserves')).toBeInTheDocument();

    // Click Midwest Heartland preset
    const presetBtn = screen.getByText('Midwest Heartland');
    fireEvent.click(presetBtn);

    expect(screen.getByText('Save Profile Changes')).toBeInTheDocument();
  });
});
