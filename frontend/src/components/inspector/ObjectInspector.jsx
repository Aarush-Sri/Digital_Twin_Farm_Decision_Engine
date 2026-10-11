import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  getItemDefinition, 
  pxToMeters, 
  pxToMetersNum, 
  metersToPx, 
  calcAreaSqMeters, 
  calcAreaAcres, 
  calcAreaHectares,
  CROP_VARIETIES,
  TREE_VARIETIES,
  SOIL_TYPES,
  IRRIGATION_METHODS
} from '../../types/farm';
import { 
  X, 
  Copy, 
  Trash2, 
  Layers, 
  Maximize2, 
  Lock, 
  Droplets, 
  Calendar, 
  Sprout, 
  Trees, 
  Sparkles,
  Sliders,
  Compass
} from 'lucide-react';

export const ObjectInspector = () => {
  const { 
    selectedItem, 
    deselectAll, 
    deleteItem, 
    duplicateItem, 
    bringToFront, 
    updateDimensions,
    updateItemProperties,
    currentDay
  } = useFarm();

  if (!selectedItem) return null;

  const itemDef = getItemDefinition(selectedItem.type);
  const isPoint = Boolean(itemDef.isPointIcon || selectedItem.isPointIcon);
  const isCrop = itemDef.category === 'Crops';
  const isTree = itemDef.category === 'Trees';

  // Area stats
  const areaSqM = calcAreaSqMeters(selectedItem.width, selectedItem.height);
  const areaAcres = calcAreaAcres(selectedItem.width, selectedItem.height);
  const areaHectares = calcAreaHectares(selectedItem.width, selectedItem.height);

  // Default properties with fallbacks
  const variety = selectedItem.variety || (isCrop ? CROP_VARIETIES[selectedItem.type]?.[0] : isTree ? TREE_VARIETIES[selectedItem.type]?.[0] : 'Standard');
  const plantingDay = selectedItem.plantingDay ?? currentDay ?? 1;
  const soilType = selectedItem.soilType || 'Fertile Loam';
  const soilPh = selectedItem.soilPh ?? 6.5;
  const soilMoisture = selectedItem.soilMoisture ?? 65;
  const organicMatter = selectedItem.organicMatter ?? 3.5;
  const irrigationMethod = selectedItem.irrigationMethod || (isCrop ? 'Drip Irrigation' : isTree ? 'Drip Basin' : 'Standard');
  const wateringRate = selectedItem.wateringRate ?? 6.0;
  const treeAge = selectedItem.treeAge || 'Semi-Mature (3 yrs)';
  const rootDepth = selectedItem.rootDepth ?? 1.2;
  const canopyDiameter = selectedItem.canopyDiameter ?? 2.5;

  const handleDimensionStep = (dimension, deltaMeters) => {
    if (isPoint) return;
    const currentM = pxToMetersNum(selectedItem[dimension]);
    const nextM = Math.max(1.0, currentM + deltaMeters);
    const nextPx = metersToPx(nextM);

    updateDimensions({
      id: selectedItem.id,
      width: dimension === 'width' ? nextPx : selectedItem.width,
      height: dimension === 'height' ? nextPx : selectedItem.height,
    });
  };

  const handleApplyPreset = (widthM, heightM) => {
    if (isPoint) return;
    updateDimensions({
      id: selectedItem.id,
      width: metersToPx(widthM),
      height: metersToPx(heightM),
    });
  };

  const updateProp = (key, value) => {
    updateItemProperties(selectedItem.id, { [key]: value });
  };

  return (
    <aside className="fixed top-20 right-4 w-84 md:w-92 max-h-[calc(100vh-6rem)] flex flex-col bg-stone-950/95 backdrop-blur-md border-2 border-amber-900/80 rounded-2xl shadow-2xl z-40 select-none overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-amber-950/80 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center border overflow-hidden shadow-inner flex-shrink-0"
            style={{ 
              backgroundColor: itemDef.color.bg, 
              borderColor: itemDef.color.border 
            }}
          >
            {itemDef.image ? (
              <img 
                src={itemDef.image} 
                alt={itemDef.label} 
                className="w-full h-full object-contain pixel-crisp" 
              />
            ) : (
              <Sprout className="w-4 h-4 text-amber-200" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-amber-100 tracking-wide truncate">
                {itemDef.label}
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60 flex-shrink-0">
                {itemDef.category}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-mono">
              ID: {selectedItem.id.slice(-6)}
            </p>
          </div>
        </div>

        <button
          onClick={deselectAll}
          className="p-1 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Toolbar: Duplicate, Layer, Delete */}
      <div className="px-3 py-2 bg-stone-900/60 border-b border-stone-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => duplicateItem(selectedItem.id)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-amber-300 transition-colors text-[11px]"
            title="Duplicate Item (Ctrl+D)"
          >
            <Copy className="w-3 h-3 text-amber-400" />
            <span>Duplicate</span>
          </button>
          <button
            onClick={() => bringToFront(selectedItem.id)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-amber-300 transition-colors text-[11px]"
            title="Bring to Front"
          >
            <Layers className="w-3 h-3 text-sky-400" />
            <span>Top</span>
          </button>
        </div>

        <button
          onClick={() => deleteItem(selectedItem.id)}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 transition-colors text-[11px]"
          title="Delete Item (Delete)"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete</span>
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* SECTION 1: Real-World Dimensions & Area */}
        <div className="space-y-2 bg-stone-900/40 p-3 rounded-xl border border-stone-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
            <span className="flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-World Dimensions</span>
            </span>
            {isPoint ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5 mr-0.5" />
                <span>Fixed 2m × 2m Point Icon</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center space-x-1">
                <Maximize2 className="w-2.5 h-2.5 mr-0.5" />
                <span>Resizable Field Plot</span>
              </span>
            )}
          </div>

          {/* Width & Height display / stepper */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
              <span className="text-[10px] text-stone-400 block">Width</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-stone-100">
                  {pxToMeters(selectedItem.width)}
                </span>
                {!isPoint && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDimensionStep('width', -0.5)}
                      className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleDimensionStep('width', 0.5)}
                      className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
              <span className="text-[10px] text-stone-400 block">Length / Height</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-stone-100">
                  {pxToMeters(selectedItem.height)}
                </span>
                {!isPoint && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDimensionStep('height', -0.5)}
                      className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleDimensionStep('height', 0.5)}
                      className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Area Metrics */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono text-[10px]">
            <div className="p-1.5 rounded bg-stone-950/80 border border-stone-800/80">
              <span className="text-stone-400 block">Area</span>
              <strong className="text-emerald-300">{areaSqM} m²</strong>
            </div>
            <div className="p-1.5 rounded bg-stone-950/80 border border-stone-800/80">
              <span className="text-stone-400 block">Acres</span>
              <strong className="text-amber-300">{areaAcres} ac</strong>
            </div>
            <div className="p-1.5 rounded bg-stone-950/80 border border-stone-800/80">
              <span className="text-stone-400 block">Hectares</span>
              <strong className="text-sky-300">{areaHectares} ha</strong>
            </div>
          </div>

          {/* Area Presets (for resizable plots) */}
          {!isPoint && (
            <div className="flex items-center space-x-1 pt-1 overflow-x-auto">
              <span className="text-[10px] text-stone-500 font-mono mr-1">Presets:</span>
              {[
                [2, 2],
                [3, 3],
                [4, 2],
                [5, 5],
              ].map(([w, h]) => (
                <button
                  key={`${w}x${h}`}
                  onClick={() => handleApplyPreset(w, h)}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-amber-900/60 hover:text-amber-200 border border-stone-700 text-[10px] font-mono transition-colors"
                >
                  {w}×{h}m
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Crop Specific Settings */}
        {isCrop && (
          <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-200">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>Crop Cultivation Settings</span>
            </div>

            {/* Variety Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-300 font-medium flex items-center justify-between">
                <span>Crop Variety</span>
                <span className="text-[10px] text-amber-400/80">Cultivar</span>
              </label>
              <select
                value={variety}
                onChange={(e) => updateProp('variety', e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
              >
                {(CROP_VARIETIES[selectedItem.type] || ['Standard Heirloom', 'Commercial High Yield']).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Planting Date */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-300 font-medium flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>Planting Date</span>
                </span>
                <span className="font-mono text-amber-300 text-[11px]">
                  Day {plantingDay} (Age: {Math.max(0, currentDay - plantingDay)}d)
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={plantingDay}
                  onChange={(e) => updateProp('plantingDay', Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Irrigation & Water Allocation */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] text-stone-300 font-medium flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Droplets className="w-3 h-3 text-sky-400" />
                  <span>Irrigation Method</span>
                </span>
                <span className="font-mono text-sky-300 text-[10px]">{wateringRate} mm/day</span>
              </label>
              <select
                value={irrigationMethod}
                onChange={(e) => updateProp('irrigationMethod', e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-stone-100 focus:outline-none focus:border-sky-500"
              >
                {IRRIGATION_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={wateringRate}
                onChange={(e) => updateProp('wateringRate', Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer mt-1"
              />
            </div>
          </div>
        )}

        {/* SECTION 3: Tree Specific Settings */}
        {isTree && (
          <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-200">
              <Trees className="w-3.5 h-3.5 text-emerald-400" />
              <span>Orchard Tree Settings</span>
            </div>

            {/* Variety */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-300 font-medium">Tree Variety</label>
              <select
                value={variety}
                onChange={(e) => updateProp('variety', e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
              >
                {(TREE_VARIETIES[selectedItem.type] || ['Heritage Orchard Tree', 'Standard Wild Rootstock']).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Age & Canopy */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-400">Growth Stage</label>
                <select
                  value={treeAge}
                  onChange={(e) => updateProp('treeAge', e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-[11px] text-stone-200 focus:outline-none"
                >
                  <option value="Sapling (1 yr)">Sapling (1 yr)</option>
                  <option value="Semi-Mature (3 yrs)">Semi-Mature (3 yrs)</option>
                  <option value="Full Bearing (7+ yrs)">Full Bearing (7+ yrs)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-400">Root Depth</label>
                <div className="p-1.5 rounded bg-stone-950 border border-stone-800 text-[11px] font-mono text-emerald-300">
                  {rootDepth} meters
                </div>
              </div>
            </div>

            {/* Canopy Diameter slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-300">Canopy Spread</span>
                <span className="font-mono text-amber-300">{canopyDiameter}m diameter</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.1"
                value={canopyDiameter}
                onChange={(e) => updateProp('canopyDiameter', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* SECTION 4: Soil Conditions (For crops, terrain, and trees) */}
        {(isCrop || isTree || itemDef.category === 'Terrain') && (
          <div className="space-y-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Soil Conditions</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
                Calibrated
              </span>
            </div>

            {/* Soil Type */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-300">Soil Texture</label>
              <select
                value={soilType}
                onChange={(e) => updateProp('soilType', e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              >
                {SOIL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Soil pH slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-300">Soil pH</span>
                <span className="font-mono text-amber-300 font-bold">
                  {soilPh} {soilPh >= 6.0 && soilPh <= 7.2 ? '(Optimal)' : '(Acidic/Basic)'}
                </span>
              </div>
              <input
                type="range"
                min="5.0"
                max="8.5"
                step="0.1"
                value={soilPh}
                onChange={(e) => updateProp('soilPh', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Soil Moisture & Organic Matter */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
              <div className="bg-stone-950 p-2 rounded-lg border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400">
                  <span>Moisture</span>
                  <strong className="text-sky-300">{soilMoisture}%</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={soilMoisture}
                  onChange={(e) => updateProp('soilMoisture', Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="bg-stone-950 p-2 rounded-lg border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400">
                  <span>Organic Matter</span>
                  <strong className="text-emerald-300">{organicMatter}%</strong>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.1"
                  value={organicMatter}
                  onChange={(e) => updateProp('organicMatter', Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer tips */}
      <div className="p-2.5 border-t border-amber-950/80 bg-stone-900/70 text-[10px] text-stone-400 flex items-center justify-between">
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Press <strong>Ctrl+D</strong> to duplicate</span>
        </span>
        <button
          onClick={deselectAll}
          className="text-amber-400 hover:underline font-mono"
        >
          Esc to close
        </button>
      </div>
    </aside>
  );
};
