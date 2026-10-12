import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Droplets, 
  Settings2, 
  Zap, 
  Columns, 
  Sun, 
  CloudRain, 
  Thermometer,
  AlertCircle,
  ExternalLink,
  Sliders,
  Check,
  CornerDownLeft,
  ArrowRight,
  GripVertical,
  Maximize2,
  Minimize2,
  PanelRightClose
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { FormattedMessage } from './FormattedMessage';
import { ScenarioComparisonModal } from '../simulation/ScenarioComparisonModal';

const DEFAULT_PANEL_WIDTH = 540;
const MIN_PANEL_WIDTH = 380;
const MAX_PANEL_WIDTH = 1150;

const AI_PANEL_PRESETS = [
  { label: 'Standard', width: 540, title: 'Standard (540px)' },
  { label: 'Wide', width: 760, title: 'Wide (760px)' },
  { label: 'Expanded', width: 960, title: 'Expanded (960px)' },
];

const PRESET_SCENARIOS = [
  {
    id: 'drought',
    icon: Sun,
    title: '14-Day Drought Stress',
    subtitle: 'Rainfall deficit scenario',
    yieldDelta: '-12%',
    yieldDeltaPct: -12,
    waterDemand: 'Critical',
    predictSummary: 'Some crop areas may experience moisture stress if rainfall deficit continues and irrigation remains unchanged.',
    actions: [
      { title: 'Prioritize water-sensitive zones', desc: 'Focus irrigation on crops currently in flowering or grain filling stages.' },
      { title: 'Evaluate nocturnal drip scheduling', desc: 'Water during night hours to suppress evaporation losses by up to 25%.' }
    ]
  },
  {
    id: 'heavy_rainfall',
    icon: CloudRain,
    title: 'Heavy Rainfall & Saturation',
    subtitle: 'Excess precipitation test',
    yieldDelta: '-8%',
    yieldDeltaPct: -8,
    waterDemand: 'Saturated',
    predictSummary: 'Soil saturation exceeds 85%, increasing root hypoxia risks in low-lying beds and slowing nitrogen absorption.',
    actions: [
      { title: 'Elevate perimeter drainage', desc: 'Ensure water runoff flows freely to detention ponds and perimeter canals.' },
      { title: 'Inspect root zones', desc: 'Check susceptible root vegetables for waterlogging or fungal pathogens.' }
    ]
  },
  {
    id: 'heatwave',
    icon: Thermometer,
    title: 'Extreme Heatwave Wave',
    subtitle: 'High thermal flux >34°C',
    yieldDelta: '-15%',
    yieldDeltaPct: -15,
    waterDemand: 'Very High',
    predictSummary: 'Peak daytime temperatures trigger rapid stomatal closure and double crop evapotranspiration demand (ET₀ > 6.5 mm/day).',
    actions: [
      { title: 'Deploy tree windbreak shading', desc: 'Canopy buffers reduce ambient leaf temperatures by up to 3.2°C.' },
      { title: 'Increase irrigation frequency', desc: 'Split daily water applications into morning and evening cycles.' }
    ]
  },
  {
    id: 'irrigation_change',
    icon: Droplets,
    title: 'Targeted Drip Optimization',
    subtitle: 'Precision irrigation calibration',
    yieldDelta: '+18%',
    yieldDeltaPct: 18,
    waterDemand: 'Optimized',
    predictSummary: 'Targeted drip irrigation maintains soil moisture consistently inside the 60–75% field capacity band, accelerating vegetative growth.',
    actions: [
      { title: 'Expand drip canal layout', desc: 'Extend water lines adjacent to outer crop rows for uniform coverage.' },
      { title: 'Calibrate delivery volume', desc: 'Stabilize flow rate at 6.0 mm/day per active cultivation square meter.' }
    ]
  }
];



export const AgentChatDrawer = ({ isOpen, onClose }) => {
  const { 
    sendAgentChat, 
    farmName, 
    currentDay,
    farmStats,
    environment,
    aiProvider: contextAiProvider,
    setAiProvider: contextSetAiProvider,
    openaiModel: contextOpenAIModel,
    setOpenAIModel: contextSetOpenAIModel,
    openaiApiKey: contextOpenAIApiKey,
    setOpenAIApiKey: contextSetOpenAIApiKey,
    geminiModel: contextGeminiModel,
    setGeminiModel: contextSetGeminiModel,
    geminiSearchEnabled: contextGeminiSearchEnabled,
    setGeminiSearchEnabled: contextSetGeminiSearchEnabled,
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
      content: `Hello! I am your AI Agronomist & Decision Engine. I can answer agronomy questions, inspect farm conditions, calculate solar/water stress, and evaluate what-if scenarios for **${farmName || 'GreenTwin Model Farm'}**. What would you like to know?`,
      steps: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
  
  // Resizable AI Drawer Width
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('GREENTWIN_AI_PANEL_WIDTH');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_PANEL_WIDTH && parsed <= MAX_PANEL_WIDTH) {
          return parsed;
        }
      }
    }
    return DEFAULT_PANEL_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_AI_PANEL_WIDTH', String(panelWidth));
    }
  }, [panelWidth]);

  const startResizing = useCallback(() => {
    setIsResizing(true);

    const onPointerMove = (e) => {
      const currentX = e.clientX ?? (e.touches ? e.touches[0].clientX : null);
      if (currentX === null || typeof window === 'undefined') return;
      const calculatedWidth = window.innerWidth - currentX;
      const maxWidth = Math.min(MAX_PANEL_WIDTH, window.innerWidth - 30);
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(maxWidth, Math.round(calculatedWidth)));
      setPanelWidth(newWidth);
    };

    const onPointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    startResizing();
  };

  const handleTouchStart = (e) => {
    startResizing();
  };
  
  // AI Provider & Key Settings (synced with Context & localStorage)
  const [openaiApiKey, setOpenAIApiKey] = useState(() => {
    return contextOpenAIApiKey || (typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_OPENAI_KEY') || ''
      : '');
  });
  const [openaiModel, setOpenAIModel] = useState(() => {
    return contextOpenAIModel || (typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_OPENAI_MODEL') || 'gpt-4o-mini'
      : 'gpt-4o-mini');
  });
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
    if (contextGeminiModel && !['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].includes(contextGeminiModel)) return contextGeminiModel;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('GREENTWIN_GEMINI_MODEL') || localStorage.getItem('DIGIFARM_GEMINI_MODEL');
      if (saved && !['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].includes(saved)) return saved;
    }
    return 'gemini-3.7-flash';
  });
  const [localModel, setLocalModel] = useState(() => {
    return contextLocalModel || (typeof window !== 'undefined'
      ? localStorage.getItem('GREENTWIN_LOCAL_MODEL') || 'qwen3.5:latest'
      : 'qwen3.5:latest');
  });
  const [installedModels, setInstalledModels] = useState(['phi4-mini:latest', 'llama3.2:1b', 'qwen3.5:latest']);
  const [backendAgentStatus, setBackendAgentStatus] = useState(null);
  
  // Gemini Live Connection Testing States
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);
  const [testingAllGeminiModels, setTestingAllGeminiModels] = useState(false);
  const [geminiMultiModelResults, setGeminiMultiModelResults] = useState(null);

  const handleTestGeminiConnection = async (testAll = false) => {
    if (testAll) {
      setTestingAllGeminiModels(true);
      setGeminiMultiModelResults(null);
    } else {
      setTestingGemini(true);
      setGeminiTestResult(null);
    }

    try {
      const res = await apiClient.verifyGeminiKey({
        apiKey: apiKey ? apiKey.trim() : null,
        model: geminiModel,
        testAllModels: testAll,
      });
      if (testAll) {
        setGeminiMultiModelResults(res);
      } else {
        setGeminiTestResult(res);
      }
    } catch (err) {
      const errPayload = {
        valid: false,
        message: err.message || 'Connection test failed',
        error_type: 'network_error',
      };
      if (testAll) {
        setGeminiMultiModelResults(errPayload);
      } else {
        setGeminiTestResult(errPayload);
      }
    } finally {
      if (testAll) {
        setTestingAllGeminiModels(false);
      } else {
        setTestingGemini(false);
      }
    }
  };

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const saveOpenAIApiKey = (key) => {
    setOpenAIApiKey(key);
    if (contextSetOpenAIApiKey) contextSetOpenAIApiKey(key);
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('GREENTWIN_OPENAI_KEY', key.trim());
      } else {
        localStorage.removeItem('GREENTWIN_OPENAI_KEY');
      }
    }
  };

  const saveOpenAIModel = (mod) => {
    setOpenAIModel(mod);
    if (contextSetOpenAIModel) contextSetOpenAIModel(mod);
    if (typeof window !== 'undefined') {
      localStorage.setItem('GREENTWIN_OPENAI_MODEL', mod);
    }
  };

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
    }, 400);
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const activeModel = preferredProvider === 'openai' 
      ? openaiModel 
      : preferredProvider === 'gemini' 
        ? geminiModel 
        : localModel;

    const result = await sendAgentChat(promptToSend, historyPayload, 5, {
      preferredProvider,
      model: activeModel,
      openaiApiKey,
      openaiModel,
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        isError: true,
        content: result.error || 'Failed to communicate with AI Agronomist agent.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  // Check if last message was an OpenAI Quota Exhausted error
  const lastMessage = messages[messages.length - 1];
  const hasOpenAIQuotaError = lastMessage?.role === 'assistant' && 
    (lastMessage?.content?.includes('Quota Exhausted') || lastMessage?.content?.includes('credit_balance_exhausted') || lastMessage?.content?.includes('429'));

  // Active Provider & Model Label resolution
  const effectiveActiveModel = useMemo(() => {
    if (contextActiveAiModel) return contextActiveAiModel;
    const isOp = preferredProvider === 'openai';
    const isGem = preferredProvider === 'gemini';
    const isAuto = preferredProvider === 'auto';
    
    let label = 'Llama 3.2 (1B)';
    let shortLabel = 'Llama 3.2';
    let provLabel = 'Local Ollama';

    if (isOp) {
      label = openaiModel === 'gpt-4o-mini' ? 'GPT-4o mini' : openaiModel === 'gpt-4o' ? 'GPT-4o' : openaiModel;
      shortLabel = label;
      provLabel = 'OpenAI GPT';
    } else if (isGem) {
      label = geminiModel.replace('gemini-', 'Gemini ');
      shortLabel = label;
      provLabel = 'Google Gemini';
    } else if (isAuto) {
      label = 'Auto Cascade (GPT / Gemini / Llama)';
      shortLabel = 'Auto Cascade';
      provLabel = 'Auto Cascade';
    } else {
      if (localModel.includes('phi4') || localModel.includes('phi-4')) {
        label = 'Phi-4 Mini';
        shortLabel = 'Phi-4 Mini';
      } else if (localModel.includes('1b')) {
        label = 'Llama 3.2 (1B)';
        shortLabel = 'Llama 3.2';
      } else if (localModel.includes('qwen')) {
        label = 'Qwen 3.5';
        shortLabel = 'Qwen 3.5';
      } else {
        label = localModel;
        shortLabel = localModel.split(':')[0];
      }
      provLabel = 'Local Ollama';
    }

    return {
      label,
      shortLabel,
      providerLabel: provLabel,
      isLocal: !isOp && !isGem,
    };
  }, [contextActiveAiModel, preferredProvider, openaiModel, geminiModel, localModel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Slide-over backdrop & main container */}
      <div 
        style={{ width: `${panelWidth}px`, maxWidth: '100vw' }}
        className={`fixed inset-y-0 right-0 bg-[#0c0d10] text-stone-200 border-l border-white/[0.08] shadow-[-24px_0_60px_rgba(0,0,0,0.92)] z-50 flex flex-col select-text overflow-hidden font-sans ${
          isResizing ? 'transition-none select-none' : 'transition-[width] duration-200 ease-out'
        }`}
      >
        
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-60 h-60 bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none" />

        {/* Left Draggable Resize Handle */}
        <div
          role="separator"
          aria-label="Resize AI Panel"
          aria-orientation="vertical"
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={() => setPanelWidth(DEFAULT_PANEL_WIDTH)}
          title="Drag to resize AI panel • Double-click to reset (540px)"
          className={`absolute top-0 -left-1.5 bottom-0 w-3 cursor-col-resize z-40 group flex items-center justify-center select-none ${
            isResizing ? 'bg-emerald-500/20' : 'hover:bg-emerald-500/10'
          }`}
        >
          <div
            className={`w-1 rounded-full transition-all flex flex-col items-center justify-center ${
              isResizing
                ? 'h-24 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                : 'h-12 bg-stone-700/60 group-hover:h-20 group-hover:bg-emerald-400/80'
            }`}
          >
            <GripVertical className="w-2.5 h-2.5 text-stone-950 opacity-80" />
          </div>

          {/* Live width tooltip badge while dragging */}
          {isResizing && (
            <div className="absolute top-1/2 -translate-y-1/2 right-4 px-2 py-1 rounded-md bg-stone-950 border border-emerald-500/70 text-emerald-300 font-mono text-[10px] shadow-xl pointer-events-none whitespace-nowrap z-50">
              {panelWidth}px
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* HEADER: Intentional, Clean, High-Tech Copilot Bar */}
        {/* ======================================================== */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#0c0d10]/95 backdrop-blur-md flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              {showConfig ? <Settings2 className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-stone-100 tracking-tight">
                  {showConfig ? 'AI Settings & Models' : 'AI Agronomist'}
                </h3>
                {/* Collapse button on the side of AI Agronomist title */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] transition-colors"
                  title="Collapse AI Panel"
                  aria-label="Collapse AI Panel"
                >
                  <PanelRightClose className="w-3.5 h-3.5 text-stone-400 hover:text-emerald-300" />
                </button>
                {/* Active AI Model Pill with Live Status Pulse */}
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-900/60 transition-all cursor-pointer shadow-sm group"
                  title="Click to switch AI Model or Provider"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                  </span>
                  <span>Active AI Model: {effectiveActiveModel.label}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-emerald-400/80 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5 font-sans">
                {showConfig ? 'Select neural weights, cloud engines, and API keys' : `Autonomous Digital Twin Advisor • ${farmName || 'GreenTwin Farm'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Quick Size Presets */}
            <div className="hidden sm:flex items-center space-x-0.5 bg-stone-900/90 rounded-lg p-0.5 border border-white/[0.08] mr-1">
              {AI_PANEL_PRESETS.map((p) => {
                const isSelected = Math.abs(panelWidth - p.width) < 25;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPanelWidth(p.width)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                    title={p.title}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Expand / Standard Toggle */}
            <button
              type="button"
              onClick={() => setPanelWidth(panelWidth >= 740 ? DEFAULT_PANEL_WIDTH : 780)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] transition-all hidden sm:flex"
              title={panelWidth >= 740 ? 'Restore standard width (540px)' : 'Expand to wide view (780px)'}
              aria-label="Toggle width"
            >
              {panelWidth >= 740 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl text-xs font-semibold transition-all border flex items-center space-x-1.5 ${
                showConfig
                  ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/50 shadow-sm' 
                  : 'text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] border-transparent'
              }`}
              title={showConfig ? 'Done / Return to Chat' : 'Settings'}
              aria-label="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] transition-all"
              title="Close Panel"
              aria-label="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>



        {/* ======================================================== */}
        {/* PROACTIVE QUOTA OR KEY ALERT BANNER */}
        {/* ======================================================== */}
        {preferredProvider === 'openai' && hasOpenAIQuotaError && !showConfig && (
          <div className="mx-4 mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2 shrink-0 animate-in fade-in duration-200 shadow-md">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block text-amber-100 font-semibold">OpenAI Credit Balance Exhausted</strong>
                <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                  Your OpenAI key returned HTTP 429 because its account balance is $0.00. You can switch to Google Gemini for instant free responses, or add credits at OpenAI.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1 pl-6">
              <button
                type="button"
                onClick={() => savePreferredProvider('gemini')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-[11px] transition-all flex items-center space-x-1 shadow-sm active:scale-95"
              >
                <Zap className="w-3 h-3 text-stone-950" />
                <span>Switch to Gemini Flash (Free)</span>
              </button>
              <a
                href="https://platform.openai.com/settings/organization/billing/"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-850 text-stone-300 text-[11px] font-medium border border-stone-800 transition-all flex items-center space-x-1"
              >
                <span>Billing</span>
                <ExternalLink className="w-3 h-3 text-stone-500" />
              </a>
            </div>
          </div>
        )}

        {/* Missing API key warning banner */}
        {preferredProvider === 'openai' && !openaiApiKey.trim() && !showConfig && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 bg-stone-900/90 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-200 shrink-0 shadow-sm">
            <span className="flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px]">OpenAI key missing. Paste your key to use {openaiModel}.</span>
            </span>
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="text-[10px] font-bold text-amber-200 bg-amber-950/80 hover:bg-amber-900 px-2.5 py-1 rounded-lg border border-amber-500/50 transition-colors"
            >
              Enter Key
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: DEDICATED AI SETTINGS VIEW */}
        {/* ======================================================== */}
        {showConfig ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-stone-300">
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="font-bold text-stone-100 flex items-center space-x-2 text-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>AI Engine & Model Selection</span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono">Llama • Qwen • Gemini • GPT</span>
            </div>

            {/* Active AI Model Status Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-stone-900/60 to-emerald-950/30 border border-emerald-500/40 shadow-inner flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-emerald-200 flex items-center space-x-2">
                    <span className="text-stone-400 font-normal">Active AI Model:</span>
                    <span className="font-mono text-emerald-300 font-bold bg-[#0c0d10] px-2 py-0.5 rounded border border-emerald-500/30">
                      {effectiveActiveModel.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1 font-mono">
                    Provider: <strong className="text-emerald-400">{effectiveActiveModel.providerLabel}</strong>
                    <span className="text-stone-600 mx-1.5">•</span>
                    <span>{effectiveActiveModel.isLocal ? 'Local Neural Weights (Ollama)' : 'Cloud Intelligence API'}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ONLINE
              </span>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2 p-4 rounded-2xl bg-stone-900/50 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-200">Preferred AI Provider:</label>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  {preferredProvider}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                {[
                  { id: 'auto', label: 'Auto', badge: 'Smart' },
                  { id: 'openai', label: 'OpenAI GPT', badge: 'Cloud' },
                  { id: 'gemini', label: 'Gemini', badge: 'Free' },
                  { id: 'ollama', label: 'Ollama', badge: 'Local' }
                ].map((prov) => {
                  const isSelected = preferredProvider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => savePreferredProvider(prov.id)}
                      className={`py-2.5 px-2 rounded-xl border transition-all flex flex-col items-center justify-center space-y-1 relative ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold shadow-sm'
                          : 'bg-[#0c0d10] border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      <span className="font-sans text-xs">{prov.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'text-stone-500'}`}>
                        {prov.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OpenAI GPT Cloud Settings */}
            {(preferredProvider === 'openai' || preferredProvider === 'auto') && (
              <div className="space-y-3 p-4 rounded-2xl bg-stone-900/50 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-200">OpenAI GPT Configuration</span>
                  <select
                    value={openaiModel}
                    onChange={(e) => saveOpenAIModel(e.target.value)}
                    className="bg-[#0c0d10] border border-stone-800 text-emerald-300 text-xs rounded-lg px-2.5 py-1 font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                    <option value="gpt-4o">gpt-4o (Flagship Multimodal)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="o1-mini">o1-mini (Reasoning)</option>
                    <option value="o3-mini">o3-mini (Reasoning)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => saveOpenAIApiKey(e.target.value)}
                    placeholder="sk-... (leave blank to inherit from backend .env)"
                    className="w-full bg-[#0c0d10] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                  <p className="text-[10px] text-stone-500">
                    API keys are securely persisted in your local browser workspace.
                  </p>
                </div>
              </div>
            )}

            {/* Google Gemini Settings */}
            {(preferredProvider === 'gemini' || preferredProvider === 'auto') && (
              <div className="space-y-3.5 p-4 rounded-2xl bg-stone-900/50 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-200">Google Gemini Configuration</span>
                  <select
                    value={geminiModel}
                    onChange={(e) => saveGeminiModel(e.target.value)}
                    className="bg-[#0c0d10] border border-stone-800 text-amber-300 text-xs rounded-lg px-2.5 py-1 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="gemini-3.7-flash">gemini-3.7-flash (Recommended & Verified)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest (Auto Latest Flash)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Stable)</option>
                    <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Lightweight)</option>
                    <option value="gemini-3.8-flash">gemini-3.8-flash (High Throughput)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-stone-400">Gemini API Key:</label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                    >
                      <span>Get free key at Google AI Studio</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to inherit from backend .env)"
                    className="w-full bg-[#0c0d10] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  />
                  <p className="text-[10px] text-stone-500">
                    Official Google AI Studio keys start with <span className="font-mono text-stone-400">AIzaSy...</span>. Backend environment key is used if blank.
                  </p>
                </div>

                {/* Connection & Model Testing Actions */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={testingGemini || testingAllGeminiModels}
                    onClick={() => handleTestGeminiConnection(false)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-medium transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                  >
                    {testingGemini ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                        <span>Testing {geminiModel}...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Test Selected ({geminiModel})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={testingGemini || testingAllGeminiModels}
                    onClick={() => handleTestGeminiConnection(true)}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-[11px] font-mono transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                    title="Probe latency and reachability across gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro"
                  >
                    {testingAllGeminiModels ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-stone-400" />
                        <span>Testing All Models...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Test Diff Models</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Single Model Test Result Banner */}
                {geminiTestResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs space-y-1 animate-in fade-in duration-200 border ${
                      geminiTestResult.valid
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-semibold text-[11px]">
                      {geminiTestResult.valid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Gemini API Verified ({geminiTestResult.model})</span>
                          {geminiTestResult.latency_ms && (
                            <span className="text-[10px] font-mono text-emerald-400 ml-auto bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              {geminiTestResult.latency_ms}ms
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Gemini Connection Issue</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-300 leading-snug">
                      {geminiTestResult.message}
                    </p>
                  </div>
                )}

                {/* Multi-Model Test Results Grid */}
                {geminiMultiModelResults && (
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
                      <span>Multi-Model Verification Summary:</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${geminiMultiModelResults.valid ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'}`}>
                        {geminiMultiModelResults.valid ? 'ACTIVE' : 'FAILED'}
                      </span>
                    </div>
                    {geminiMultiModelResults.results ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {geminiMultiModelResults.results.map((res, idx) => (
                          <div
                            key={res.model || idx}
                            className={`p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between ${
                              res.valid
                                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                                : 'bg-stone-900 border-stone-800 text-stone-400'
                            }`}
                          >
                            <span className="font-bold">{res.model}</span>
                            <span className="flex items-center space-x-1">
                              {res.valid ? (
                                <>
                                  <span className="text-emerald-400 font-bold">{res.latency_ms}ms</span>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                </>
                              ) : (
                                <span className="text-rose-400 text-[9px]">{res.error_type || 'error'}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-rose-300">{geminiMultiModelResults.message}</p>
                    )}
                  </div>
                )}

                {/* Google Search Grounding Toggle */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-stone-200 block">
                      Google Search Grounding
                    </label>
                    <p className="text-[10px] text-stone-500">
                      Ground Gemini responses with live real-time agronomic web search
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (contextSetGeminiSearchEnabled) {
                        contextSetGeminiSearchEnabled(!contextGeminiSearchEnabled);
                      }
                    }}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      contextGeminiSearchEnabled ? 'bg-amber-500' : 'bg-stone-800'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 bg-stone-950 rounded-full transition-transform absolute top-0.5 left-0.5 ${
                        contextGeminiSearchEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Local Ollama Model Picker */}
            {(preferredProvider === 'ollama' || preferredProvider === 'auto') && (
              <div className="space-y-3 p-4 rounded-2xl bg-stone-900/50 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-200">Local Neural Weights (Ollama)</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {localModel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => saveLocalModel('phi4-mini:latest')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-mono border transition-all flex flex-col items-center justify-center space-y-1 ${
                      localModel.includes('phi4') || localModel.includes('phi-4')
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-[#0c0d10] border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Phi-4 Mini</span>
                    </div>
                    {(localModel.includes('phi4') || localModel.includes('phi-4')) ? (
                      <span className="text-[9px] text-emerald-400 font-sans font-bold flex items-center space-x-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-stone-500 font-sans">3.8B Model</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveLocalModel('llama3.2:1b')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-mono border transition-all flex flex-col items-center justify-center space-y-1 ${
                      localModel.includes('1b') || localModel.includes('3.2')
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-[#0c0d10] border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Llama 3.2</span>
                    </div>
                    {(localModel.includes('1b') || localModel.includes('3.2')) ? (
                      <span className="text-[9px] text-emerald-400 font-sans font-bold flex items-center space-x-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-stone-500 font-sans">1.2B Fast</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveLocalModel('qwen3.5:latest')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-mono border transition-all flex flex-col items-center justify-center space-y-1 ${
                      localModel.includes('qwen')
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-[#0c0d10] border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Cpu className="w-3.5 h-3.5 text-teal-400" />
                      <span>Qwen 3.5</span>
                    </div>
                    {localModel.includes('qwen') ? (
                      <span className="text-[9px] text-emerald-400 font-sans font-bold flex items-center space-x-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-stone-500 font-sans">Reasoning</span>
                    )}
                  </button>
                </div>
                {installedModels.length > 2 && (
                  <select
                    value={localModel}
                    onChange={(e) => saveLocalModel(e.target.value)}
                    className="w-full bg-[#0c0d10] border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 font-mono focus:border-stone-600 focus:outline-none"
                  >
                    {installedModels.map((m) => (
                      <option key={m} value={m}>{m} {m === localModel ? '(Active)' : ''}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Done & Return to Chat */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all active:scale-98 flex items-center justify-center space-x-2"
              >
                <span>Done & Return to Chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* SEGMENTED TAB NAVIGATION: Intentional Pill Control */}
            {/* ======================================================== */}
            <div className="px-5 pt-3 pb-1 shrink-0">
              <div className="p-1 bg-stone-900/80 rounded-xl border border-white/[0.08] flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('scenarios')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center space-x-2 ${
                    activeTab === 'scenarios'
                      ? 'bg-[#1a1c22] text-stone-100 shadow-sm border border-white/[0.08]'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulation Panel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center space-x-2 ${
                    activeTab === 'chat'
                      ? 'bg-[#1a1c22] text-stone-100 shadow-sm border border-white/[0.08]'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chat ({Math.max(0, messages.length - 1)})</span>
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* TAB VIEW 1: WHAT-IF SIMULATION SCENARIO PANEL */}
            {/* ======================================================== */}
            {activeTab === 'scenarios' && (
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-stone-100">
                    What would you like to test on your farm?
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Select an environmental condition to run an instant digital twin stress simulation:
                  </p>
                </div>

                {/* 4 Interactive Scenario Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {PRESET_SCENARIOS.map((sc) => {
                    const IconComp = sc.icon;
                    const isSelected = selectedScenario?.id === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleRunScenario(sc)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group shadow-sm ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                            : 'bg-stone-900/60 hover:bg-stone-900 border-white/[0.06] hover:border-amber-500/40'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-105 transition-transform">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-bold text-stone-100 group-hover:text-amber-200 transition-colors">
                          {sc.title}
                        </h5>
                        <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                          {sc.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Simulation Loader */}
                {isSimulating && (
                  <div className="p-4 rounded-2xl bg-stone-900/80 border border-amber-500/30 flex items-center space-x-3 animate-pulse">
                    <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-200">Simulating Microclimate & Hydrodynamics...</p>
                      <p className="text-[10px] text-stone-400 font-mono">Calculating Penman-Monteith ET₀ & soil field capacity</p>
                    </div>
                  </div>
                )}

                {/* Scenario Results View */}
                {selectedScenario && !isSimulating && (
                  <div className="p-4 rounded-2xl bg-stone-900/70 border border-white/[0.1] shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <div>
                        <h4 className="text-xs font-bold text-stone-100">
                          Simulation Results: {selectedScenario.title}
                        </h4>
                        <p className="text-[10px] text-stone-400">
                          {selectedScenario.subtitle}
                        </p>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Illustrative model
                      </span>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] space-y-0.5">
                        <span className="text-[10px] text-stone-400 block font-sans">Estimated yield change</span>
                        <span className={`text-2xl font-black font-mono ${selectedScenario.yieldDeltaPct < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {selectedScenario.yieldDelta}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0c0d10] border border-white/[0.06] space-y-0.5">
                        <span className="text-[10px] text-stone-400 block font-sans">Water demand</span>
                        <span className="text-2xl font-black font-mono text-sky-400">
                          {selectedScenario.waterDemand}
                        </span>
                      </div>
                    </div>

                    {/* What the model predicts */}
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold text-amber-200">
                        What the model predicts
                      </h5>
                      <p className="text-xs text-stone-300 leading-relaxed bg-[#0c0d10] p-3 rounded-xl border border-white/[0.06]">
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
                          <div key={i} className="flex items-start space-x-2 text-xs text-stone-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                              <strong className="text-stone-200 block">{act.title}</strong>
                              <span className="text-stone-400 text-[11px]">{act.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comparison Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowComparisonModal(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
                      >
                        <Columns className="w-4 h-4 text-stone-950" />
                        <span>Compare with current plan</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB VIEW 2: MULTI-TURN CONVERSATIONAL ADVISORY CHAT */}
            {/* ======================================================== */}
            {activeTab === 'chat' && (
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 text-xs">
                


                {/* Messages stream */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1.5 ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-50 rounded-tr-sm shadow-sm'
                          : msg.isError
                          ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-tl-sm'
                          : 'bg-stone-900/60 border border-white/[0.08] text-stone-200 rounded-tl-sm shadow-md'
                      }`}
                    >
                      {/* Assistant Header */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.06] text-[10px]">
                          <span className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Agronomist Decision Engine</span>
                          </span>
                          <span className="font-mono bg-[#0c0d10] px-2 py-0.5 rounded text-stone-400 border border-white/[0.06] flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                            <span>{msg.model || effectiveActiveModel.label}</span>
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="leading-relaxed text-stone-200">
                        {msg.role === 'assistant' ? (
                          <FormattedMessage content={msg.content} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>

                      {/* Multi-step Reasoning Trace Accordion */}
                      {msg.steps && msg.steps.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-2">
                          <div className="text-[10px] uppercase tracking-wider font-mono text-emerald-400/90 flex items-center space-x-1.5">
                            <Terminal className="w-3 h-3" />
                            <span>Simulation Trace Steps ({msg.steps.length})</span>
                          </div>

                          {msg.steps.map((step, idx) => {
                            const stepKey = `${msg.id}-step-${idx}`;
                            const isExpanded = expandedSteps[stepKey];

                            return (
                              <div
                                key={stepKey}
                                className="rounded-xl bg-[#0c0d10] border border-white/[0.06] overflow-hidden text-[11px]"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleStepAccordion(stepKey)}
                                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                                    )}
                                    <span className="font-mono text-stone-300">
                                      Step {step.step_num}: {step.tool_calls?.map((tc) => tc.name).join(', ') || 'Reasoning'}
                                    </span>
                                  </div>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                </button>

                                {isExpanded && (
                                  <div className="p-3 border-t border-white/[0.06] bg-stone-900/30 space-y-2 font-mono text-[10px]">
                                    {step.thought && (
                                      <div className="text-stone-400 italic">
                                        <span className="text-stone-500 font-sans">Thought: </span>
                                        {step.thought}
                                      </div>
                                    )}
                                    {step.tool_calls?.map((tc, tcIdx) => (
                                      <div key={tcIdx} className="bg-[#0c0d10] p-2.5 rounded-lg border border-white/[0.05]">
                                        <div className="text-emerald-400 font-semibold">
                                          tool: {tc.name}
                                        </div>
                                        <div className="text-stone-400 mt-0.5">
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

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-2.5 text-stone-300 bg-stone-900/70 p-3 rounded-2xl border border-white/[0.08] w-fit shadow-md animate-pulse">
                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="font-mono text-xs">Reasoning with digital twin world state...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* ======================================================== */}
            {/* INPUT FORM FOOTER: Modern Copilot Prompt Bar */}
            {/* ======================================================== */}
            <div className="p-3.5 bg-[#0c0d10] border-t border-white/[0.08] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="bg-stone-900/90 border border-white/[0.1] rounded-2xl p-2.5 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all shadow-inner"
              >
                <div className="flex items-center space-x-2">
                  <input
                    ref={textareaRef}
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Ask about crops, soil water, or what-if scenarios..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-0 px-2 py-1 text-xs text-stone-100 placeholder-stone-500 focus:outline-none disabled:opacity-50 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isLoading}
                    className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-stone-950 font-bold hover:from-emerald-400 hover:to-teal-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.25)] active:scale-95"
                    title="Send Message (Enter)"
                    aria-label="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Prompt bar footer metadata */}
                <div className="mt-1.5 pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-stone-500 font-mono px-1">
                  <button
                    type="button"
                    onClick={() => setShowConfig(true)}
                    className="hover:text-emerald-300 transition-colors flex items-center space-x-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{effectiveActiveModel.shortLabel}</span>
                  </button>
                  <span>Press ↵ to send</span>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Global dragging overlay */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
      )}

      {/* Scenario Comparison Modal */}
      <ScenarioComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        scenarioData={selectedScenario}
      />
    </>
  );
};
