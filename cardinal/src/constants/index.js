// UI Constants
export const DEFAULT_COL_WIDTHS = { 
  filename: 240, 
  path: 600, 
  modified: 180, 
  created: 180, 
  size: 120 
};

export const COL_GAP = 12;
export const COLUMNS_EXTRA = 20;
export const ROW_HEIGHT = 24;

// Cache and Performance
export const CACHE_SIZE = 1000;
export const SEARCH_DEBOUNCE_MS = 300;
export const STATUS_FADE_DELAY_MS = 2000;
export const OVERSCAN_ROW_COUNT = 5;

// Grid calculations
export const calculateColumnsTotal = (colWidths) => 
  Object.values(colWidths).reduce((sum, width) => sum + width, 0) + 
  (Object.keys(colWidths).length - 1) * COL_GAP + 
  COLUMNS_EXTRA;
