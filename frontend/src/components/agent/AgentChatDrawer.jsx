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
  Sprout
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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-zinc-100">AI Agronomist</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                {apiKey ? 'Gemini Live' : ollamaModel ? `Ollama (${ollamaModel})` : 'Built-in'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {apiKey 
                ? 'Connected to Google Gemini' 
                : ollamaModel 
                ? `Local AI model (${ollamaModel}) active` 
                : 'Real-time farm twin intelligence'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`p-1.5 rounded-lg text-xs transition-all border ${
              apiKey 
                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-700/60' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border-zinc-800'
            }`}
            title="Configure Gemini API Key"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional Gemini API Key Drawer Input */}
      {showKeyInput && (
        <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Google Gemini API Key</span>
            <span className="text-[10px] text-zinc-400">Optional for full open-ended AI</span>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="Paste your Gemini API Key here (starts with AIza...)"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[10px] text-zinc-500">
            Stored locally in your browser. Allows you to ask completely arbitrary questions with live Gemini reasoning.
          </p>
        </div>
      )}

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
        <button
          onClick={() => handleSend('Inspect current crop health and soil moisture')}
          className="flex-shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-300 hover:bg-emerald-950 hover:text-emerald-300 border border-zinc-700/60 transition-all"
        >
          <Sprout className="w-3 h-3 text-emerald-400" />
          <span>Health Check</span>
        </button>
        <button
          onClick={() => handleSend('Optimize irrigation rate for all crops')}
          className="flex-shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-300 hover:bg-sky-950 hover:text-sky-300 border border-zinc-700/60 transition-all"
        >
          <Droplets className="w-3 h-3 text-sky-400" />
          <span>Optimize Irrigation</span>
        </button>
        <button
          onClick={() => handleSend('Simulate a 14-day drought scenario and compare results')}
          className="flex-shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-300 hover:bg-amber-950 hover:text-amber-300 border border-zinc-700/60 transition-all"
        >
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Drought Stress Test</span>
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
                  ? 'bg-emerald-600 text-zinc-50 rounded-tr-sm shadow-md'
                  : msg.isError
                  ? 'bg-red-950/80 border border-red-800 text-red-200 rounded-tl-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm shadow-sm'
              }`}
            >
              {/* Agent Badge & Meta */}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between mb-2 text-[10px] text-zinc-400 pb-1.5 border-b border-zinc-800">
                  <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>Agronomist</span>
                  </span>
                  {msg.model && (
                    <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                      {msg.model}
                    </span>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>

              {/* Multi-step Execution Steps Accordion */}
              {msg.steps && msg.steps.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 flex items-center space-x-1">
                    <Terminal className="w-3 h-3 text-zinc-400" />
                    <span>Deliberation Steps ({msg.steps.length})</span>
                  </div>

                  {msg.steps.map((step, idx) => {
                    const stepKey = `${msg.id}-step-${idx}`;
                    const isExpanded = expandedSteps[stepKey];

                    return (
                      <div
                        key={stepKey}
                        className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 overflow-hidden text-[11px]"
                      >
                        <button
                          onClick={() => toggleStepAccordion(stepKey)}
                          className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center space-x-1.5">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                            <span className="font-mono text-zinc-300">
                              Step {step.step_num}: {step.tool_calls?.map((tc) => tc.name).join(', ') || 'Reasoning'}
                            </span>
                          </div>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        {isExpanded && (
                          <div className="p-2.5 border-t border-zinc-800/60 bg-zinc-900/40 space-y-2 font-mono text-[10px]">
                            {step.thought && (
                              <div className="text-zinc-400 italic">
                                <span className="text-zinc-500 font-sans">Thought: </span>
                                {step.thought}
                              </div>
                            )}

                            {step.tool_calls?.map((tc, tcIdx) => (
                              <div key={tcIdx} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                                <div className="text-emerald-400 font-semibold">
                                  tool: {tc.name}
                                </div>
                                <div className="text-zinc-400">
                                  args: {JSON.stringify(tc.arguments)}
                                </div>
                                {step.tool_results?.[tcIdx] && (
                                  <div className="text-zinc-500 mt-1 truncate">
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

            <span className="text-[10px] text-zinc-500 px-1 font-mono">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2 text-zinc-400 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 w-fit">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <p className="font-semibold text-zinc-200">AI Agent is thinking & evaluating tools...</p>
              <p className="text-[10px] text-zinc-500 font-mono">
                Inspecting farm sensors and running multi-step logic
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/60">
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
            placeholder="Ask agent to inspect, irrigate, or simulate..."
            disabled={isLoading}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 rounded-xl bg-emerald-600 text-zinc-100 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
