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
  Flame, 
  Droplets, 
  Sprout, 
  Scale, 
  Settings2, 
  Zap, 
  Columns, 
  Sun, 
  CloudRain, 
  Thermometer 
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { FormattedMessage } from './FormattedMessage';
import { ScenarioComparisonModal } from '../simulation/ScenarioComparisonModal';

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
  const { 
    sendAgentChat, 
    backendStatus, 
    farmName, 
    aiProvider: contextAiProvider,
    setAiProvider: contextSetAiProvider,
    geminiModel: contextGeminiModel,
    setGeminiModel: contextSetGeminiModel,
    localModel: contextLocalModel,
    setLocalModel: contextSetLocalModel,
    geminiApiKey: contextGeminiApiKey,
    setGeminiApiKey: contextSetGeminiApiKey,
    activeAiModel: contextActiveAiModel,
  } = useFarm();

  const [messages, setMessages] = useState(() => [
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
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'chat'
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  
  // AI Provider & Key Settings (synced with Context & localStorage)
  const [apiKey, setApiKey] = useState(() => {
    return contextGeminiApiKey || (typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_GEMINI_KEY') || localStorage.getItem('DIGIFARM_GEMINI_KEY') || ''
      : '');
  });
  const [preferredProvider, setPreferredProvider] = useState(() => {
    return contextAiProvider || (typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_AI_PROVIDER') || localStorage.getItem('DIGIFARM_AI_PROVIDER') || 'auto'
      : 'auto');
  });
  const [geminiModel, setGeminiModel] = useState(() => {
    return contextGeminiModel || (typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_GEMINI_MODEL') || localStorage.getItem('DIGIFARM_GEMINI_MODEL') || 'gemini-2.5-flash'
      : 'gemini-2.5-flash');
  });
  const [localModel, setLocalModel] = useState(() => {
    return contextLocalModel || (typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_LOCAL_MODEL') || 'qwen3.5:latest'
      : 'qwen3.5:latest');
  });
  const [installedModels, setInstalledModels] = useState(['qwen3.5:latest', 'llama3.2:1b']);
  const [_backendAgentStatus, setBackendAgentStatus] = useState(null);

  const messagesEndRef = useRef(null);

  const saveApiKey = (key) => {
    setApiKey(key);
    if (contextSetGeminiApiKey) contextSetGeminiApiKey(key);
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
    if (contextSetAiProvider) contextSetAiProvider(prov);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_AI_PROVIDER', prov);
    }
  };

  const saveGeminiModel = (mod) => {
    setGeminiModel(mod);
    if (contextSetGeminiModel) contextSetGeminiModel(mod);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_GEMINI_MODEL', mod);
    }
  };

  const saveLocalModel = (mod) => {
    setLocalModel(mod);
    if (contextSetLocalModel) contextSetLocalModel(mod);
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
      activeTab,
      selectedScenario,
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
  const effectiveActiveModel = contextActiveAiModel || {
    label: preferredProvider === 'gemini' 
      ? geminiModel.replace('gemini-', 'Gemini ')
      : (localModel.includes('1b') ? 'Llama 3.2 (1B)' : localModel.includes('qwen') ? 'Qwen 3.5' : localModel),
    shortLabel: preferredProvider === 'gemini'
      ? geminiModel.replace('gemini-', 'Gemini ')
      : (localModel.includes('1b') ? 'Llama 3.2' : localModel.includes('qwen') ? 'Qwen 3.5' : localModel),
    providerLabel: preferredProvider === 'gemini' ? 'Google Gemini' : preferredProvider === 'auto' ? 'Auto Cascade' : 'Local Ollama',
    isLocal: preferredProvider !== 'gemini',
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-l-2 border-amber-800/80 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-50 flex flex-col transition-all duration-300 select-text">
      {/* Header */}
      <div className="p-4 border-b border-amber-950/80 flex items-center justify-between bg-stone-950/90 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400 flex items-center justify-center text-amber-100 shadow-md">
            {showConfig ? <Settings2 className="w-5 h-5 drop-shadow" /> : <Bot className="w-5 h-5 drop-shadow" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-amber-200 tracking-wide font-sans">
                {showConfig ? 'AI Settings & Models' : 'AI Agronomist'}
              </h3>
              {/* Active Model Pill Badge with Pulsing Live Indicator */}
              <div 
                className="flex items-center space-x-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/70 shadow-sm"
                title={`Active AI Model: ${effectiveActiveModel.label} via ${effectiveActiveModel.providerLabel}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>ACTIVE: {effectiveActiveModel.label}</span>
              </div>
            </div>
            <p className="text-[11px] text-stone-400">
              {showConfig ? 'Configure local neural models, cloud API, and providers' : `Provider: ${effectiveActiveModel.providerLabel} • Simulating farm plot what-if scenarios`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center space-x-1.5 ${
              showConfig || apiKey
                ? 'text-amber-200 bg-amber-950/80 border-amber-500 shadow-sm' 
                : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800 border-stone-800'
            }`}
            title={showConfig ? 'Done / Return to Chat' : 'Configure AI Models (Llama 3.2 / Qwen 3.5 / Gemini)'}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-sans">{showConfig ? 'Done' : 'Settings'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-all"
            title="Close Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showConfig ? (
        /* ======================================================== */
        /* DEDICATED FULL-PANEL AI SETTINGS VIEW */
        /* ======================================================== */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-amber-950/60">
            <span className="font-bold text-amber-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Engine & Model Selection</span>
            </span>
            <span className="text-[10px] text-stone-400">Llama • Qwen • Gemini</span>
          </div>

          {/* Active AI Model Status Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 via-stone-900 to-emerald-950/60 border border-emerald-500/70 flex items-center justify-between shadow-inner">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-[11px] font-bold text-emerald-200 flex items-center space-x-1.5">
                  <span className="text-stone-400 font-normal">Active AI Model:</span>
                  <span className="font-mono text-emerald-300 font-extrabold bg-stone-950 px-2 py-0.5 rounded border border-emerald-600/40 shadow-sm">
                    {effectiveActiveModel.label}
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                  Engine: <span className="text-emerald-400 font-bold">{effectiveActiveModel.providerLabel}</span>
                  <span className="text-stone-500 mx-1">•</span>
                  <span>{effectiveActiveModel.isLocal ? 'On-Device Weights (Ollama)' : 'Google Cloud Intelligence'}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-sm flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>ACTIVE</span>
            </span>
          </div>

          {/* Provider Selection */}
          <div className="space-y-1.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-stone-300">Preferred AI Provider:</label>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Active: {preferredProvider.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => savePreferredProvider('auto')}
                className={`py-2 px-2 rounded-lg border transition-all flex items-center justify-center space-x-1 ${
                  preferredProvider === 'auto'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>Auto</span>
                {preferredProvider === 'auto' && (
                  <span className="text-[8px] bg-emerald-900/80 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold">
                    ✓ ACTIVE
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => savePreferredProvider('ollama')}
                className={`py-2 px-2 rounded-lg border transition-all flex items-center justify-center space-x-1 ${
                  preferredProvider === 'ollama'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>Local Ollama</span>
                {preferredProvider === 'ollama' && (
                  <span className="text-[8px] bg-emerald-900/80 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold">
                    ✓ ACTIVE
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => savePreferredProvider('gemini')}
                className={`py-2 px-2 rounded-lg border transition-all flex items-center justify-center space-x-1 ${
                  preferredProvider === 'gemini'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>Google Gemini</span>
                {preferredProvider === 'gemini' && (
                  <span className="text-[8px] bg-emerald-900/80 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold">
                    ✓ ACTIVE
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Local Ollama Model Picker */}
          {(preferredProvider === 'ollama' || preferredProvider === 'auto') && (
            <div className="space-y-2 p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-300">Local Neural Model:</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>Active: {localModel}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => saveLocalModel('llama3.2:1b')}
                  className={`py-2 px-3 rounded-lg text-[11px] font-mono border transition-all flex items-center justify-between ${
                    localModel.includes('1b') || localModel.includes('3.2')
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Ultra-fast 1B model, instant replies"
                >
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Llama 3.2 (1B)</span>
                  </div>
                  {(localModel.includes('1b') || localModel.includes('3.2')) ? (
                    <span className="text-[9px] bg-emerald-500 text-stone-950 font-sans font-bold px-1.5 py-0.2 rounded shadow-sm">
                      ✓ ACTIVE
                    </span>
                  ) : (
                    <span className="text-[9px] text-stone-500">Select</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => saveLocalModel('qwen3.5:latest')}
                  className={`py-2 px-3 rounded-lg text-[11px] font-mono border transition-all flex items-center justify-between ${
                    localModel.includes('qwen')
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Qwen reasoning model"
                >
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-teal-400" />
                    <span>Qwen 3.5</span>
                  </div>
                  {localModel.includes('qwen') ? (
                    <span className="text-[9px] bg-emerald-500 text-stone-950 font-sans font-bold px-1.5 py-0.2 rounded shadow-sm">
                      ✓ ACTIVE
                    </span>
                  ) : (
                    <span className="text-[9px] text-stone-500">Select</span>
                  )}
                </button>
              </div>
              {installedModels.length > 2 && (
                <div className="pt-1">
                  <select
                    value={localModel}
                    onChange={(e) => saveLocalModel(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 text-stone-300 text-[10px] rounded px-2.5 py-1.5"
                  >
                    {installedModels.map((m) => (
                      <option key={m} value={m}>{m} {m === localModel ? '(Active)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Google Gemini Settings */}
          {(preferredProvider === 'gemini' || preferredProvider === 'auto') && (
            <div className="space-y-2 p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-300">Gemini Cloud API:</span>
                <div className="flex items-center space-x-1.5">
                  <select
                    value={geminiModel}
                    onChange={(e) => saveGeminiModel(e.target.value)}
                    className="bg-stone-950 border border-stone-800 text-amber-300 text-[10px] rounded px-2 py-1"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  </select>
                  {preferredProvider === 'gemini' && (
                    <span className="text-[9px] bg-emerald-500 text-stone-950 font-sans font-bold px-1.5 py-0.2 rounded shadow-sm">
                      ✓ ACTIVE
                    </span>
                  )}
                </div>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use backend .env)"
                className="w-full bg-stone-950 border border-amber-900/80 rounded px-3 py-2 text-xs text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-stone-500">
                Custom Gemini API keys are securely cached in your local session.
              </p>
            </div>
          )}

          {/* Back to Chat / Done Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs tracking-wide shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Done & Return to Chat</span>
            </button>
          </div>
        </div>
      ) : (
        <>

      {/* Tab Switcher: Simulation Panel vs Freeform Chat */}
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
            <span>Freeform Chat ({Math.max(0, messages.length - 1)})</span>
          </button>
        </div>
      </div>



      {/* ======================================================== */}
      {/* VIEW 1: DEDICATED SIMULATION PANEL */}
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

          {/* 4 Cards Grid */}
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

          {/* Simulation Results */}
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

              {/* Metric Cards */}
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

              {/* Compare with current plan */}
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
                  <span className="font-mono bg-stone-950 px-1.5 py-0.5 rounded text-amber-400/90 border border-stone-800 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    <span>{msg.model || effectiveActiveModel.label}</span>
                  </span>
                </div>
              )}

              {/* Message Body */}
              <div className="leading-relaxed text-stone-200">
                {msg.role === 'assistant' ? (
                  <FormattedMessage content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
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
                              Step {step.step_num}: {step.tool_calls?.map((tc) => tc.name).join(', ') || 'Reasoning'}
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

                            {step.tool_calls?.map((tc, tcIdx) => (
                              <div key={tcIdx} className="bg-stone-950 p-2 rounded border border-stone-800">
                                <div className="text-amber-400 font-semibold">
                                  tool: {tc.name}
                                </div>
                                <div className="text-stone-400">
                                  args: {JSON.stringify(tc.arguments)}
                                </div>
                                {step.tool_results?.[tcIdx] && (
                                  <div className="text-stone-500 mt-1 truncate">
                                    result: {JSON.stringify(step.tool_results[tcIdx])}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <span className="text-[10px] text-stone-500 px-2 font-mono">{msg.timestamp}</span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-stone-400 bg-stone-900/80 p-3 rounded-2xl border border-amber-950/80 w-fit">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="font-mono text-[11px]">Reasoning with farm world state...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    )}

    {/* Active AI Model Live Indication Bar */}
    <div className="px-3.5 py-1.5 bg-stone-900/90 border-t border-amber-950/80 flex items-center justify-between text-[11px] select-none">
      <div className="flex items-center space-x-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-stone-400 font-medium">Active AI Model:</span>
        <span className="font-mono font-bold text-emerald-300 bg-stone-950 px-2 py-0.5 rounded border border-emerald-700/60 shadow-inner">
          {effectiveActiveModel.label}
        </span>
        <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">
          ({effectiveActiveModel.providerLabel})
        </span>
      </div>
      <button
        type="button"
        onClick={() => setShowConfig(!showConfig)}
        className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center space-x-1"
      >
        <span>{showConfig ? 'Hide Settings' : 'Switch Model ▾'}</span>
      </button>
    </div>

    {/* Input Form Footer */}
    <div className="p-3 border-t border-stone-800 bg-stone-950">
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
          placeholder="Ask about crops, soil water, or what-if scenarios..."
          disabled={isLoading}
          className="flex-1 bg-stone-900 border border-amber-950/80 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600/80 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-stone-950 font-bold hover:from-amber-400 hover:to-amber-600 border border-amber-400/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  </>
  )}
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
