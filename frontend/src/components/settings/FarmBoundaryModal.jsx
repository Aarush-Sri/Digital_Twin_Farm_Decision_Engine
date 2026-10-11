import React, { useState } from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  X, 
  MapPin, 
  Compass, 
  Check, 
  Sparkles, 
  Maximize2,
  TreePine,
  Layers
} from 'lucide-react';
import { SQ_METERS_PER_ACRE, SQ_METERS_PER_HECTARE } from '../../types/farm';

export const FarmBoundaryModal = ({ isOpen, onClose }) => {
  const { farmSettings, updateFarmSettings, farmStats, items } = useFarm();

  const [name, setName] = useState(farmSettings?.name || 'Greenfield Valley Digital Twin');
  const [location, setLocation] = useState(farmSettings?.location || 'Zone 6b • Greenfield Valley');
  const [unit, setUnit] = useState(farmSettings?.unit || 'acres');
  const [totalSize, setTotalSize] = useState(farmSettings?.totalSize || 2.5);
  const [boundaryWidthM, setBoundaryWidthM] = useState(farmSettings?.boundaryWidthM || 100);
  const [boundaryHeightM, setBoundaryHeightM] = useState(farmSettings?.boundaryHeightM || 100);

  if (!isOpen) return null;

  const totalSqM = unit === 'acres' 
    ? Math.round(totalSize * SQ_METERS_PER_ACRE) 
    : Math.round(totalSize * SQ_METERS_PER_HECTARE);

  const cultivatedPct = totalSqM > 0 
    ? Math.min(100, Math.round(((farmStats?.totalCultivatedSqM || 0) / totalSqM) * 100))
    : 0;

  const handlePreset = (presetSize, presetUnit, w, h) => {
    setTotalSize(presetSize);
    setUnit(presetUnit);
    setBoundaryWidthM(w);
    setBoundaryHeightM(h);
  };

  const handleSave = () => {
    updateFarmSettings({
      name,
      location,
      unit,
      totalSize: Number(totalSize),
      boundaryWidthM: Number(boundaryWidthM),
      boundaryHeightM: Number(boundaryHeightM),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-stone-950 border-2 border-amber-800/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-amber-950/80 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400 flex items-center justify-center text-amber-100 shadow-md">
              <Compass className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-amber-200 tracking-wide font-sans">
                Set Up Farm Boundary & Real Dimensions
              </h2>
              <p className="text-[11px] text-stone-400">
                01. Calibrate real acreage, boundary scale & climate zone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Farm Name */}
          <div className="space-y-1">
            <label className="text-stone-300 font-medium">Farm Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greenfield Valley Twin"
              className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Location & Region */}
          <div className="space-y-1">
            <label className="text-stone-300 font-medium flex items-center justify-between">
              <span>Location / Agricultural Hardiness Zone</span>
              <span className="text-[10px] text-amber-400 font-mono">Simulated Weather</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Zone 6b • Greenfield Valley"
                className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Size & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-stone-300 font-medium">Measurement Unit</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-900 rounded-lg border border-stone-800">
                <button
                  type="button"
                  onClick={() => setUnit('acres')}
                  className={`py-1.5 rounded text-center font-bold text-xs transition-all ${
                    unit === 'acres'
                      ? 'bg-amber-600 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Acres
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('hectares')}
                  className={`py-1.5 rounded text-center font-bold text-xs transition-all ${
                    unit === 'hectares'
                      ? 'bg-amber-600 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Hectares
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-stone-300 font-medium flex items-center justify-between">
                <span>Total Farm Boundary Size</span>
                <span className="text-[10px] text-emerald-400 font-mono">{totalSqM.toLocaleString()} m²</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={totalSize}
                  onChange={(e) => setTotalSize(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-stone-400 uppercase font-mono">{unit}</span>
              </div>
            </div>
          </div>

          {/* Quick Real-World Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-stone-400">Quick Size Presets:</span>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => handlePreset(1.0, 'acres', 64, 64)}
                className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/60 text-stone-300 hover:text-amber-200"
              >
                1.0 Acre (64m)
              </button>
              <button
                type="button"
                onClick={() => handlePreset(2.5, 'acres', 100, 100)}
                className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/60 text-stone-300 hover:text-amber-200"
              >
                2.5 Acres (100m)
              </button>
              <button
                type="button"
                onClick={() => handlePreset(5.0, 'acres', 142, 142)}
                className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/60 text-stone-300 hover:text-amber-200"
              >
                5.0 Acres (142m)
              </button>
              <button
                type="button"
                onClick={() => handlePreset(1.0, 'hectares', 100, 100)}
                className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/60 text-stone-300 hover:text-amber-200"
              >
                1.0 Ha (100m)
              </button>
            </div>
          </div>

          {/* Cultivation Capacity Summary */}
          <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Cultivated Land Utilization</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {cultivatedPct}% ({farmStats?.totalCultivatedSqM || 0} / {totalSqM} m²)
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-300"
                style={{ width: `${cultivatedPct}%` }}
              />
            </div>

            <p className="text-[10px] text-stone-400 leading-relaxed">
              Plots placed on the canvas will directly reflect actual ground coverage in meters, hectares, and acres.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-amber-950/80 bg-stone-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs shadow-lg transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Dimensions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
