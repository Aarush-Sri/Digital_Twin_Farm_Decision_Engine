/**
 * Farm Item Definitions and Configuration
 * Provides metadata, intuitive colors, default sizing, and iconography.
 */

export const ITEM_TYPES = {
  GRASS: 'grass',
  TREE: 'tree',
  FENCE: 'fence',
  WATER: 'water',
  WHEAT: 'wheat',
  CARROT: 'carrot',
};

export const FARM_ITEMS = [
  {
    type: ITEM_TYPES.GRASS,
    label: 'Grass Plot',
    category: 'Terrain',
    description: 'Fertile turf for grazing and foundation',
    iconName: 'Sprout',
    defaultWidth: 140,
    defaultHeight: 140,
    minWidth: 60,
    minHeight: 60,
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
    description: 'Mature fruit-bearing orchard timber',
    iconName: 'Trees',
    defaultWidth: 120,
    defaultHeight: 160,
    minWidth: 60,
    minHeight: 80,
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
    description: 'Protective perimeter boundary',
    iconName: 'Fence',
    defaultWidth: 160,
    defaultHeight: 48,
    minWidth: 80,
    minHeight: 32,
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
    description: 'Fresh reservoir supply for crops',
    iconName: 'Waves',
    defaultWidth: 180,
    defaultHeight: 120,
    minWidth: 70,
    minHeight: 60,
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
    description: 'Golden staple harvest field',
    iconName: 'Wheat',
    defaultWidth: 130,
    defaultHeight: 130,
    minWidth: 60,
    minHeight: 60,
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
    description: 'High-yield root crop bed',
    iconName: 'Carrot',
    defaultWidth: 120,
    defaultHeight: 120,
    minWidth: 60,
    minHeight: 60,
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

export const GRID_SIZE = 20; // 20px grid snap step
