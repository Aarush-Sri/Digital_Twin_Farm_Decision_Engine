import { describe, it, expect } from 'vitest';
import { farmReducer, INITIAL_STATE, ACTION_TYPES } from '../context/farmReducer';
import { calculateZIndex } from '../types/farm';

describe('Farm Reducer State Transitions', () => {
  it('adds a new item and calculates tier-based zIndex', () => {
    const actionGrass = {
      type: ACTION_TYPES.ADD_ITEM,
      payload: {
        item: { id: 'grass-1', type: 'grass', x: 0, y: 0, width: 80, height: 80 },
      },
    };
    const actionFence = {
      type: ACTION_TYPES.ADD_ITEM,
      payload: {
        item: { id: 'fence-1', type: 'fence', x: 0, y: 0, width: 160, height: 16 },
      },
    };

    let state = farmReducer(INITIAL_STATE, actionGrass);
    state = farmReducer(state, actionFence);

    const grass = state.items.find((i) => i.id === 'grass-1');
    const fence = state.items.find((i) => i.id === 'fence-1');

    // Fence must have higher zIndex than grass
    expect(fence.zIndex).toBeGreaterThan(grass.zIndex);
    expect(state.selectedId).toBe('fence-1');
  });

  it('updates item position', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'item-1', type: 'tree', x: 20, y: 20, width: 40, height: 40 }],
    };

    const state = farmReducer(initialState, {
      type: ACTION_TYPES.UPDATE_POSITION,
      payload: { id: 'item-1', x: 140, y: 160 },
    });

    expect(state.items[0].x).toBe(140);
    expect(state.items[0].y).toBe(160);
  });

  it('updates item dimensions cleanly with object payload', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'item-1', type: 'fence', x: 20, y: 20, width: 160, height: 16, minWidth: 12, minHeight: 12 }],
    };

    const state = farmReducer(initialState, {
      type: ACTION_TYPES.UPDATE_DIMENSIONS,
      payload: { id: 'item-1', width: 240, height: 16, x: 30, y: 40 },
    });

    expect(state.items[0].width).toBe(240);
    expect(state.items[0].height).toBe(16);
    expect(state.items[0].x).toBe(30);
    expect(state.items[0].y).toBe(40);
  });

  it('selects and deselects items', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'item-1', type: 'water' }, { id: 'item-2', type: 'wheat' }],
      selectedId: null,
    };

    const selectedState = farmReducer(initialState, {
      type: ACTION_TYPES.SELECT_ITEM,
      payload: { id: 'item-2' },
    });
    expect(selectedState.selectedId).toBe('item-2');

    const deselectedState = farmReducer(selectedState, {
      type: ACTION_TYPES.DESELECT_ALL,
    });
    expect(deselectedState.selectedId).toBeNull();
  });

  it('deletes an item and clears selectedId if deleted item was selected', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'item-1', type: 'carrot' }],
      selectedId: 'item-1',
    };

    const state = farmReducer(initialState, {
      type: ACTION_TYPES.DELETE_ITEM,
      payload: { id: 'item-1' },
    });

    expect(state.items).toHaveLength(0);
    expect(state.selectedId).toBeNull();
  });

  it('clears all canvas items', () => {
    const populatedState = {
      ...INITIAL_STATE,
      items: [
        { id: '1', type: 'grass' },
        { id: '2', type: 'tree' },
      ],
      selectedId: '1',
    };

    const state = farmReducer(populatedState, {
      type: ACTION_TYPES.CLEAR_CANVAS,
    });

    expect(state.items).toHaveLength(0);
    expect(state.selectedId).toBeNull();
  });

  it('toggles snap to grid', () => {
    expect(INITIAL_STATE.snapToGrid).toBe(true);

    const toggledOff = farmReducer(INITIAL_STATE, {
      type: ACTION_TYPES.TOGGLE_SNAP,
    });
    expect(toggledOff.snapToGrid).toBe(false);

    const toggledOn = farmReducer(toggledOff, {
      type: ACTION_TYPES.TOGGLE_SNAP,
    });
    expect(toggledOn.snapToGrid).toBe(true);
  });

  it('brings item to front within its priority tier (fence stays above water)', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [
        { id: 'water-1', type: 'water', zIndex: calculateZIndex('water', 1) },
        { id: 'fence-1', type: 'fence', zIndex: calculateZIndex('fence', 1) },
      ],
      nextZIndex: 3,
    };

    // Bringing water to front should NEVER bring it above fence
    const state = farmReducer(initialState, {
      type: ACTION_TYPES.BRING_TO_FRONT,
      payload: { id: 'water-1' },
    });

    const water = state.items.find((i) => i.id === 'water-1');
    const fence = state.items.find((i) => i.id === 'fence-1');

    expect(fence.zIndex).toBeGreaterThan(water.zIndex);
  });
});
