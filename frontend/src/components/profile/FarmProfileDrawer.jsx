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
  Wind,
  CloudRain,
  Mountain,
  TrendingDown,
  ShieldCheck,
  DollarSign,
  Activity,
  RotateCcw
} from 'lucide-react';

const TABS = [
  { id: 'location', label: 'Location & Terrain', icon: MapPin },
  { id: 'climate', label: 'Climate & Weather', icon: Sun },
  { id: 'soil', label: 'Soil Chemistry', icon: Layers },
  { id: 'water', label: 'Water Infrastructure', icon: Droplet },
  { id: 'operations', label: 'Farm Operations', icon: Activity },
];

const PRESETS = [
  {
    name: 'California Coast',
    data: {
      location_name: 'Salinas Valley, CA',
      country: 'United States',
      latitude_deg: 36.7,
      longitude_deg: -121.65,
      elevation_m: 25.0,
      slope_pct: 1.5,
      base_temp_c: 21.0,
      diurnal_range_c: 11.0,
      annual_rainfall_mm: 480.0,
      mean_wind_speed_ms: 3.2,
      soil_texture: 'loam',
      organic_matter_pct: 3.4,
      baseline_ph: 6.6,
      baseline_nitrogen_ppm: 145.0,
      baseline_phosphorus_ppm: 48.0,
      baseline_potassium_ppm: 165.0,
      soil_salinity_ec_ds_m: 0.7,
      water_source: 'Groundwater Well',
      storage_capacity_m3: 600.0,
      current_reserve_m3: 520.0,
      water_cost_per_m3: 0.85,
      farming_system: 'regenerative',
      organic_certified: true,
      currency_symbol: '$',
    },
  },
  {
    name: 'Midwest Heartland',
    data: {
      location_name: 'Iowa Corn Basin',
      country: 'United States',
      latitude_deg: 42.1,
      longitude_deg: -93.6,
      elevation_m: 290.0,
      slope_pct: 2.0,
      base_temp_c: 18.0,
      diurnal_range_c: 13.5,
      annual_rainfall_mm: 880.0,
      mean_wind_speed_ms: 4.1,
      soil_texture: 'silt',
      organic_matter_pct: 4.5,
      baseline_ph: 6.8,
      baseline_nitrogen_ppm: 160.0,
      baseline_phosphorus_ppm: 55.0,
      baseline_potassium_ppm: 190.0,
      soil_salinity_ec_ds_m: 0.4,
      water_source: 'River / Canal',
      storage_capacity_m3: 850.0,
      current_reserve_m3: 780.0,
      water_cost_per_m3: 0.45,
      farming_system: 'conventional',
      organic_certified: false,
      currency_symbol: '$',
    },
  },
  {
    name: 'Mediterranean Terrace',
    data: {
      location_name: 'Valencia Hills',
      country: 'Spain',
      latitude_deg: 39.4,
      longitude_deg: -0.37,
      elevation_m: 180.0,
      slope_pct: 6.5,
      base_temp_c: 24.5,
      diurnal_range_c: 14.0,
      annual_rainfall_mm: 420.0,
      mean_wind_speed_ms: 2.6,
      soil_texture: 'clay',
      organic_matter_pct: 2.2,
      baseline_ph: 7.4,
      baseline_nitrogen_ppm: 120.0,
      baseline_phosphorus_ppm: 40.0,
      baseline_potassium_ppm: 140.0,
      soil_salinity_ec_ds_m: 1.2,
      water_source: 'Rainwater Cistern',
      storage_capacity_m3: 400.0,
      current_reserve_m3: 310.0,
      water_cost_per_m3: 1.20,
      farming_system: 'organic',
      organic_certified: true,
      currency_symbol: '€',
    },
  },
];

export const FarmProfileDrawer = ({ isOpen, onClose }) => {
  const { farmProfile, farmName, updateFarmProfile } = useFarm();
  const [activeTab, setActiveTab] = useState('location');

  const [formData, setFormData] = useState({
    // Location & Terrain
    farm_name: 'My Virtual Farm',
    location_name: 'Salinas Valley, CA',
    country: 'United States',
    latitude_deg: 36.5,
    longitude_deg: -121.65,
    elevation_m: 25.0,
    slope_pct: 1.5,

    // Climate & Atmosphere
    base_temp_c: 22.0,
    diurnal_range_c: 12.0,
    annual_rainfall_mm: 550.0,
    mean_wind_speed_ms: 2.5,

    // Soil Chemistry
    soil_texture: 'loam',
    organic_matter_pct: 3.2,
    baseline_ph: 6.5,
    baseline_nitrogen_ppm: 140.0,
    baseline_phosphorus_ppm: 45.0,
    baseline_potassium_ppm: 160.0,
    soil_salinity_ec_ds_m: 0.8,

    // Water Infrastructure
    water_source: 'Groundwater Well',
    storage_capacity_m3: 500.0,
    current_reserve_m3: 420.0,
    water_cost_per_m3: 0.85,

    // Farm Operations
    farming_system: 'regenerative',
    organic_certified: true,
    currency_symbol: '$',
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (farmProfile) {
      setFormData((prev) => ({
        ...prev,
        ...farmProfile,
        farm_name: farmProfile.farm_name || farmName || prev.farm_name,
      }));
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
      ...preset.data,
      farm_name: prev.farm_name, // keep user farm name
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      ...formData,
      latitude_deg: parseFloat(formData.latitude_deg) || 36.5,
      longitude_deg: parseFloat(formData.longitude_deg) || 0.0,
      elevation_m: parseFloat(formData.elevation_m) || 25.0,
      slope_pct: parseFloat(formData.slope_pct) || 1.0,
      base_temp_c: parseFloat(formData.base_temp_c) || 22.0,
      diurnal_range_c: parseFloat(formData.diurnal_range_c) || 12.0,
      annual_rainfall_mm: parseFloat(formData.annual_rainfall_mm) || 500.0,
      mean_wind_speed_ms: parseFloat(formData.mean_wind_speed_ms) || 2.5,
      organic_matter_pct: parseFloat(formData.organic_matter_pct) || 3.0,
      baseline_ph: parseFloat(formData.baseline_ph) || 6.5,
      baseline_nitrogen_ppm: parseFloat(formData.baseline_nitrogen_ppm) || 140.0,
      baseline_phosphorus_ppm: parseFloat(formData.baseline_phosphorus_ppm) || 45.0,
      baseline_potassium_ppm: parseFloat(formData.baseline_potassium_ppm) || 160.0,
      soil_salinity_ec_ds_m: parseFloat(formData.soil_salinity_ec_ds_m) || 0.8,
      storage_capacity_m3: parseFloat(formData.storage_capacity_m3) || 500.0,
      current_reserve_m3: parseFloat(formData.current_reserve_m3) || 400.0,
      water_cost_per_m3: parseFloat(formData.water_cost_per_m3) || 0.85,
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
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Slide-over panel */}
      <div 
        className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col h-full text-zinc-100 select-none animate-slideLeft"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-600/70 flex items-center justify-center text-emerald-400 shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-zinc-100">Farm Profile</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  Universal Config
                </span>
              </div>
              <p className="text-xs text-zinc-400">Geography, climate parameters, soil chemistry & hydrology</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 py-2 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center space-x-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Regional Presets:</span>
          </span>
          <div className="flex items-center space-x-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePreset(p)}
                className="px-2.5 py-1 rounded-md text-[11px] bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition font-medium"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Split Body: Side Navigation + Content Pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Side Sub-Nav */}
          <nav className="w-48 border-r border-zinc-800/80 bg-zinc-900/30 p-3 space-y-1 overflow-y-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                    isActive
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Quick Live Derived Indicators */}
            <div className="pt-6 border-t border-zinc-800/80 mt-6 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-1 font-semibold">
                Derived Physics
              </span>
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1.5 text-[11px] text-zinc-400">
                <div className="flex justify-between">
                  <span>Soil Retention:</span>
                  <strong className="text-zinc-200 capitalize">{formData.soil_texture}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Est. Wilting Pt:</span>
                  <strong className="text-zinc-200 font-mono">
                    {formData.soil_texture === 'sandy' ? '10%' : formData.soil_texture === 'clay' ? '30%' : '20%'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Reservoir Level:</span>
                  <strong className="text-emerald-400 font-mono">
                    {Math.round((formData.current_reserve_m3 / Math.max(1, formData.storage_capacity_m3)) * 100)}%
                  </strong>
                </div>
              </div>
            </div>
          </nav>

          {/* Form Content Tab Area */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB 1: LOCATION & TERRAIN */}
              {activeTab === 'location' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-zinc-800/80 pb-2">
                    <h3 className="text-sm font-semibold text-zinc-200">Geographic & Topographic Setup</h3>
                    <p className="text-zinc-400 text-[11px]">Controls latitude, solar declination, day length, and runoff slope</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Farm Name</label>
                      <input
                        type="text"
                        value={formData.farm_name}
                        onChange={(e) => handleChange('farm_name', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
                        placeholder="e.g. Sunny Ridge Farm"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Region / Location</label>
                      <input
                        type="text"
                        value={formData.location_name}
                        onChange={(e) => handleChange('location_name', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
                        placeholder="e.g. Salinas Valley, CA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center space-x-1">
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>Latitude (°N/S)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="-60"
                        max="60"
                        value={formData.latitude_deg}
                        onChange={(e) => handleChange('latitude_deg', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Affects photoperiod & solar elevation</span>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Longitude (°E/W)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="-180"
                        max="180"
                        value={formData.longitude_deg}
                        onChange={(e) => handleChange('longitude_deg', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Solar noon timezone alignment</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center space-x-1">
                        <Mountain className="w-3 h-3 text-emerald-400" />
                        <span>Elevation (meters)</span>
                      </label>
                      <input
                        type="number"
                        step="10"
                        min="-50"
                        max="4000"
                        value={formData.elevation_m}
                        onChange={(e) => handleChange('elevation_m', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Applies thermal lapse rate & pressure adjustment</span>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center space-x-1">
                        <TrendingDown className="w-3 h-3 text-cyan-400" />
                        <span>Slope Grade (%)</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="35"
                        value={formData.slope_pct}
                        onChange={(e) => handleChange('slope_pct', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Modulates rain runoff vs soil absorption</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CLIMATE & WEATHER */}
              {activeTab === 'climate' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-zinc-800/80 pb-2">
                    <h3 className="text-sm font-semibold text-zinc-200">Atmospheric & Thermal Dynamics</h3>
                    <p className="text-zinc-400 text-[11px]">Anchors baseline seasonal curves, evapotranspiration, and wind drift</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center space-x-1">
                        <Thermometer className="w-3 h-3 text-orange-400" />
                        <span>Base Seasonal Temp (°C)</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="-10"
                        max="45"
                        value={formData.base_temp_c}
                        onChange={(e) => handleChange('base_temp_c', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Mean annual temperature anchor</span>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Diurnal Temp Swing (°C)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="2"
                        max="25"
                        value={formData.diurnal_range_c}
                        onChange={(e) => handleChange('diurnal_range_c', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Spread between daily min & max</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center space-x-1">
                        <CloudRain className="w-3 h-3 text-sky-400" />
                        <span>Annual Rainfall (mm/yr)</span>
                      </label>
                      <input
                        type="number"
                        step="25"
                        min="0"
                        max="3000"
                        value={formData.annual_rainfall_mm}
                        onChange={(e) => handleChange('annual_rainfall_mm', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Frequency and depth of rain events</span>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center space-x-1">
                        <Wind className="w-3 h-3 text-teal-400" />
                        <span>Prevailing Wind (m/s)</span>
                      </label>
                      <input
                        type="number"
                        step="0.2"
                        min="0"
                        max="20"
                        value={formData.mean_wind_speed_ms}
                        onChange={(e) => handleChange('mean_wind_speed_ms', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Impacts Penman aerodynamic ET₀ resistance</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SOIL CHEMISTRY & TEXTURE */}
              {activeTab === 'soil' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-zinc-800/80 pb-2">
                    <h3 className="text-sm font-semibold text-zinc-200">Soil Geotechnical & Nutrient State</h3>
                    <p className="text-zinc-400 text-[11px]">Calibrates water holding capacities, nutrient availability, and root uptake</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Dominant Texture Class</label>
                      <select
                        value={formData.soil_texture}
                        onChange={(e) => handleChange('soil_texture', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans capitalize"
                      >
                        <option value="loam">Loam (Optimal drainage & aeration)</option>
                        <option value="sandy">Sandy (High infiltration, low retention)</option>
                        <option value="clay">Clay (High water retention, slow drainage)</option>
                        <option value="silt">Silt (Moisture retentive, fertile)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Organic Matter (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="15.0"
                        value={formData.organic_matter_pct}
                        onChange={(e) => handleChange('organic_matter_pct', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Increases water holding & biological buffering</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Baseline Soil pH</label>
                      <input
                        type="number"
                        step="0.1"
                        min="4.0"
                        max="9.0"
                        value={formData.baseline_ph}
                        onChange={(e) => handleChange('baseline_ph', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">6.0 – 7.0 optimal for nutrient availability</span>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Salinity EC (dS/m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.0"
                        max="10.0"
                        value={formData.soil_salinity_ec_ds_m}
                        onChange={(e) => handleChange('soil_salinity_ec_ds_m', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Electrical conductivity salt stress</span>
                    </div>
                  </div>

                  {/* NPK Inputs */}
                  <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2">
                    <span className="font-semibold text-zinc-300 text-[11px] block">Baseline Available Nutrients (PPM)</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">Nitrogen (N)</label>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={formData.baseline_nitrogen_ppm}
                          onChange={(e) => handleChange('baseline_nitrogen_ppm', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">Phosphorus (P)</label>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={formData.baseline_phosphorus_ppm}
                          onChange={(e) => handleChange('baseline_phosphorus_ppm', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-0.5">Potassium (K)</label>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={formData.baseline_potassium_ppm}
                          onChange={(e) => handleChange('baseline_potassium_ppm', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WATER INFRASTRUCTURE */}
              {activeTab === 'water' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-zinc-800/80 pb-2">
                    <h3 className="text-sm font-semibold text-zinc-200">Water Supply & Storage Reserves</h3>
                    <p className="text-zinc-400 text-[11px]">Monitors farm-level reservoir depletion, pumping costs, and water security</p>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Water Supply Sourcing</label>
                    <select
                      value={formData.water_source}
                      onChange={(e) => handleChange('water_source', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
                    >
                      <option value="Groundwater Well">Groundwater Well (Deep Aquifer)</option>
                      <option value="River / Canal">River / Canal (Gravity Feed)</option>
                      <option value="Rainwater Cistern">Rainwater Cistern (On-farm catchment)</option>
                      <option value="Municipal">Municipal Water Supply</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Storage Capacity (m³)</label>
                      <input
                        type="number"
                        step="25"
                        min="0"
                        value={formData.storage_capacity_m3}
                        onChange={(e) => handleChange('storage_capacity_m3', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Maximum on-farm storage limit</span>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Current Reserve (m³)</label>
                      <input
                        type="number"
                        step="25"
                        min="0"
                        value={formData.current_reserve_m3}
                        onChange={(e) => handleChange('current_reserve_m3', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500">Available water for tile irrigation</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1 flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>Water Cost per m³ ({formData.currency_symbol}/m³)</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.water_cost_per_m3}
                      onChange={(e) => handleChange('water_cost_per_m3', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="text-[10px] text-zinc-500">Operational cost incurred per m³ applied to crops</span>
                  </div>
                </div>
              )}

              {/* TAB 5: FARM OPERATIONS */}
              {activeTab === 'operations' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-zinc-800/80 pb-2">
                    <h3 className="text-sm font-semibold text-zinc-200">Management Strategy & Economics</h3>
                    <p className="text-zinc-400 text-[11px]">Guides AI agent recommendations and legal agronomic constraints</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Farming System</label>
                      <select
                        value={formData.farming_system}
                        onChange={(e) => handleChange('farming_system', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans capitalize"
                      >
                        <option value="regenerative">Regenerative (Soil health focused)</option>
                        <option value="organic">Organic (Synthetic-free)</option>
                        <option value="conventional">Conventional (High yield targeting)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Currency Symbol</label>
                      <input
                        type="text"
                        value={formData.currency_symbol}
                        onChange={(e) => handleChange('currency_symbol', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono text-center"
                        placeholder="$"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 font-semibold text-zinc-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Organic Certification</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-0.5">Flags synthetic fertilizer applications as policy violations in AI decisions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.organic_certified}
                        onChange={(e) => handleChange('organic_certified', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Actions */}
            <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                All changes automatically recalibrate engine physics.
              </span>
              <div className="flex items-center space-x-2.5">
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
                      <span>Profile Applied!</span>
                    </>
                  ) : saving ? (
                    <span>Recalibrating Engine...</span>
                  ) : (
                    <>
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
