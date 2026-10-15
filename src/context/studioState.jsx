import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import {
  STAGE_ORDER,
  STAGE_NUMBER_MAP,
  StudioActionTypes,
  createInitialStudioState,
  initialStudioState,
  isStaleResponse,
  studioReducer,
} from './studioReducer.js';

const StudioStateContext = createContext(null);
const StudioDispatchContext = createContext(null);

export function StudioProvider({ children, initialOverrides = {} }) {
  const [state, dispatch] = useReducer(
    studioReducer,
    initialStudioState,
    () => createInitialStudioState(initialOverrides)
  );

  return (
    <StudioStateContext.Provider value={state}>
      <StudioDispatchContext.Provider value={dispatch}>
        {children}
      </StudioDispatchContext.Provider>
    </StudioStateContext.Provider>
  );
}

export function useStudioState() {
  const context = useContext(StudioStateContext);
  if (!context) {
    throw new Error('useStudioState must be used within a StudioProvider');
  }
  return context;
}

export function useStudioDispatch() {
  const context = useContext(StudioDispatchContext);
  if (!context) {
    throw new Error('useStudioDispatch must be used within a StudioProvider');
  }
  return context;
}

export function useStudio() {
  return [useStudioState(), useStudioDispatch()];
}

export {
  STAGE_ORDER,
  STAGE_NUMBER_MAP,
  StudioActionTypes,
  createInitialStudioState,
  initialStudioState,
  isStaleResponse,
  studioReducer,
  StudioStateContext,
  StudioDispatchContext,
};
