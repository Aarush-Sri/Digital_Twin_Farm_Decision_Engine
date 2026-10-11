import React from 'react';
import { useFarm } from '../../hooks/useFarm';
import { 
  Sparkles,
  LayoutTemplate
} from 'lucide-react';

export const Header = ({ onOpenAgentChat }) => {
  const { 
    loadPresetFarm,
    items,
    activeAiModel,
  } = useFarm();

  return (
    <header className="h-16 border-b border-stone-800/80 bg-stone-950/95 backdrop-blur-md px-6 flex items-center justify-between select-none z-30 shadow-lg">
      {/* Clean AI Brand Title: ONLY 'GreenTwin' */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
          <Sparkles className="w-4 h-4 fill-stone-950" />
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-200 font-sans">
          GreenTwin
        </h1>
      </div>

      {/* Right Controls: Only Preset Farm and AI */}
      <div className="flex items-center space-x-3">
        {/* Preset Farm Button */}
        <button
          type="button"
          onClick={() => {
            if (items.length === 0 || window.confirm('Load the GreenTwin farm layout? (This replaces current canvas items)')) {
              loadPresetFarm('model');
            }
          }}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-stone-300 border border-stone-800 hover:border-emerald-600/70 hover:text-emerald-300 hover:bg-stone-800 transition-all shadow-sm active:scale-95"
          title="Load pre-designed farm layout with crops, barn, canal & well"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-emerald-400" />
          <span>Preset Farm</span>
        </button>

        {/* Ask AI Agent Drawer Button with Active AI Model Indication */}
        <button
          type="button"
          onClick={onOpenAgentChat}
          className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 border-2 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.35)] hover:shadow-[0_0_20px_rgba(250,204,21,0.55)] transition-all active:scale-95"
          title={`Open AI Agronomist — Active Model: ${activeAiModel?.label || 'Llama 3.2'} (${activeAiModel?.providerLabel || 'Local Ollama'})`}
        >
          <Sparkles className="w-4 h-4 text-stone-950 group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide uppercase font-sans">⚡ Ask AI</span>

          {/* Active AI Model Badge with live status pulse */}
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-950 text-emerald-300 border border-stone-800 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{activeAiModel?.shortLabel || 'Llama 3.2'}</span>
          </span>
        </button>
      </div>
    </header>
  );
};
