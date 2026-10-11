import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FarmProvider } from '../context/FarmContext';
import { farmReducer, INITIAL_STATE, ACTION_TYPES } from '../context/farmReducer';
import { FARM_ITEMS, FARM_CATEGORIES, getItemDefinition, ITEM_TYPES } from '../types/farm';
import { Sidebar } from '../components/layout/Sidebar';
import { ObjectInspector } from '../components/inspector/ObjectInspector';
import { EditorToolbar } from '../components/toolbar/EditorToolbar';
import { ScenarioComparisonModal } from '../components/simulation/ScenarioComparisonModal';
import { FarmBoundaryModal } from '../components/settings/FarmBoundaryModal';

describe('Farm Palette Editor & Categories', () => {
  it('groups items into Terrain, Crops, Trees, Structures, and Irrigation', () => {
    expect(FARM_CATEGORIES).toContain('Terrain');
    expect(FARM_CATEGORIES).toContain('Crops');
    expect(FARM_CATEGORIES).toContain('Trees');
    expect(FARM_CATEGORIES).toContain('Structures');
    expect(FARM_CATEGORIES).toContain('Irrigation');

    const tree = getItemDefinition(ITEM_TYPES.TREE);
    expect(tree.category).toBe('Trees');
    expect(tree.isPointIcon).toBe(true);
    expect(tree.defaultWidth).toBe(80); // 2m x 2m

    const neem = getItemDefinition(ITEM_TYPES.NEEM_TREE);
    expect(neem.category).toBe('Trees');
    expect(neem.isPointIcon).toBe(true);

    const wheat = getItemDefinition(ITEM_TYPES.WHEAT);
    expect(wheat.category).toBe('Crops');
    expect(wheat.isPointIcon).toBe(false);

    const grass = getItemDefinition(ITEM_TYPES.GRASS);
    expect(grass.category).toBe('Terrain');

    const fence = getItemDefinition(ITEM_TYPES.FENCE);
    expect(fence.category).toBe('Structures');

    const water = getItemDefinition(ITEM_TYPES.WATER);
    expect(water.category).toBe('Irrigation');
  });

  it('filters sidebar items via category pills and search input', () => {
    render(
      <FarmProvider>
        <Sidebar />
      </FarmProvider>
    );

    // Search bar exists
    const searchInput = screen.getByPlaceholderText(/Search elements/);
    expect(searchInput).toBeInTheDocument();

    // Type "neem"
    fireEvent.change(searchInput, { target: { value: 'neem' } });
    expect(screen.getByText('Neem Tree')).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Click Category pill "Trees"
    const treesPill = screen.getByRole('button', { name: 'Trees' });
    fireEvent.click(treesPill);
    expect(screen.getByText('Orchard Tree')).toBeInTheDocument();
  });
});

describe('Editor History: Undo, Redo, Duplicate & Delete in Reducer', () => {
  it('performs undo and redo transitions', () => {
    // 1. Add item 1
    const s1 = farmReducer(INITIAL_STATE, {
      type: ACTION_TYPES.ADD_ITEM,
      payload: { item: { id: 'plot-1', type: 'wheat', x: 0, y: 0, width: 80, height: 80 } },
    });
    expect(s1.items).toHaveLength(1);
    expect(s1.past).toHaveLength(1);

    // 2. Add item 2
    const s2 = farmReducer(s1, {
      type: ACTION_TYPES.ADD_ITEM,
      payload: { item: { id: 'plot-2', type: 'carrot', x: 80, y: 0, width: 80, height: 80 } },
    });
    expect(s2.items).toHaveLength(2);
    expect(s2.past).toHaveLength(2);

    // 3. Undo
    const s3 = farmReducer(s2, { type: ACTION_TYPES.UNDO });
    expect(s3.items).toHaveLength(1);
    expect(s3.items[0].id).toBe('plot-1');
    expect(s3.future).toHaveLength(1);

    // 4. Redo
    const s4 = farmReducer(s3, { type: ACTION_TYPES.REDO });
    expect(s4.items).toHaveLength(2);
    expect(s4.future).toHaveLength(0);
  });

  it('duplicates selected item with an offset and unique id', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'plot-1', type: 'wheat', x: 40, y: 40, width: 80, height: 80, zIndex: 100 }],
      selectedId: 'plot-1',
    };

    const s = farmReducer(initialState, {
      type: ACTION_TYPES.DUPLICATE_ITEM,
      payload: { id: 'plot-1' },
    });

    expect(s.items).toHaveLength(2);
    const duplicated = s.items.find((i) => i.id !== 'plot-1');
    expect(duplicated).toBeDefined();
    expect(duplicated.x).toBe(80);
    expect(duplicated.y).toBe(80);
    expect(s.selectedId).toBe(duplicated.id);
  });

  it('updates item properties in object inspector', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'plot-1', type: 'wheat', x: 0, y: 0, width: 80, height: 80 }],
      selectedId: 'plot-1',
    };

    const s = farmReducer(initialState, {
      type: ACTION_TYPES.UPDATE_ITEM_PROPERTIES,
      payload: {
        id: 'plot-1',
        properties: {
          variety: 'Durum Amber',
          plantingDay: 5,
          soilPh: 6.8,
          soilMoisture: 72,
        },
      },
    });

    expect(s.items[0].variety).toBe('Durum Amber');
    expect(s.items[0].plantingDay).toBe(5);
    expect(s.items[0].soilPh).toBe(6.8);
    expect(s.items[0].soilMoisture).toBe(72);
  });

  it('updates canvas zoom level', () => {
    const s = farmReducer(INITIAL_STATE, {
      type: ACTION_TYPES.SET_ZOOM,
      payload: { zoom: 0.75 },
    });
    expect(s.zoom).toBe(0.75);
  });
});

describe('Digital Twin Scenario Comparison Modal (The Killer Feature)', () => {
  it('renders baseline vs simulated scenario with affected crop plots and outcome delta', () => {
    render(
      <FarmProvider>
        <ScenarioComparisonModal
          isOpen={true}
          onClose={vi.fn()}
          scenarioData={{
            id: 'drought',
            title: 'Reduced rainfall for 14 days',
            type: 'Drought Stress',
            yieldDeltaPct: -18,
            waterDemandStr: 'Higher',
            predictSummary: 'High temperature causes moisture stress.',
          }}
        />
      </FarmProvider>
    );

    expect(screen.getByText('Digital Twin Scenario Comparison')).toBeInTheDocument();
    expect(screen.getByText(/Original Farm Plan/)).toBeInTheDocument();
    expect(screen.getByText(/Simulated Farm Twin/)).toBeInTheDocument();

    // Switch to Outcome Delta Report tab
    const deltaTabBtn = screen.getByText('Outcome Delta Report');
    fireEvent.click(deltaTabBtn);

    expect(screen.getByText('Agricultural Metric')).toBeInTheDocument();
    expect(screen.getByText('Total Crop Biomass Yield')).toBeInTheDocument();
    expect(screen.getByText('Irrigation Demand per Day')).toBeInTheDocument();
  });
});
