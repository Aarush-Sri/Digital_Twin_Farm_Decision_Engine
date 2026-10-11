import React, { useState, useEffect } from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Settings, 
  X, 
  MapPin, 
  Sun, 
  Layers, 
  Droplet, 
  Check, 
  Sparkles,
  Thermometer,
  RotateCcw
} from 'lucide-react';

const PRESETS = [
  {
    name: 'California Coast',
    location_name: 'Salinas Valley, CA',
    latitude_deg: 36.7,
    base_temp_c: 21.0,
    soil_texture: 'loam',
    baseline_ph: 6.5,
    water_source: 'Groundwater Well',
  },
  {
    name: 'Midwest Plains',
    location_name: 'Iowa Heartland',
    latitude_deg: 42.0,
    base_temp_c: 18.0,
    soil_texture: 'silt',
    baseline_ph: 6.8,
    water_source: 'River / Canal',
  },
  {
    name: 'Sunny Southwest',
    location_name: 'Arizona Basin',
    latitude_deg: 33.4,
    base_temp_c: 27.5,
    soil_texture: 'sandy',
    baseline_ph: 7.4,
    water_source: 'Canal / Irrigation District',
  },
];

export const FarmProfileModal = ({ isOpen, onClose }) => {
  const { farmProfile, farmName, updateFarmProfile } = useFarm();

  const [formData, setFormData] = useState({
    farm_name: farmProfile?.farm_name || farmName || 'My Virtual Farm',
    location_name: farmProfile?.location_name || 'Salinas Valley, CA',
    latitude_deg: farmProfile?.latitude_deg ?? 36.5,
    base_temp_c: farmProfile?.base_temp_c ?? 22.0,
    soil_texture: farmProfile?.soil_texture || 'loam',
    baseline_ph: farmProfile?.baseline_ph ?? 6.5,
    water_source: farmProfile?.water_source || 'Groundwater Well',
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (farmProfile) {
      setFormData({
        farm_name: farmProfile.farm_name || farmName || 'My Virtual Farm',
        location_name: farmProfile.location_name || 'Salinas Valley, CA',
        latitude_deg: farmProfile.latitude_deg ?? 36.5,
        base_temp_c: farmProfile.base_temp_c ?? 22.0,
        soil_texture: farmProfile.soil_texture || 'loam',
        baseline_ph: farmProfile.baseline_ph ?? 6.5,
        water_source: farmProfile.water_source || 'Groundwater Well',
      });
    }
  }, [farmProfile, farmName, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset,
      farm_name: prev.farm_name, // keep user's farm name
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      farm_name: formData.farm_name.trim() || 'My Virtual Farm',
      location_name: formData.location_name.trim() || 'Custom Plot',
      latitude_deg: parseFloat(formData.latitude_deg) || 36.5,
      base_temp_c: parseFloat(formData.base_temp_c) || 22.0,
      soil_texture: formData.soil_texture,
      baseline_ph: parseFloat(formData.baseline_ph) || 6.5,
      water_source: formData.water_source,
    };

    const res = await updateFarmProfile(payload);
    setSaving(false);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Farm Plot Profile</h2>
              <p className="text-xs text-zinc-400">Universal location, climate & soil characteristics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 py-2.5 bg-zinc-950/30 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center space-x-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Presets:</span>
          </span>
          <div className="flex items-center space-x-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePreset(p)}
                className="px-2.5 py-1 rounded-md text-[11px] bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/50 transition font-medium"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Farm Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Farm Name</label>
              <input
                type="text"
                value={formData.farm_name}
                onChange={(e) => handleChange('farm_name', e.target.value)}
                placeholder="e.g. Green Acres"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Location / Region</span>
              </label>
              <input
                type="text"
                value={formData.location_name}
                onChange={(e) => handleChange('location_name', e.target.value)}
                placeholder="e.g. Salinas Valley, CA"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          {/* Latitude & Base Temperature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1 flex items-center space-x-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Latitude (°N)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="-60"
                  max="60"
                  value={formData.latitude_deg}
                  onChange={(e) => handleChange('latitude_deg', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-2 text-zinc-500 font-mono text-[11px]">°</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">Drives solar angle & daily photoperiod</p>
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1 flex items-center space-x-1">
                <Thermometer className="w-3 h-3 text-orange-400" />
                <span>Base Temperature (°C)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="-10"
                  max="45"
                  value={formData.base_temp_c}
                  onChange={(e) => handleChange('base_temp_c', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-2 text-zinc-500 font-mono text-[11px]">°C</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">Mean seasonal thermal anchor</p>
            </div>
          </div>

          {/* Soil Texture & pH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1 flex items-center space-x-1">
                <Layers className="w-3 h-3 text-amber-500" />
                <span>Soil Texture</span>
              </label>
              <select
                value={formData.soil_texture}
                onChange={(e) => handleChange('soil_texture', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans capitalize"
              >
                <option value="loam">Loam (Balanced & fertile)</option>
                <option value="sandy">Sandy (Fast draining)</option>
                <option value="clay">Clay (High water retention)</option>
                <option value="silt">Silt (Moisture retentive)</option>
              </select>
              <p className="text-[10px] text-zinc-500 mt-0.5">Calibrates field capacity & wilting point</p>
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Soil Baseline pH</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="9.0"
                  value={formData.baseline_ph}
                  onChange={(e) => handleChange('baseline_ph', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-2 text-zinc-500 font-mono text-[11px]">pH</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">Optimal range is 6.0 – 7.0</p>
            </div>
          </div>

          {/* Water Source */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1 flex items-center space-x-1">
              <Droplet className="w-3 h-3 text-sky-400" />
              <span>Water Source</span>
            </label>
            <select
              value={formData.water_source}
              onChange={(e) => handleChange('water_source', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
            >
              <option value="Groundwater Well">Groundwater Well</option>
              <option value="River / Canal">River / Canal</option>
              <option value="Rainwater Cistern">Rainwater Cistern</option>
              <option value="Municipal">Municipal Water Supply</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-lg font-semibold transition text-xs shadow-md ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : saving ? (
                <span>Updating Engine...</span>
              ) : (
                <>
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
