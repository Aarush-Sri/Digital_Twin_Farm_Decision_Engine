/**
 * Deterministic Farm Reducer
 * Handles state transitions for canvas items, selection, dimensions, and grid snap.
 */

export const INITIAL_STATE = {
  items: [],
  selectedId: null,
  snapToGrid: true,
  nextZIndex: 1,
};

export const ACTION_TYPES = {
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_POSITION: 'UPDATE_POSITION',
  UPDATE_DIMENSIONS: 'UPDATE_DIMENSIONS',
  SELECT_ITEM: 'SELECT_ITEM',
  DESELECT_ALL: 'DESELECT_ALL',
  DELETE_ITEM: 'DELETE_ITEM',
  CLEAR_CANVAS: 'CLEAR_CANVAS',
  TOGGLE_SNAP: 'TOGGLE_SNAP',
  BRING_TO_FRONT: 'BRING_TO_FRONT',
};

export const farmReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_ITEM: {
      const { item } = action.payload;
      const newItem = {
        ...item,
        zIndex: state.nextZIndex,
      };
      return {
        ...state,
        items: [...state.items, newItem],
        selectedId: newItem.id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case ACTION_TYPES.UPDATE_POSITION: {
      const { id, x, y } = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, x: Math.max(0, x), y: Math.max(0, y) } : item
        ),
      };
    }

    case ACTION_TYPES.UPDATE_DIMENSIONS: {
      const { id, width, height, x, y } = action.payload;
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          const updated = {
            ...item,
            width: Math.max(40, Math.round(width)),
            height: Math.max(30, Math.round(height)),
          };
          if (x !== undefined) updated.x = Math.max(0, Math.round(x));
          if (y !== undefined) updated.y = Math.max(0, Math.round(y));
          return updated;
        }),
      };
    }

    case ACTION_TYPES.SELECT_ITEM: {
      const { id } = action.payload;
      return {
        ...state,
        selectedId: id,
      };
    }

    case ACTION_TYPES.DESELECT_ALL: {
      return {
        ...state,
        selectedId: null,
      };
    }

    case ACTION_TYPES.DELETE_ITEM: {
      const { id } = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => item.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }

    case ACTION_TYPES.CLEAR_CANVAS: {
      return {
        ...state,
        items: [],
        selectedId: null,
      };
    }

    case ACTION_TYPES.TOGGLE_SNAP: {
      return {
        ...state,
        snapToGrid: !state.snapToGrid,
      };
    }

    case ACTION_TYPES.BRING_TO_FRONT: {
      const { id } = action.payload;
      const nextZ = state.nextZIndex + 1;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, zIndex: nextZ } : item
        ),
        nextZIndex: nextZ,
      };
    }

    default:
      return state;
  }
};
