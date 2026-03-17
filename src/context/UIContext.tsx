"use client";

import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Hotspot } from '@/types/hotspot';

interface UIState {
  selectedHotspot: Hotspot | null;
  activeOverlay: 'panel' | 'sheet' | 'none' | 'modal';
  isSidePanelOpen: boolean;  // Desktop
  isBottomSheetOpen: boolean; // Mobile  
  searchFilters: {
    query: string;
    category: string;
    province: string;
  };
  mapView: {
    viewMode: 'markers' | 'heatmap';
    mapStyle: 'default' | 'satellite' | 'retro' | 'terrain';
  };
}

type UIActions = 
  | { type: 'SET_SELECTED_HOTSPOT'; payload: Hotspot | null }
  | { type: 'TOGGLE_OVERLAY'; payload: UIState['activeOverlay'] }
  | { type: 'TOGGLE_SIDE_PANEL' }
  | { type: 'TOGGLE_BOTTOM_SHEET' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_FILTERS'; payload: Partial<UIState['searchFilters']> }
  | { type: 'SET_MAP_VIEW'; payload: Partial<UIState['mapView']> };

const initialState: UIState = {
  selectedHotspot: null,
  activeOverlay: 'none',
  isSidePanelOpen: false,
  isBottomSheetOpen: false,
  searchFilters: { query: '', category: '', province: '' },
  mapView: { viewMode: 'markers', mapStyle: 'default' }
};

function uiReducer(state: UIState, action: UIActions): UIState {
  switch (action.type) {
    case 'SET_SELECTED_HOTSPOT':
      return { ...state, selectedHotspot: action.payload };
    case 'TOGGLE_OVERLAY':
      return { 
        ...state, 
        activeOverlay: state.activeOverlay === action.payload ? 'none' : action.payload,
        isSidePanelOpen: action.payload === 'panel',
        isBottomSheetOpen: action.payload === 'sheet'
      };
    case 'TOGGLE_SIDE_PANEL':
      return { ...state, isSidePanelOpen: !state.isSidePanelOpen };
    case 'TOGGLE_BOTTOM_SHEET':
      return { ...state, isBottomSheetOpen: !state.isBottomSheetOpen };
    case 'SET_SEARCH_QUERY':
      return { 
        ...state, 
        searchFilters: { ...state.searchFilters, query: action.payload }
      };
    case 'SET_SEARCH_FILTERS':
      return { 
        ...state, 
        searchFilters: { ...state.searchFilters, ...action.payload }
      };
    case 'SET_MAP_VIEW':
      return { 
        ...state, 
        mapView: { ...state.mapView, ...action.payload }
      };
    default:
      return state;
  }
}

interface UIContextType {
  state: UIState;
  dispatch: React.Dispatch<UIActions>;
  actions: {
    openHotspot: (hotspot: Hotspot) => void;
    closeOverlay: () => void;
    togglePanel: () => void;
    toggleSheet: () => void;
    updateSearch: (query: string) => void;
    setFilters: (filters: Partial<UIState['searchFilters']>) => void;
    setMapView: (view: Partial<UIState['mapView']>) => void;
  };
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const actions = {
    openHotspot: useCallback((hotspot: Hotspot) => {
      dispatch({ type: 'SET_SELECTED_HOTSPOT', payload: hotspot });
      dispatch({ type: 'TOGGLE_OVERLAY', payload: 'panel' });
    }, []),
    closeOverlay: useCallback(() => {
      dispatch({ type: 'SET_SELECTED_HOTSPOT', payload: null });
      dispatch({ type: 'TOGGLE_OVERLAY', payload: 'none' });
    }, []),
    togglePanel: useCallback(() => dispatch({ type: 'TOGGLE_SIDE_PANEL' }), []),
    toggleSheet: useCallback(() => dispatch({ type: 'TOGGLE_BOTTOM_SHEET' }), []),
    updateSearch: useCallback((query: string) => 
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query }), []),
    setFilters: useCallback((filters: Partial<UIState['searchFilters']>) => 
      dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters }), []),
    setMapView: useCallback((view: Partial<UIState['mapView']>) => 
      dispatch({ type: 'SET_MAP_VIEW', payload: view }), []),
  };

  return (
    <UIContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}

