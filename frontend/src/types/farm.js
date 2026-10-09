/**
 * Farm Item Definitions, Realistic Dimensions, Layer Hierarchy & Scale Configuration
 * Scale: 40 pixels = 1.0 meter (20px grid snap = 0.5m step)
 */

export const PIXELS_PER_METER = 40;
export const GRID_SIZE = 20; // 0.5m grid snap

export const ITEM_TYPES = {
  GRASS: 'grass',
  TREE: 'tree',
  FENCE: 'fence',
  WATER: 'water',
  WHEAT: 'wheat',
  CARROT: 'carrot',
};

/**
 * Overlaying Layer Priority Logic:
 * Tier 1: Grass (Base terrain ground)
 * Tier 2: Water (Canals/ponds - sits on grass)
 * Tier 3: Wheat / Carrot (Crops - planted on land)
 * Tier 4: Tree (Flora - upright foliage)
 * Tier 5: Fence (Structures - crosses over water/land, water CANNOT cover fence)
 */
export const ITEM_LAYER_PRIORITY = {
  [ITEM_TYPES.GRASS]: 1,
  [ITEM_TYPES.WATER]: 2,
  [ITEM_TYPES.WHEAT]: 3,
  [ITEM_TYPES.CARROT]: 3,
  [ITEM_TYPES.TREE]: 4,
  [ITEM_TYPES.FENCE]: 5,
};

export const calculateZIndex = (type, subIndex = 0) => {
  const priority = ITEM_LAYER_PRIORITY[type] || 1;
  return priority * 1000 + (subIndex % 900);
};

export const pxToMeters = (px) => {
  const m = px / PIXELS_PER_METER;
  return Number.isInteger(m) ? `${m}m` : `${m.toFixed(1)}m`;
};

export const pxToMetersNum = (px) => {
  return Number((px / PIXELS_PER_METER).toFixed(1));
};

export const metersToPx = (m) => {
  return Math.round(Number(m) * PIXELS_PER_METER);
};

export const FARM_ITEMS = [
  {
    type: ITEM_TYPES.GRASS,
    label: 'Grass Plot',
    category: 'Terrain',
    description: 'Fertile turf foundation',
    iconName: 'Sprout',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.GRASS],
    // 2m x 2m default scale
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 20, // 0.5m
    minHeight: 20, // 0.5m
    color: {
      bg: '#064e3b',
      border: '#059669',
      accent: '#10b981',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
      gradient: 'from-emerald-900/60 to-emerald-950/90',
    },
  },
  {
    type: ITEM_TYPES.TREE,
    label: 'Orchard Tree',
    category: 'Flora',
    description: '1x1 mature fruit-bearing tree',
    iconName: 'Trees',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.TREE],
    // 1m x 1m square default
    defaultWidth: 40,
    defaultHeight: 40,
    minWidth: 20, // 0.5m
    minHeight: 20, // 0.5m
    color: {
      bg: '#14532d',
      border: '#15803d',
      accent: '#22c55e',
      badge: 'bg-green-950/80 text-green-300 border-green-700/60',
      gradient: 'from-green-900/60 to-emerald-950/90',
    },
  },
  {
    type: ITEM_TYPES.FENCE,
    label: 'Wood Fence',
    category: 'Structure',
    description: 'Thin and long boundary (crosses water & land)',
    iconName: 'Fence',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.FENCE],
    // Thin and long default (0.4m x 4.0m)
    defaultWidth: 160,
    defaultHeight: 16,
    minWidth: 12, // thin capability
    minHeight: 12,
    color: {
      bg: '#451a03',
      border: '#92400e',
      accent: '#d97706',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      gradient: 'from-amber-950/70 to-stone-900/90',
    },
  },
  {
    type: ITEM_TYPES.WATER,
    label: 'Water Canal',
    category: 'Irrigation',
    description: 'Fresh reservoir (stays below fences)',
    iconName: 'Waves',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WATER],
    // 3m x 2m default water body
    defaultWidth: 120,
    defaultHeight: 80,
    minWidth: 40, // 1m
    minHeight: 40, // 1m
    color: {
      bg: '#0c4a6e',
      border: '#0284c7',
      accent: '#38bdf8',
      badge: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
      gradient: 'from-sky-900/60 to-cyan-950/90',
    },
  },
  {
    type: ITEM_TYPES.WHEAT,
    label: 'Wheat Crop',
    category: 'Crops',
    description: '2mx2m golden harvest field',
    iconName: 'Wheat',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WHEAT],
    // 2m x 2m default scale
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 20, // 0.5m
    minHeight: 20, // 0.5m
    color: {
      bg: '#713f12',
      border: '#ca8a04',
      accent: '#eab308',
      badge: 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60',
      gradient: 'from-yellow-900/60 to-amber-950/90',
    },
  },
  {
    type: ITEM_TYPES.CARROT,
    label: 'Carrot Patch',
    category: 'Vegetables',
    description: '2mx2m root crop bed',
    iconName: 'Carrot',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.CARROT],
    // 2m x 2m default scale
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 20, // 0.5m
    minHeight: 20, // 0.5m
    color: {
      bg: '#7c2d12',
      border: '#ea580c',
      accent: '#f97316',
      badge: 'bg-orange-950/80 text-orange-300 border-orange-700/60',
      gradient: 'from-orange-950/70 to-amber-950/90',
    },
  },
];

export const getItemDefinition = (type) => {
  return FARM_ITEMS.find((item) => item.type === type) || FARM_ITEMS[0];
};
