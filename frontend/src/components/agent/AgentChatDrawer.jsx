import React, { useState, useRef, useEffect } from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  Cpu, 
  RefreshCw,
  HelpCircle,
  Sun,
  CloudRain,
  Thermometer,
  ArrowRight,
  Sliders,
  Columns,
  Settings2,
  Droplets,
  Sprout,
  Flame,
  Scale,
  Zap
} from 'lucide-react';
import { ScenarioComparisonModal } from '../simulation/ScenarioComparisonModal';
import { FormattedChatMessage } from './FormattedChatMessage';
import { FormattedMessage } from './FormattedMessage';
import { apiClient } from '../../api/apiClient';

const PRESET_SCENARIOS = [
  {
    id: 'drought',
    icon: Sun,
    title: 'Drought',
    subtitle: 'Less rainfall for 14 days',
    yieldDelta: '-12%',
    yieldDeltaPct: -12,
    waterDemand: 'Higher',
    predictSummary: 'Some crop areas may experience moisture stress if the rainfall deficit continues and irrigation remains unchanged.',
    actions: [
      { title: 'Review irrigation priorities', desc: 'Prioritize the most water-sensitive crop areas.' },
      { title: 'Compare another scenario', desc: 'Test what changes if irrigation is increased.' }
    ]
  },
  {
    id: 'heavy_rainfall',
    icon: CloudRain,
    title: 'Heavy rainfall',
    subtitle: 'Test flooding risk',
    yieldDelta: '-8%',
    yieldDeltaPct: -8,
    waterDemand: 'Saturated',
    predictSummary: 'Soil saturation exceeds 85%, increasing root hypoxia risks in low-lying crop beds and slowing nutrient absorption.',
    actions: [
      { title: 'Elevate perimeter drainage', desc: 'Ensure water runoff flows to catchment ponds.' },
      { title: 'Monitor root pathogens', desc: 'Inspect susceptible root vegetables for fungal wilt.' }
    ]
  },
  {
    id: 'heatwave',
    icon: Thermometer,
    title: 'Heatwave',
    subtitle: 'Higher temperatures',
    yieldDelta: '-15%',
    yieldDeltaPct: -15,
    waterDemand: 'Very High',
    predictSummary: 'Peak daytime temperatures exceed 34°C, triggering rapid stomatal closure and doubling crop evapotranspiration demand.',
    actions: [
      { title: 'Provide tree windbreak shading', desc: 'Canopy shading reduces leaf scorch by up to 20%.' },
      { title: 'Schedule nocturnal irrigation', desc: 'Water during night hours to minimize evaporation.' }
    ]
  },
  {
    id: 'irrigation_change',
    icon: Droplets,
    title: 'Irrigation change',
    subtitle: 'Adjust watering frequency',
    yieldDelta: '+18%',
    yieldDeltaPct: 18,
    waterDemand: 'Optimized',
    predictSummary: 'Targeted drip irrigation maintains soil moisture consistently above 60%, boosting vegetative growth rates.',
    actions: [
      { title: 'Expand drip coverage', desc: 'Extend water canals adjacent to outer crop rows.' },
      { title: 'Calibrate flow rate', desc: 'Keep watering rate steady at 6.0 mm/day.' }
    ]
  }
];

export const AgentChatDrawer = ({ isOpen, onClose }) => {
  const { sendAgentChat, farmName, items } = useFarm();
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'chat'
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your AI Agronomist & Decision Engine. I can answer agronomy questions, inspect farm conditions, calculate solar/water stress, and evaluate what-if scenarios for **${farmName}**. What would you like to know?`,
      steps: [],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [showConfig, setShowConfig] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  // AI Provider & Key Settings
  const [apiKey, setApiKey] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_GEMINI_KEY') || localStorage.getItem('DIGIFARM_GEMINI_KEY') || ''
      : '';
  });
  const [preferredProvider, setPreferredProvider] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_AI_PROVIDER') || localStorage.getItem('DIGIFARM_AI_PROVIDER') || 'auto'
      : 'auto';
  });
  const [geminiModel, setGeminiModel] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_GEMINI_MODEL') || localStorage.getItem('DIGIFARM_GEMINI_MODEL') || 'gemini-2.5-flash'
      : 'gemini-2.5-flash';
  });
  const [localModel, setLocalModel] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_LOCAL_MODEL') || 'llama3.2:1b'
      : 'llama3.2:1b';
  });
  const [installedModels, setInstalledModels] = useState(['llama3.2:1b', 'qwen3.5:latest']);
  const [backendAgentStatus, setBackendAgentStatus] = useState(null);

  const messagesEndRef = useRef(null);

  const saveApiKey = (key) => {
    setApiKey(key);
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('GREENTWIN_GEMINI_KEY', key.trim());
      } else {
        localStorage.removeItem('GREENTWIN_GEMINI_KEY');
        localStorage.removeItem('DIGIFARM_GEMINI_KEY');
      }
    }
  };

  const savePreferredProvider = (prov) => {
    setPreferredProvider(prov);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_AI_PROVIDER', prov);
    }
  };

  const saveGeminiModel = (mod) => {
    setGeminiModel(mod);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_GEMINI_MODEL', mod);
    }
  };

  const saveLocalModel = (mod) => {
    setLocalModel(mod);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_LOCAL_MODEL', mod);
    }
  };

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      
      // Fetch backend agent status
      apiClient.getAgentStatus().then((status) => {
        setBackendAgentStatus(status);
        if (status?.ollama?.installed_models?.length > 0) {
          setInstalledModels(status.ollama.installed_models);
        }
      }).catch(() => {});

      // Discover local Ollama models in browser
      if (typeof window !== 'undefined') {
        const fetchTags = async () => {
          try {
            let res = await fetch('/ollama/api/tags').catch(() => null);
            if (!res || !res.ok) {
              res = await fetch('http://localhost:11434/api/tags').catch(() => null);
            }
            if (res && res.ok) {
              const data = await res.json();
              if (data?.models && data.models.length > 0) {
                const names = data.models.map((m) => m.name);
                setInstalledModels(names);
              }
            }
          } catch {
            // keep default
          }
        };
        fetchTags();
      }
    }
  }, [messages, isOpen]);

  const handleRunScenario = (sc) => {
    setIsSimulating(true);
    setSelectedScenario(null);

    // Simulate fast realistic calculation
    setTimeout(() => {
      setSelectedScenario(sc);
      setIsSimulating(false);
    }, 450);
  };

  const handleSend = async (customPrompt) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isLoading) return;

    // Automatically switch to chat tab
    setActiveTab('chat');

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const activeModel = preferredProvider === 'gemini' ? geminiModel : localModel;
    const result = await sendAgentChat(promptToSend, historyPayload, 5, {
      preferredProvider,
      model: activeModel,
      geminiApiKey: apiKey,
    });

    if (result.success && result.data) {
      const resp = result.data;
      const assistantMsg = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: resp.final_response,
        actionsTaken: resp.actions_taken || [],
        steps: resp.execution_steps || [],
        provider: resp.provider_used,
        model: resp.model_used,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        isError: true,
        content: result.error || 'Failed to communicate with AI Agronomist agent.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setIsLoading(false);
  };

  const toggleStepAccordion = (stepId) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  if (!isOpen) return null;

  // Active Provider & Model Label
  let badgeLabel = 'Twin Engine';
  let badgeSub = 'Simulating farm plot what-if scenarios';
  if (preferredProvider === 'gemini' || (preferredProvider === 'auto' && (apiKey || backendAgentStatus?.gemini?.configured))) {
    badgeLabel = `Gemini (${geminiModel.replace('gemini-', '')})`;
    badgeSub = 'Google Gemini Cloud Intelligence';
  } else if (preferredProvider === 'ollama' || preferredProvider === 'auto') {
    badgeLabel = localModel.includes('1b') ? 'Llama 3.2 (1B)' : localModel.includes('qwen') ? 'Qwen 3.5' : localModel;
    badgeSub = 'Local Ollama Neural Model';
  }

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-l-2 border-amber-800/80 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-50 flex flex-col transition-all duration-300 select-none">
        {/* Header */}
        <div className="p-4 border-b border-amber-950/80 flex items-center justify-between bg-stone-950/90 shadow-md flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400 flex items-center justify-center text-amber-100 shadow-md">
              <Sparkles className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-amber-200 tracking-wide font-sans">
                  AI Agronomist
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/70 shadow-sm">
                  {badgeLabel || (apiKey ? 'Gemini Live' : 'Twin Engine')}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {badgeSub || 'Decision engine & what-if farm simulator'}
              </p>
            </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-lg text-xs transition-all border ${
              showConfig || apiKey
                ? 'text-amber-300 bg-amber-950/70 border-amber-600/80' 
                : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800 border-stone-800'
            }`}
            title="Configure AI Models (Llama 3.2 / Qwen 3.5 / Gemini)"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* AI Configuration Drawer Panel */}
      {showConfig && (
        <div className="p-3.5 bg-stone-900 border-b border-amber-950 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Engine & Model Selection</span>
            </span>
            <span className="text-[10px] text-stone-400">Llama • Qwen • Gemini</span>
          </div>

          {/* Provider Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone-300">Preferred AI Provider:</label>
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => savePreferredProvider('auto')}
                className={`py-1.5 px-2 rounded border transition-all ${
                  preferredProvider === 'auto'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Auto (Cascade)
              </button>
              <button
                type="button"
                onClick={() => savePreferredProvider('ollama')}
                className={`py-1.5 px-2 rounded border transition-all ${
                  preferredProvider === 'ollama'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Local Ollama
              </button>
              <button
                type="button"
                onClick={() => savePreferredProvider('gemini')}
                className={`py-1.5 px-2 rounded border transition-all ${
                  preferredProvider === 'gemini'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Google Gemini
              </button>
            </div>
          </div>

          {/* Local Ollama Model Picker */}
          {(preferredProvider === 'ollama' || preferredProvider === 'auto') && (
            <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-stone-300">Local Model:</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Active: {localModel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => saveLocalModel('llama3.2:1b')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono border transition-all flex items-center justify-center space-x-1 ${
                    localModel.includes('1b') || localModel.includes('3.2')
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold shadow-sm'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Ultra-fast 1B model, instant replies"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Llama 3.2 (1B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => saveLocalModel('qwen3.5:latest')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono border transition-all flex items-center justify-center space-x-1 ${
                    localModel.includes('qwen')
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold shadow-sm'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Qwen reasoning model"
                >
                  <Cpu className="w-3 h-3 text-teal-400" />
                  <span>Qwen 3.5</span>
                </button>
              </div>
              {installedModels.length > 2 && (
                <div className="pt-1">
                  <select
                    value={localModel}
                    onChange={(e) => saveLocalModel(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 text-stone-300 text-[10px] rounded px-2 py-1"
                  >
                    {installedModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Google Gemini Settings */}
          {(preferredProvider === 'gemini' || preferredProvider === 'auto') && (
            <div className="space-y-2 pt-2 border-t border-stone-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-stone-300">Gemini Cloud API:</span>
                <select
                  value={geminiModel}
                  onChange={(e) => saveGeminiModel(e.target.value)}
                  className="bg-stone-950 border border-stone-800 text-amber-300 text-[10px] rounded px-1.5 py-0.5"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                </select>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use backend .env)"
                className="w-full bg-stone-950 border border-amber-900/80 rounded px-2.5 py-1.5 text-xs text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>
      )}

        {/* Tab Selector: Scenarios vs Chat */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-amber-950/80 bg-stone-900/60 flex-shrink-0">
          <div className="flex items-center space-x-1 p-1 bg-stone-950 rounded-lg border border-stone-800 text-xs w-full">
            <button
              type="button"
              onClick={() => setActiveTab('scenarios')}
              className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'scenarios'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulation Panel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'chat'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Freeform Chat ({messages.length - 1})</span>
            </button>
          </div>
        </div>

        {/* Optional Gemini Key Input */}
        {showKeyInput && (
          <div className="p-3 bg-stone-900 border-b border-amber-950 text-xs space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-200">Google Gemini API Key</span>
              <span className="text-[10px] text-stone-400">Optional for live Gemini reasoning</span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="Paste your Gemini API Key here (starts with AIza...)"
              className="w-full bg-stone-950 border border-amber-900 rounded-lg px-2.5 py-1.5 text-xs text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Quick Suggestion Chips (Always available across both views) */}
        <div className="px-3.5 py-2 bg-stone-950/80 border-b border-amber-950/80 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar flex-shrink-0">
          <button
            onClick={() => handleSend('Inspect current crop health and soil moisture')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900 border border-emerald-700/60 transition-all shadow-sm"
          >
            <Sprout className="w-3 h-3 text-emerald-400" />
            <span>Health Check</span>
          </button>
          <button
            onClick={() => handleSend('What if a 14-day drought hits my farm?')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/70 text-amber-200 hover:bg-amber-900 border border-amber-700/60 transition-all shadow-sm"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>14-Day Drought</span>
          </button>
          <button
            onClick={() => handleSend('What if heavy rainfall / flooding occurs?')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-950/70 text-sky-200 hover:bg-sky-900 border border-sky-700/60 transition-all shadow-sm"
          >
            <Droplets className="w-3 h-3 text-sky-400" />
            <span>Flood Scenario</span>
          </button>
          <button
            onClick={() => handleSend('Calculate my harvest yield and compare wheat vs carrots')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-yellow-950/70 text-yellow-200 hover:bg-yellow-900 border border-yellow-700/60 transition-all shadow-sm"
          >
            <Scale className="w-3 h-3 text-yellow-400" />
            <span>Yield & Comparison</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: DEDICATED SIMULATION PANEL (Screenshots 110531 & 110601) */}
        {/* ======================================================== */}
        {activeTab === 'scenarios' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Scenario Grid Question Heading */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-stone-200">
                What would you like to test on your farm?
              </h4>
              <p className="text-[11px] text-stone-400">
                Select an environmental scenario to run a digital twin stress simulation:
              </p>
            </div>

            {/* 4 Cards Grid (Screenshot 110531) */}
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_SCENARIOS.map((sc) => {
                const IconComp = sc.icon;
                const isSelected = selectedScenario?.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleRunScenario(sc)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group shadow-md ${
                      isSelected
                        ? 'bg-amber-950/50 border-amber-500 shadow-amber-900/30'
                        : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 hover:border-amber-600/70'
                    }`}
                  >
                    <IconComp className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h5 className="text-xs font-bold text-stone-100 group-hover:text-amber-200">
                      {sc.title}
                    </h5>
                    <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                      {sc.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Simulating Loader */}
            {isSimulating && (
              <div className="p-4 rounded-xl bg-stone-900/90 border border-amber-900 flex items-center space-x-3 animate-pulse">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                <div className="text-xs">
                  <p className="font-bold text-amber-200">Simulating Microclimate & Hydrodynamics...</p>
                  <p className="text-[10px] text-stone-400 font-mono">Running soil moisture and transpiration equations</p>
                </div>
              </div>
            )}

            {/* Simulation Results (Screenshot 110601) */}
            {selectedScenario && !isSimulating && (
              <div className="p-4 rounded-2xl bg-stone-900/90 border-2 border-amber-800/80 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* Result Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div>
                    <h4 className="text-xs font-bold text-amber-100">
                      Simulation Results
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      Scenario: {selectedScenario.title} ({selectedScenario.subtitle})
                    </p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60">
                    Illustrative example
                  </span>
                </div>

                {/* Metric Cards (Estimated yield change, Water demand) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-0.5">
                    <span className="text-[10px] text-stone-400 block">Estimated yield change</span>
                    <span className={`text-2xl font-extrabold font-mono ${selectedScenario.yieldDeltaPct < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {selectedScenario.yieldDelta}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-0.5">
                    <span className="text-[10px] text-stone-400 block">Water demand</span>
                    <span className="text-2xl font-extrabold font-mono text-sky-400">
                      {selectedScenario.waterDemand}
                    </span>
                  </div>
                </div>

                {/* What the model predicts */}
                <div className="space-y-1">
                  <h5 className="text-[11px] font-bold text-amber-200">
                    What the model predicts
                  </h5>
                  <p className="text-[11px] text-stone-300 leading-relaxed bg-stone-950/60 p-2.5 rounded-lg border border-stone-800">
                    {selectedScenario.predictSummary}
                  </p>
                </div>

                {/* Suggested actions */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-amber-200">
                    Suggested actions
                  </h5>
                  <div className="space-y-1.5">
                    {selectedScenario.actions.map((act, i) => (
                      <div key={i} className="flex items-start space-x-2 text-[11px] text-stone-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-stone-200 block">{act.title}</strong>
                          <span className="text-stone-400 text-[10px]">{act.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* THE KILLER FEATURE: COMPARE WITH CURRENT PLAN */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComparisonModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-extrabold text-xs tracking-wide shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95"
                  >
                    <Columns className="w-4 h-4 text-stone-950" />
                    <span>Compare with current plan</span>
                  </button>
                  <p className="text-[9px] text-center text-stone-500 mt-1.5">
                    Shows original farm beside simulated version, highlighting affected plots.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: MULTI-TURN CONVERSATIONAL CHAT */}
        {/* ======================================================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1.5 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-3.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-50 rounded-tr-sm shadow-md border border-amber-500/50'
                      : msg.isError
                      ? 'bg-red-950/90 border border-red-800 text-red-200 rounded-tl-sm'
                      : 'bg-stone-900/95 border-2 border-amber-950/90 text-stone-200 rounded-tl-sm shadow-lg'
                  }`}
                >
                  {/* Agent Badge & Meta */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between mb-2 text-[10px] text-stone-400 pb-1.5 border-b border-amber-950/80">
                      <span className="flex items-center space-x-1 text-amber-300 font-bold">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Agronomist Decision Engine</span>
                      </span>
                      {msg.model && (
                        <span className="font-mono bg-stone-950 px-1.5 py-0.5 rounded text-amber-400/80 border border-stone-800">
                          {msg.model}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="leading-relaxed text-stone-200">
                    <FormattedChatMessage content={msg.content} />
                  </div>

                  {/* Multi-step Execution Steps Accordion */}
                  {msg.steps && msg.steps.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-amber-950/80 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider font-mono text-amber-400/80 flex items-center space-x-1">
                        <Terminal className="w-3 h-3" />
                        <span>Simulation Trace Steps ({msg.steps.length})</span>
                      </div>

                      {msg.steps.map((step, idx) => {
                        const stepKey = `${msg.id}-step-${idx}`;
                        const isExpanded = expandedSteps[stepKey];

                        return (
                          <div
                            key={stepKey}
                            className="rounded-lg bg-stone-950/80 border border-amber-950 overflow-hidden text-[11px]"
                          >
                            <button
                              onClick={() => toggleStepAccordion(stepKey)}
                              className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-stone-800/50 transition-colors"
                            >
                              <div className="flex items-center space-x-1.5">
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                                )}
                                <span className="font-mono text-stone-300">
                                  Step {step.step_num || idx + 1}: {step.action || 'Agronomic Analysis'}
                                </span>
                              </div>
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            </button>

                            {isExpanded && (
                              <div className="p-2.5 border-t border-stone-800 bg-stone-900/40 space-y-2 font-mono text-[10px]">
                                {step.thought && (
                                  <div className="text-stone-400 italic">
                                    <span className="text-stone-500 font-sans">Thought: </span>
                                    {step.thought}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-stone-500 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-2 text-stone-300 bg-stone-900/90 p-3 rounded-xl border border-amber-950 w-fit">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-semibold text-amber-200">Evaluating Digital Twin What-If Scenario...</p>
                  <p className="text-[10px] text-stone-400 font-mono">
                    Computing agronomy metrics and farm recommendations
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Box (Always accessible at bottom) */}
        <div className="p-3.5 border-t border-amber-950 bg-stone-950/90 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask custom question (drought, soil, crop yields)..."
              disabled={isLoading}
              className="flex-1 bg-stone-900 border border-amber-950 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Scenario Comparison Modal */}
      <ScenarioComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        scenarioData={selectedScenario}
      />
    </>
  );
};
