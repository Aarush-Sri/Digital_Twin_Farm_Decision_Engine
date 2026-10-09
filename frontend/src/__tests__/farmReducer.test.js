import { describe, it, expect } from 'vitest';
import { farmReducer, INITIAL_STATE, ACTION_TYPES } from '../context/farmReducer';

describe('Farm Reducer State Transitions', () => {
  it('adds a new item and marks it selected with incremented zIndex', () => {
    const action = {
      type: ACTION_TYPES.ADD_ITEM,
      payload: {
        item: { id: 'item-1', type: 'grass', x: 100, y: 100, width: 140, height: 140 },
      },
    };

    const state = farmReducer(INITIAL_STATE, action);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('item-1');
    expect(state.items[0].zIndex).toBe(1);
    expect(state.selectedId).toBe('item-1');
    expect(state.nextZIndex).toBe(2);
  });

  it('updates item position', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'item-1', type: 'tree', x: 20, y: 20, width: 100, height: 100 }],
    };

    const state = farmReducer(initialState, {
      type: ACTION_TYPES.UPDATE_POSITION,
      payload: { id: 'item-1', x: 140, y: 160 },
    });

    expect(state.items[0].x).toBe(140);
    expect(state.items[0].y).toBe(160);
  });

  it('updates item dimensions and enforces minimums', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'item-1', type: 'fence', x: 20, y: 20, width: 100, height: 50 }],
    };

    const state = farmReducer(initialState, {
      type: ACTION_TYPES.UPDATE_DIMENSIONS,
      payload: { id: 'item-1', width: 250, height: 80, x: 30, y: 40 },
    });

    expect(state.items[0].width).toBe(250);
    expect(state.items[0].height).toBe(80);
    expect(state.items[0].x).toBe(30);
    expect(state.items[0].y).toBe(40);

    // Enforce minimum dimension boundary
    const smallState = farmReducer(initialState, {
      type: ACTION_TYPES.UPDATE_DIMENSIONS,
      payload: { id: 'item-1', width: 10, height: 5 },
    });
    expect(smallState.items[0].width).toBe(40);
    expect(smallState.items[0].height).toBe(30);
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

  it('brings item to front by raising its zIndex', () => {
    const initialState = {
      ...INITIAL_STATE,
      items: [{ id: 'item-1', zIndex: 1 }, { id: 'item-2', zIndex: 2 }],
      nextZIndex: 3,
    };

    const state = farmReducer(initialState, {
      type: ACTION_TYPES.BRING_TO_FRONT,
      payload: { id: 'item-1' },
    });

    expect(state.items.find((i) => i.id === 'item-1').zIndex).toBe(4);
    expect(state.nextZIndex).toBe(4);
  });
});
