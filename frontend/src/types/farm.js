/**
 * Farm Item Definitions, Realistic Dimensions, Layer Hierarchy & Scale Configuration
 * Scale: 40 pixels = 1.0 meter (20px grid snap = 0.5m step)
 */

export const PIXELS_PER_METER = 40;
export const GRID_SIZE = 20; // 0.5m grid snap

// 1 Acre = 4046.86 m^2, 1 Hectare = 10,000 m^2
export const SQ_METERS_PER_ACRE = 4046.86;
export const SQ_METERS_PER_HECTARE = 10000.0;

export const ITEM_TYPES = {
  // Terrain
  GRASS: 'grass',
  SOIL: 'soil',
  STONE_PATH: 'stone_path',

  // Crops
  WHEAT: 'wheat',
  CARROT: 'carrot',
  TOMATO: 'tomato',
  CORN: 'corn',
  PADDY: 'paddy',
  SUGARCANE: 'sugarcane',
  BANANA: 'banana',
  PUMPKIN: 'pumpkin',
  STRAWBERRY: 'strawberry',

  // Trees (Point Icons: fixed 2m x 2m = 80x80px)
  TREE: 'tree',
  NEEM_TREE: 'neem_tree',
  MANGO_TREE: 'mango_tree',
  COCONUT_TREE: 'coconut_tree',

  // Structures
  FENCE: 'fence',
  GATE: 'gate',
  BARN: 'barn',
  SHED: 'shed',

  // Irrigation
  WATER: 'water',
  POND: 'pond',
  WELL: 'well',
  SPRINKLER: 'sprinkler',
  PIPE: 'pipe',
};

export const FARM_CATEGORIES = [
  'All',
  'Terrain',
  'Crops',
  'Trees',
  'Structures',
  'Irrigation',
];

/**
 * Overlaying Layer Priority Logic:
 * Tier 1: Grass, Soil, Stone Paths (Base terrain ground)
 * Tier 2: Water, Pond, Pipe (Canals/ponds - sits on grass)
 * Tier 3: Crops & Vegetables (Wheat, Carrot, Tomato, Corn, etc.)
 * Tier 4: Trees (Flora - upright foliage)
 * Tier 5: Fence, Gate, Barn, Shed, Well, Sprinkler (Structures - stand upright)
 */
export const ITEM_LAYER_PRIORITY = {
  [ITEM_TYPES.GRASS]: 1,
  [ITEM_TYPES.SOIL]: 1,
  [ITEM_TYPES.STONE_PATH]: 1,
  [ITEM_TYPES.WATER]: 2,
  [ITEM_TYPES.POND]: 2,
  [ITEM_TYPES.PIPE]: 2,
  [ITEM_TYPES.WHEAT]: 3,
  [ITEM_TYPES.CARROT]: 3,
  [ITEM_TYPES.TOMATO]: 3,
  [ITEM_TYPES.CORN]: 3,
  [ITEM_TYPES.PADDY]: 3,
  [ITEM_TYPES.SUGARCANE]: 3,
  [ITEM_TYPES.BANANA]: 3,
  [ITEM_TYPES.PUMPKIN]: 3,
  [ITEM_TYPES.STRAWBERRY]: 3,
  [ITEM_TYPES.TREE]: 4,
  [ITEM_TYPES.NEEM_TREE]: 4,
  [ITEM_TYPES.MANGO_TREE]: 4,
  [ITEM_TYPES.COCONUT_TREE]: 4,
  [ITEM_TYPES.FENCE]: 5,
  [ITEM_TYPES.GATE]: 5,
  [ITEM_TYPES.BARN]: 5,
  [ITEM_TYPES.SHED]: 5,
  [ITEM_TYPES.WELL]: 5,
  [ITEM_TYPES.SPRINKLER]: 5,
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

export const calcAreaSqMeters = (widthPx, heightPx) => {
  const w = widthPx / PIXELS_PER_METER;
  const h = heightPx / PIXELS_PER_METER;
  return Number((w * h).toFixed(1));
};

export const calcAreaAcres = (widthPx, heightPx) => {
  const sqM = calcAreaSqMeters(widthPx, heightPx);
  return Number((sqM / SQ_METERS_PER_ACRE).toFixed(3));
};

export const calcAreaHectares = (widthPx, heightPx) => {
  const sqM = calcAreaSqMeters(widthPx, heightPx);
  return Number((sqM / SQ_METERS_PER_HECTARE).toFixed(3));
};

// Variety and inspector presets
export const CROP_VARIETIES = {
  [ITEM_TYPES.WHEAT]: ['Hard Red Winter', 'Durum Amber', 'Soft White', 'Emmer Ancient'],
  [ITEM_TYPES.CARROT]: ['Nantes Half-Long', 'Danvers 126', 'Chantenay Red', 'Imperator 58'],
  [ITEM_TYPES.TOMATO]: ['Roma Plum', 'San Marzano', 'Cherry Sweet 100', 'Beefsteak Heirloom'],
  [ITEM_TYPES.CORN]: ['Golden Bantam', 'Jubilee Sweet', 'Silver Queen', 'Flint Maize'],
  [ITEM_TYPES.PADDY]: ['Basmati Super', 'Jasmine Fragrant', 'Sona Masoori', 'IR-64 High Yield'],
  [ITEM_TYPES.SUGARCANE]: ['Co 0238 Champion', 'Co 86032 Sweet', 'Early Ripening Cane'],
  [ITEM_TYPES.BANANA]: ['Grand Naine (Cavendish)', 'Robusta', 'Nendran Plantain', 'Red Dacca'],
  [ITEM_TYPES.PUMPKIN]: ['Sugar Pie', 'Atlantic Giant', 'Musquee de Provence', 'Jack O Lantern'],
  [ITEM_TYPES.STRAWBERRY]: ['Albion Everbearing', 'Camarosa Day-Neutral', 'Chandler Sweet', 'Seascape'],
};

export const TREE_VARIETIES = {
  [ITEM_TYPES.TREE]: ['Honeycrisp Orchard', 'Valencia Citrus', 'Golden Russet', 'Montmorency Cherry'],
  [ITEM_TYPES.NEEM_TREE]: ['Indian Neem (Azadirachta indica)', 'Hardy Windbreak Neem', 'Bio-Shield Neem'],
  [ITEM_TYPES.MANGO_TREE]: ['Alphonso King', 'Kesar Sweet', 'Dasheri Fragrant', 'Banganapalli'],
  [ITEM_TYPES.COCONUT_TREE]: ['Tall Malayan Green', 'Dwarf Orange Chowghat', 'West Coast Tall'],
};

export const SOIL_TYPES = [
  'Fertile Loam',
  'Sandy Loam',
  'Clay Loam',
  'Silty Alluvial',
  'Black Cotton Soil',
];

export const IRRIGATION_METHODS = [
  'Drip Irrigation',
  'Overhead Sprinkler',
  'Furrow Irrigation',
  'Flood / Basin',
  'Rainfed Natural',
];

export const FARM_ITEMS = [
  // ----------------------------------------------------
  // TERRAIN
  // ----------------------------------------------------
  {
    type: ITEM_TYPES.GRASS,
    label: 'Grass Plot',
    category: 'Terrain',
    description: 'Lush fertile turf pasture',
    iconName: 'Sprout',
    image: '/assets/grass_tile.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.GRASS],
    isPointIcon: false,
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
    type: ITEM_TYPES.SOIL,
    label: 'Tilled Soil',
    category: 'Terrain',
    description: 'Rich dark loamy seedbed patch',
    iconName: 'Footprints',
    image: '/assets/soil_tile.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.SOIL],
    isPointIcon: false,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#3b2314',
      border: '#a16207',
      accent: '#d97706',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-700/70',
      gradient: 'from-amber-950/70 to-stone-900/90',
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
    isPointIcon: false,
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

  // ----------------------------------------------------
  // CROPS
  // ----------------------------------------------------
  {
    type: ITEM_TYPES.WHEAT,
    label: 'Wheat Crop',
    category: 'Crops',
    description: 'Golden tilled grain beds',
    iconName: 'Wheat',
    image: '/assets/crop_wheat.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WHEAT],
    isPointIcon: false,
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
    category: 'Crops',
    description: 'Loamy bed with leafy orange carrots',
    iconName: 'Carrot',
    image: '/assets/crop_carrot.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.CARROT],
    isPointIcon: false,
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
    category: 'Crops',
    description: 'Plump red tomatoes on trellised vines',
    iconName: 'Cherry',
    image: '/assets/crop_tomato.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.TOMATO],
    isPointIcon: false,
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
    isPointIcon: false,
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
    type: ITEM_TYPES.PADDY,
    label: 'Paddy Rice',
    category: 'Crops',
    description: 'Flooded rice paddy field with green saplings',
    iconName: 'Sprout',
    image: '/assets/crop_paddy.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.PADDY],
    isPointIcon: false,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#164e63',
      border: '#06b6d4',
      accent: '#22d3ee',
      badge: 'bg-cyan-950/90 text-cyan-300 border-cyan-600/70',
      gradient: 'from-cyan-950/80 to-emerald-950/90',
    },
  },
  {
    type: ITEM_TYPES.SUGARCANE,
    label: 'Sugarcane Bed',
    category: 'Crops',
    description: 'High-density tropical sugarcane crop field',
    iconName: 'Trees',
    image: '/assets/crop_sugarcane.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.SUGARCANE],
    isPointIcon: false,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#14532d',
      border: '#16a34a',
      accent: '#86efac',
      badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70',
      gradient: 'from-emerald-900/60 to-lime-950/90',
    },
  },
  {
    type: ITEM_TYPES.BANANA,
    label: 'Banana Grove',
    category: 'Crops',
    description: 'Broadleaf banana grove with ripening bunches',
    iconName: 'Sprout',
    image: '/assets/crop_banana.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.BANANA],
    isPointIcon: false,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 40,
    minHeight: 40,
    color: {
      bg: '#3f6212',
      border: '#a3e635',
      accent: '#facc15',
      badge: 'bg-lime-950/90 text-lime-300 border-lime-600/70',
      gradient: 'from-lime-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.PUMPKIN,
    label: 'Pumpkin Patch',
    category: 'Crops',
    description: 'Giant round autumn pumpkins in soil',
    iconName: 'CircleDot',
    image: '/assets/crop_pumpkin.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.PUMPKIN],
    isPointIcon: false,
    defaultWidth: 80,
    defaultHeight: 80,
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
    category: 'Crops',
    description: 'Sweet ruby red strawberries in berry shrubs',
    iconName: 'Cherry',
    image: '/assets/crop_strawberry.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.STRAWBERRY],
    isPointIcon: false,
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

  // ----------------------------------------------------
  // TREES (All Point Icons: fixed 2m x 2m = 80x80px)
  // ----------------------------------------------------
  {
    type: ITEM_TYPES.TREE,
    label: 'Orchard Tree',
    category: 'Trees',
    description: 'Shaded fruit tree & windbreak (2m × 2m)',
    iconName: 'Trees',
    image: '/assets/tree_transparent.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.TREE],
    isPointIcon: true,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 80,
    minHeight: 80,
    color: {
      bg: '#064e3b',
      border: '#10b981',
      accent: '#34d399',
      badge: 'bg-green-950/90 text-green-300 border-green-600/70',
      gradient: 'from-green-900/60 to-emerald-950/90',
    },
  },
  {
    type: ITEM_TYPES.NEEM_TREE,
    label: 'Neem Tree',
    category: 'Trees',
    description: 'Hardy medicinal neem tree windbreak (2m × 2m)',
    iconName: 'Trees',
    image: '/assets/tree_neem.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.NEEM_TREE],
    isPointIcon: true,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 80,
    minHeight: 80,
    color: {
      bg: '#022c22',
      border: '#059669',
      accent: '#6ee7b7',
      badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70',
      gradient: 'from-emerald-950/80 to-teal-950/90',
    },
  },
  {
    type: ITEM_TYPES.MANGO_TREE,
    label: 'Mango Tree',
    category: 'Trees',
    description: 'Lush tropical mango tree canopy (2m × 2m)',
    iconName: 'Trees',
    image: '/assets/tree_mango.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.MANGO_TREE],
    isPointIcon: true,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 80,
    minHeight: 80,
    color: {
      bg: '#14532d',
      border: '#eab308',
      accent: '#facc15',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-600/70',
      gradient: 'from-emerald-950/80 to-amber-950/90',
    },
  },
  {
    type: ITEM_TYPES.COCONUT_TREE,
    label: 'Coconut Tree',
    category: 'Trees',
    description: 'Tall palm canopy & perimeter marker (2m × 2m)',
    iconName: 'Trees',
    image: '/assets/tree_coconut.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.COCONUT_TREE],
    isPointIcon: true,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 80,
    minHeight: 80,
    color: {
      bg: '#042f2e',
      border: '#0d9488',
      accent: '#2dd4bf',
      badge: 'bg-teal-950/90 text-teal-300 border-teal-600/70',
      gradient: 'from-teal-950/80 to-cyan-950/90',
    },
  },

  // ----------------------------------------------------
  // STRUCTURES
  // ----------------------------------------------------
  {
    type: ITEM_TYPES.FENCE,
    label: 'Wood Fence',
    category: 'Structures',
    description: 'Rustic wooden paddock border (longer & thicker)',
    iconName: 'Fence',
    image: '/assets/fence_transparent.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.FENCE],
    isPointIcon: false,
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
    type: ITEM_TYPES.GATE,
    label: 'Paddock Gate',
    category: 'Structures',
    description: 'Heavy timber hinged paddock gate (2m × 2m)',
    iconName: 'Fence',
    image: '/assets/fence_transparent.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.GATE],
    isPointIcon: true,
    defaultWidth: 80,
    defaultHeight: 24,
    minWidth: 80,
    minHeight: 24,
    color: {
      bg: '#292524',
      border: '#d97706',
      accent: '#fbbf24',
      badge: 'bg-amber-950/90 text-amber-300 border-amber-600/70',
      gradient: 'from-amber-950/80 to-stone-900/90',
    },
  },
  {
    type: ITEM_TYPES.BARN,
    label: 'Timber Barn',
    category: 'Structures',
    description: 'Classic red timber barn & grain storage silo (4m × 4m)',
    iconName: 'Warehouse',
    image: '/assets/building_barn.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.BARN],
    isPointIcon: true,
    defaultWidth: 160,
    defaultHeight: 160,
    minWidth: 160,
    minHeight: 160,
    color: {
      bg: 'transparent',
      border: '#dc2626',
      accent: '#fca5a5',
      badge: 'bg-red-950/90 text-red-300 border-red-600/70',
      gradient: 'from-red-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.SHED,
    label: 'Farmhouse / Shed',
    category: 'Structures',
    description: 'Field equipment workshop & farmhouse hut (4m × 4m)',
    iconName: 'Warehouse',
    image: '/assets/building_barn.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.SHED],
    isPointIcon: true,
    defaultWidth: 160,
    defaultHeight: 160,
    minWidth: 160,
    minHeight: 160,
    color: {
      bg: '#1c1917',
      border: '#78716c',
      accent: '#d6d3d1',
      badge: 'bg-stone-900/90 text-stone-300 border-stone-600/70',
      gradient: 'from-stone-900/80 to-stone-950/90',
    },
  },

  // ----------------------------------------------------
  // IRRIGATION
  // ----------------------------------------------------
  {
    type: ITEM_TYPES.WATER,
    label: 'Water Canal',
    category: 'Irrigation',
    description: 'Sparkling freshwater irrigation canal',
    iconName: 'Waves',
    image: '/assets/water_canal.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WATER],
    isPointIcon: false,
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
    type: ITEM_TYPES.POND,
    label: 'Farm Pond',
    category: 'Irrigation',
    description: 'Deep rainwater retention pond & reservoir',
    iconName: 'Waves',
    image: '/assets/water_canal.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.POND],
    isPointIcon: false,
    defaultWidth: 160,
    defaultHeight: 120,
    minWidth: 60,
    minHeight: 60,
    color: {
      bg: '#082f49',
      border: '#0369a1',
      accent: '#38bdf8',
      badge: 'bg-sky-950/90 text-sky-300 border-sky-600/70',
      gradient: 'from-sky-950/80 to-indigo-950/90',
    },
  },
  {
    type: ITEM_TYPES.WELL,
    label: 'Stone Well',
    category: 'Irrigation',
    description: 'Groundwater well with hand-pump (3m × 3m)',
    iconName: 'Waves',
    image: '/assets/decor_well.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.WELL],
    isPointIcon: true,
    defaultWidth: 120,
    defaultHeight: 120,
    minWidth: 120,
    minHeight: 120,
    color: {
      bg: 'transparent',
      border: '#0284c7',
      accent: '#38bdf8',
      badge: 'bg-sky-950/90 text-sky-300 border-sky-600/70',
      gradient: 'from-sky-900/60 to-stone-950/90',
    },
  },
  {
    type: ITEM_TYPES.SPRINKLER,
    label: 'Rotary Sprinkler',
    category: 'Irrigation',
    description: 'High-pressure circular coverage emitter',
    iconName: 'Waves',
    image: '/assets/decor_well.png',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.SPRINKLER],
    isPointIcon: true,
    defaultWidth: 80,
    defaultHeight: 80,
    minWidth: 80,
    minHeight: 80,
    color: {
      bg: '#075985',
      border: '#38bdf8',
      accent: '#7dd3fc',
      badge: 'bg-cyan-950/90 text-cyan-300 border-cyan-600/70',
      gradient: 'from-cyan-950/80 to-sky-950/90',
    },
  },
  {
    type: ITEM_TYPES.PIPE,
    label: 'Water Pipe',
    category: 'Irrigation',
    description: 'Subsurface PVC irrigation pipeline',
    iconName: 'Waves',
    layerPriority: ITEM_LAYER_PRIORITY[ITEM_TYPES.PIPE],
    isPointIcon: false,
    defaultWidth: 160,
    defaultHeight: 16,
    minWidth: 20,
    minHeight: 12,
    color: {
      bg: '#1e293b',
      border: '#64748b',
      accent: '#94a3b8',
      badge: 'bg-slate-900/90 text-slate-300 border-slate-600/70',
      gradient: 'from-slate-900/80 to-stone-950/90',
    },
  },
];

export const getItemDefinition = (type) => {
  return FARM_ITEMS.find((item) => item.type === type) || FARM_ITEMS[0];
};

export const isFixedSizeItem = (type) => {
  const def = getItemDefinition(type);
  return Boolean(def.isPointIcon);
};

export const isLineItem = (type) => {
  return type === 'fence' || type === 'pipe';
};

