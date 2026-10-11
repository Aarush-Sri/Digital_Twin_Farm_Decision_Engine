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
  Scale
} from 'lucide-react';

export const AgentChatDrawer = ({ isOpen, onClose }) => {
  const { sendAgentChat, backendStatus, farmName, currentDay } = useFarm();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your AI Agronomist & Decision Engine. I can answer any agronomy or farming questions, inspect farm conditions, calculate solar/water stress, and evaluate what-if scenarios for **${farmName}**. What would you like to know?`,
      steps: [],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('DIGIFARM_GEMINI_KEY') || '' : '';
  });
  const [ollamaModel, setOllamaModel] = useState(null);
  const messagesEndRef = useRef(null);

  const saveApiKey = (key) => {
    setApiKey(key);
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('DIGIFARM_GEMINI_KEY', key.trim());
      } else {
        localStorage.removeItem('DIGIFARM_GEMINI_KEY');
      }
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
      if (!apiKey && typeof window !== 'undefined') {
        const fetchTags = async () => {
          try {
            let res = await fetch('/ollama/api/tags').catch(() => null);
            if (!res || !res.ok) {
              res = await fetch('http://localhost:11434/api/tags').catch(() => null);
            }
            if (res && res.ok) {
              const data = await res.json();
              if (data?.models && data.models.length > 0) {
                setOllamaModel(data.models[0].name);
                return;
              }
            }
            setOllamaModel(null);
          } catch {
            setOllamaModel(null);
          }
        };
        fetchTags();
      }
    }
  }, [messages, isOpen, apiKey]);

  const handleSend = async (customPrompt) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isLoading) return;

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

    // Format chat history for API
    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await sendAgentChat(promptToSend, historyPayload);

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

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-l-2 border-amber-800/80 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-amber-950/80 flex items-center justify-between bg-stone-950/90 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400 flex items-center justify-center text-amber-100 shadow-md">
            <Bot className="w-5 h-5 drop-shadow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-amber-200 tracking-wide font-sans">
                AI Agronomist
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/70 shadow-sm">
                {apiKey ? 'Gemini Live' : ollamaModel ? `Ollama (${ollamaModel})` : 'Twin Engine'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {apiKey 
                ? 'Connected to Google Gemini' 
                : ollamaModel 
                ? `Local AI model (${ollamaModel}) active` 
                : 'Simulating farm plot what-if scenarios'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`p-2 rounded-lg text-xs transition-all border ${
              apiKey 
                ? 'text-amber-300 bg-amber-950/70 border-amber-600/80' 
                : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800 border-stone-800'
            }`}
            title="Configure Gemini API Key"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-200 hover:bg-stone-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional Gemini API Key Drawer Input */}
      {showKeyInput && (
        <div className="p-3 bg-stone-900 border-b border-amber-950 text-xs space-y-2">
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
          <p className="text-[10px] text-stone-400">
            Stored locally in your browser. Allows you to ask completely arbitrary questions with live Gemini reasoning.
          </p>
        </div>
      )}

      {/* Suggested Quick Prompts (RPG Quest / What-If Scenarios) */}
      <div className="px-3.5 py-2.5 bg-stone-950/80 border-b border-amber-950/80 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
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
          <span>☀️ 14-Day Drought</span>
        </button>
        <button
          onClick={() => handleSend('What if heavy rainfall / flooding occurs?')}
          className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-950/70 text-sky-200 hover:bg-sky-900 border border-sky-700/60 transition-all shadow-sm"
        >
          <Droplets className="w-3 h-3 text-sky-400" />
          <span>🌧️ Flood Scenario</span>
        </button>
        <button
          onClick={() => handleSend('Calculate my harvest yield and compare wheat vs carrots')}
          className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-yellow-950/70 text-yellow-200 hover:bg-yellow-900 border border-yellow-700/60 transition-all shadow-sm"
        >
          <Scale className="w-3 h-3 text-yellow-400" />
          <span>🌾 Yield & Comparison</span>
        </button>
      </div>

      {/* Messages Feed */}
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
              <div className="whitespace-pre-wrap leading-relaxed text-stone-200">
                {msg.content}
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

      {/* Input Box */}
      <div className="p-4 border-t border-amber-950 bg-stone-950/90">
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
            placeholder="Ask about what-if events, drought, yields, layout..."
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
  );
};
