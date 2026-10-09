import React, { createContext, useReducer, useMemo, useCallback } from 'react';
import { farmReducer, INITIAL_STATE, ACTION_TYPES } from './farmReducer';
import { GRID_SIZE } from '../types/farm';

export const FarmContext = createContext(null);

export const FarmProvider = ({ children }) => {
  const [state, dispatch] = useReducer(farmReducer, INITIAL_STATE);

  const addItem = useCallback((item) => {
    dispatch({ type: ACTION_TYPES.ADD_ITEM, payload: { item } });
  }, []);

  const updatePosition = useCallback((id, x, y) => {
    dispatch({ type: ACTION_TYPES.UPDATE_POSITION, payload: { id, x, y } });
  }, []);

  const updateDimensions = useCallback((id, width, height, x, y) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_DIMENSIONS,
      payload: { id, width, height, x, y },
    });
  }, []);

  const selectItem = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.SELECT_ITEM, payload: { id } });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: ACTION_TYPES.DESELECT_ALL });
  }, []);

  const deleteItem = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.DELETE_ITEM, payload: { id } });
  }, []);

  const clearCanvas = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_CANVAS });
  }, []);

  const toggleSnap = useCallback(() => {
    dispatch({ type: ACTION_TYPES.TOGGLE_SNAP });
  }, []);

  const bringToFront = useCallback((id) => {
    dispatch({ type: ACTION_TYPES.BRING_TO_FRONT, payload: { id } });
  }, []);

  const selectedItem = useMemo(() => {
    return state.items.find((item) => item.id === state.selectedId) || null;
  }, [state.items, state.selectedId]);

  const snapCoordinate = useCallback((val) => {
    if (!state.snapToGrid) return Math.round(val);
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }, [state.snapToGrid]);

  const value = useMemo(() => ({
    ...state,
    selectedItem,
    addItem,
    updatePosition,
    updateDimensions,
    selectItem,
    deselectAll,
    deleteItem,
    clearCanvas,
    toggleSnap,
    bringToFront,
    snapCoordinate,
  }), [
    state,
    selectedItem,
    addItem,
    updatePosition,
    updateDimensions,
    selectItem,
    deselectAll,
    deleteItem,
    clearCanvas,
    toggleSnap,
    bringToFront,
    snapCoordinate,
  ]);

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};
