import { calculateZIndex, getItemDefinition } from '../types/farm';

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
      const subIndex = state.nextZIndex;
      const zIndex = item.zIndex || calculateZIndex(item.type, subIndex);

      const newItem = {
        ...item,
        zIndex,
        subIndex,
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
      // Support both { id, width, height, x, y } and { payload: { id, ... } }
      const p = action.payload || {};
      const id = typeof p.id === 'object' && p.id !== null ? p.id.id : p.id;
      const rawW = p.width ?? (typeof p.id === 'object' ? p.id.width : undefined);
      const rawH = p.height ?? (typeof p.id === 'object' ? p.id.height : undefined);
      const rawX = p.x ?? (typeof p.id === 'object' ? p.id.x : undefined);
      const rawY = p.y ?? (typeof p.id === 'object' ? p.id.y : undefined);

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          const itemDef = getItemDefinition(item.type);
          const minW = item.minWidth || itemDef.minWidth || 12;
          const minH = item.minHeight || itemDef.minHeight || 12;

          const updated = {
            ...item,
            width: rawW !== undefined ? Math.max(minW, Math.round(rawW)) : item.width,
            height: rawH !== undefined ? Math.max(minH, Math.round(rawH)) : item.height,
          };

          if (rawX !== undefined) updated.x = Math.max(0, Math.round(rawX));
          if (rawY !== undefined) updated.y = Math.max(0, Math.round(rawY));
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
      const nextSubIndex = state.nextZIndex + 1;

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          // Calculate new zIndex respecting item type priority tier!
          const newZIndex = calculateZIndex(item.type, nextSubIndex);
          return { ...item, zIndex: newZIndex, subIndex: nextSubIndex };
        }),
        nextZIndex: nextSubIndex,
      };
    }

    default:
      return state;
  }
};
