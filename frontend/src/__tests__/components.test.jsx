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
import { FormattedMessage } from '../components/agent/FormattedMessage';

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

  it('renders Header with clean AI title, Profile button, Preset Farm, and active AI model badge', () => {
    const mockOpenProfile = vi.fn();
    render(
      <FarmProvider>
        <Header onOpenProfile={mockOpenProfile} />
      </FarmProvider>
    );

    expect(screen.getByText('GreenTwin')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Preset Farm')).toBeInTheDocument();
    expect(screen.getByText(/⚡ Ask AI/)).toBeInTheDocument();
    expect(screen.getByText(/Llama 3.2/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Profile'));
    expect(mockOpenProfile).toHaveBeenCalled();
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

  it('renders FarmCanvas with default pre-designed preset farm items', () => {
    render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    // Preset farm items must be pre-loaded so user doesn't design every time
    expect(screen.getByAltText('Timber Barn')).toBeInTheDocument();
    expect(screen.getByAltText('Stone Well')).toBeInTheDocument();
    expect(screen.getAllByAltText('Orchard Tree').length).toBeGreaterThan(0);
    expect(screen.getByText(/Objects: 22/)).toBeInTheDocument();
  });

  it('renders EditorToolbar static in the middle top outside the scrolling canvas', () => {
    const { container } = render(
      <FarmProvider>
        <FarmCanvas />
      </FarmProvider>
    );

    const canvasMain = container.querySelector('main');
    expect(canvasMain).toBeInTheDocument();

    const zoomResetBtn = screen.getByTitle('Reset Zoom to 100%');
    const toolbar = zoomResetBtn.closest('[class*="z-30"]');
    expect(toolbar).toBeInTheDocument();

    // Must be outside the scrolling main container so wheel scrolling doesn't move it
    expect(canvasMain).not.toContainElement(toolbar);

    // Must be centered in the middle top
    expect(toolbar.className).toMatch(/left-1\/2/);
    expect(toolbar.className).toMatch(/-translate-x-1\/2/);
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

  it('renders AgentChatDrawer with Simulation Panel, AI settings, and active model indication', () => {
    render(
      <FarmProvider>
        <AgentChatDrawer isOpen={true} onClose={vi.fn()} />
      </FarmProvider>
    );

    expect(screen.getByText('AI Agronomist')).toBeInTheDocument();
    expect(screen.getByText('Simulation Panel')).toBeInTheDocument();
    expect(screen.getByText(/Chat/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Active AI Model:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Llama 3.2/i).length).toBeGreaterThan(0);

    // Open Settings: should NOT show the chat page or simulation tab switcher
    const settingsBtn = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsBtn);

    expect(screen.getByText('AI Settings & Models')).toBeInTheDocument();
    expect(screen.getByText('Preferred AI Provider:')).toBeInTheDocument();
    expect(screen.queryByText('Simulation Panel')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Ask about crops/i)).not.toBeInTheDocument();

    // Click Done to return to chat
    fireEvent.click(screen.getByText(/Done & Return to Chat/i));
    expect(screen.getByText('Simulation Panel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about crops/i)).toBeInTheDocument();
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
        showDimensions={true}
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

    expect(screen.getByText('Farm Profile')).toBeInTheDocument();
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

  it('renders FormattedMessage cleanly without raw markdown syntax', () => {
    const rawMarkdown = `### ☀️ Scenario Analysis: Drought & Heat
**Atmospheric Impact:**
- Reference Evapotranspiration ($ET_0$): \`4.2 mm/day\`
- Soil moisture drops rapidly with $CO_2$ halting
1. Add Water Canals to maintain moisture
| Crop | Yield |
|---|---|
| Wheat | 9.9 kg |`;

    render(<FormattedMessage content={rawMarkdown} />);

    // Headings, bold, inline code rendered as elements, not raw syntax
    expect(screen.getByText(/Scenario Analysis: Drought & Heat/)).toBeInTheDocument();
    expect(screen.queryByText(/###/)).not.toBeInTheDocument();
    expect(screen.getByText('Atmospheric Impact:')).toBeInTheDocument();
    expect(screen.getByText('4.2 mm/day')).toBeInTheDocument();
    expect(screen.getByText(/ET₀/)).toBeInTheDocument();
    expect(screen.getByText(/CO₂/)).toBeInTheDocument();
    expect(screen.getByText('Add Water Canals to maintain moisture')).toBeInTheDocument();
    // Tables rendered cleanly
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Wheat')).toBeInTheDocument();
    expect(screen.getByText('9.9 kg')).toBeInTheDocument();
  });
});
