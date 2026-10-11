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
  TOMATO: 'tomato',
  CORN: 'corn',
  PUMPKIN: 'pumpkin',
  STRAWBERRY: 'strawberry',
  STONE_PATH: 'stone_path',
  BARN: 'barn',
  WELL: 'well',
};

/**
 * Overlaying Layer Priority Logic:
 * Tier 1: Grass, Stone Paths (Base terrain ground)
 * Tier 2: Water (Canals/ponds - sits on grass)
 * Tier 3: Crops & Vegetables (Wheat, Carrot, Tomato, Corn, Pumpkin, Strawberry)
 * Tier 4: Tree (Flora - upright foliage)
 * Tier 5: Fence, Barn, Well (Structures - stand upright above water & land)
 */
export const ITEM_LAYER_PRIORITY = {
  [ITEM_TYPES.GRASS]: 1,
  [ITEM_TYPES.STONE_PATH]: 1,
  [ITEM_TYPES.WATER]: 2,
  [ITEM_TYPES.WHEAT]: 3,
  [ITEM_TYPES.CARROT]: 3,
  [ITEM_TYPES.TOMATO]: 3,
  [ITEM_TYPES.CORN]: 3,
  [ITEM_TYPES.PUMPKIN]: 3,
  [ITEM_TYPES.STRAWBERRY]: 3,
  [ITEM_TYPES.TREE]: 4,
  [ITEM_TYPES.FENCE]: 5,
  [ITEM_TYPES.BARN]: 5,
  [ITEM_TYPES.WELL]: 5,
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
    description: 'Lush fertile turf pasture',
    iconName: 'Sprout',
    image: '/assets/grass_tile.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.GRASS],
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#14532d',
      border: '#22c55e',
      accent: '#4ade80',
      badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70',
      gradient: 'from-emerald-900/60 to-emerald-950/90',
    },
  },
  {
    type: ITEM_TYPES.TREE,
    label: 'Orchard Tree',
    category: 'Flora',
    description: 'Shaded fruit tree & windbreak',
    iconName: 'Trees',
    image: '/assets/tree_transparent.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.TREE],
    defaultWidth: 40,
    defaultHeight: 40,
    minWidth: 20,
    minHeight: 20,
    color: {
      bg: '#064e3b',
      border: '#10b981',
      accent: '#34d399',
      badge: 'bg-green-950/90 text-green-300 border-green-600/70',
      gradient: 'from-green-900/60 to-emerald-950/90',
    },
  },
  {
    type: ITEM_TYPES.FENCE,
    label: 'Wood Fence',
    category: 'Structure',
    description: 'Rustic wooden paddock border (longer & thicker)',
    iconName: 'Fence',
    image: '/assets/fence_transparent.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.FENCE],
    defaultWidth: 160,
    defaultHeight: 16,
    minWidth: 12,
    minHeight: 12,
    color: {
      bg: 'transparent',
      border: '#b45309',
      accent: '#f59e0b',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-600/70',
      gradient: 'from-amber-950/70 to-stone-900/90',
    },
  },
  {
    type: ITEM_TYPES.WATER,
    label: 'Water Canal',
    category: 'Irrigation',
    description: 'Sparkling freshwater reservoir',
    iconName: 'Waves',
    image: '/assets/water_canal.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WATER],
    defaultWidth: 120,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#0c4a6e',
      border: '#0284c7',
      accent: '#38bdf8',
      badge: 'bg-sky-950/90 text-sky-300 border-sky-600/70',
      gradient: 'from-sky-900/60 to-cyan-950/90',
    },
  },
  {
    type: ITEM_TYPES.WHEAT,
    label: 'Wheat Crop',
    category: 'Crops',
    description: 'Golden tilled grain beds',
    iconName: 'Wheat',
    image: '/assets/crop_wheat.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WHEAT],
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#713f12',
      border: '#ca8a04',
      accent: '#eab308',
      badge: 'bg-yellow-950/90 text-yellow-300 border-yellow-600/70',
      gradient: 'from-yellow-900/60 to-amber-950/90',
    },
  },
  {
    type: ITEM_TYPES.CARROT,
    label: 'Carrot Patch',
    category: 'Vegetables',
    description: 'Loamy bed with leafy orange carrots',
    iconName: 'Carrot',
    image: '/assets/crop_carrot.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.CARROT],
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#7c2d12',
      border: '#ea580c',
      accent: '#f97316',
      badge: 'bg-orange-950/90 text-orange-300 border-orange-600/70',
      gradient: 'from-orange-950/70 to-amber-950/90',
    },
  },
  {
    type: ITEM_TYPES.TOMATO,
    label: 'Tomato Vine',
    category: 'Vegetables',
    description: 'Plump red tomatoes on trellised vines',
    iconName: 'Cherry',
    image: '/assets/crop_tomato.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.TOMATO],
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#450a0a',
      border: '#dc2626',
      accent: '#ef4444',
      badge: 'bg-red-950/90 text-red-300 border-red-600/70',
      gradient: 'from-red-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.CORN,
    label: 'Sweet Corn',
    category: 'Crops',
    description: 'Tall golden stalks with sweet ears of maize',
    iconName: 'Wheat',
    image: '/assets/crop_corn.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.CORN],
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#365314',
      border: '#84cc16',
      accent: '#eab308',
      badge: 'bg-lime-950/90 text-lime-300 border-lime-600/70',
      gradient: 'from-lime-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.PUMPKIN,
    label: 'Pumpkin Patch',
    category: 'Vegetables',
    description: 'Giant round autumn pumpkins in soil',
    iconName: 'CircleDot',
    image: '/assets/crop_pumpkin.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.PUMPKIN],
    defaultWidth: 100,
    defaultHeight: 100,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#431407',
      border: '#ea580c',
      accent: '#fb923c',
      badge: 'bg-orange-950/90 text-orange-300 border-orange-600/70',
      gradient: 'from-orange-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.STRAWBERRY,
    label: 'Strawberry Bed',
    category: 'Fruits',
    description: 'Sweet ruby red strawberries in berry shrubs',
    iconName: 'Cherry',
    image: '/assets/crop_strawberry.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.STRAWBERRY],
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#500724',
      border: '#f43f5e',
      accent: '#fb7185',
      badge: 'bg-rose-950/90 text-rose-300 border-rose-600/70',
      gradient: 'from-rose-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.STONE_PATH,
    label: 'Stone Path',
    category: 'Terrain',
    description: 'Rustic cobblestone road between plots',
    iconName: 'Footprints',
    image: '/assets/path_stone.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.STONE_PATH],
    defaultWidth: 120,
    defaultHeight: 40,
    minWidth: 40,
    minHeight: 20,
    color: {
      bg: '#292524',
      border: '#78716c',
      accent: '#a8a29e',
      badge: 'bg-stone-900/90 text-stone-300 border-stone-600/70',
      gradient: 'from-stone-800/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.BARN,
    label: 'Timber Barn',
    category: 'Structure',
    description: 'Classic red timber barn & grain storage silo',
    iconName: 'Warehouse',
    image: '/assets/building_barn.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.BARN],
    defaultWidth: 120,
    defaultHeight: 120,
    minWidth: 60,
    minHeight: 60,
    color: {
      bg: 'transparent',
      border: '#dc2626',
      accent: '#fca5a5',
      badge: 'bg-red-950/90 text-red-300 border-red-600/70',
      gradient: 'from-red-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.WELL,
    label: 'Stone Well',
    category: 'Irrigation',
    description: 'Cobblestone water well with bucket & roof',
    iconName: 'Waves',
    image: '/assets/decor_well.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WELL],
    defaultWidth: 60,
    defaultHeight: 60,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: 'transparent',
      border: '#0284c7',
      accent: '#38bdf8',
      badge: 'bg-sky-950/90 text-sky-300 border-sky-600/70',
      gradient: 'from-sky-900/60 to-stone-950/90',
    },
  },
];

export const getItemDefinition = (type) => {
  return FARM_ITEMS.find((item) => item.type === type) || FARM_ITEMS[0];
};
