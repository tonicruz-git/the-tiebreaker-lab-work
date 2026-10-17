import React, { useState } from 'react';
import { 
  Sparkles, Plus, Trash2, ArrowRight, Sliders, Shield, 
  TrendingUp, Heart, Zap, Compass, RefreshCw, AlertCircle
} from 'lucide-react';
import { DECISION_TEMPLATES, DecisionTemplate } from '../data/templates';

interface DecisionInputFormProps {
  onAnalyze: (payload: {
    dilemma: string;
    options: string[];
    criteria: string;
    context: string;
    perspective: string;
  }) => Promise<void>;
  isLoading: boolean;
  onSelectTemplate: (template: DecisionTemplate) => void;
}

export const DecisionInputForm: React.FC<DecisionInputFormProps> = ({
  onAnalyze,
  isLoading,
  onSelectTemplate,
}) => {
  const [dilemma, setDilemma] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [context, setContext] = useState('');
  const [criteria, setCriteria] = useState('');
  const [perspective, setPerspective] = useState('Balanced & Objective');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSuggestingOptions, setIsSuggestingOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const updated = options.filter((_, i) => i !== index);
      setOptions(updated);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSuggestOptions = async () => {
    if (!dilemma.trim()) {
      setErrorMessage('Please type your dilemma first so AI can suggest realistic options.');
      return;
    }
    setErrorMessage(null);
    setIsSuggestingOptions(true);
    try {
      const res = await fetch('/api/decision/suggest-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dilemma, context }),
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setOptions(data.suggestions.slice(0, 4));
      }
    } catch (e: any) {
      setErrorMessage('Could not auto-generate options right now. You can type them directly.');
    } finally {
      setIsSuggestingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dilemma.trim()) {
      setErrorMessage('Please enter the decision or dilemma you are facing.');
      return;
    }

    const filteredOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (filteredOptions.length === 1) {
      setErrorMessage('Please provide at least 2 distinct options to compare, or leave them empty to let AI formulate options.');
      return;
    }

    setErrorMessage(null);
    await onAnalyze({
      dilemma: dilemma.trim(),
      options: filteredOptions,
      criteria: criteria.trim(),
      context: context.trim(),
      perspective,
    });
  };

  const perspectiveOptions = [
    { label: 'Balanced & Objective', icon: Compass, desc: 'Unbiased risk-reward evaluation' },
    { label: 'Aggressive Growth', icon: TrendingUp, desc: 'Maximizing upside, optionality & scale' },
    { label: 'Defensive & Low Risk', icon: Shield, desc: 'Preserving stability & minimizing downside' },
    { label: 'Wellbeing & Happiness', icon: Heart, desc: 'Prioritizing stress reduction & quality of life' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-slate-700/60 text-slate-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Framework Decision Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Never get stuck in a <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
            deadlock again.
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          The Tiebreaker breaks through indecision with rigorous AI-driven Pros & Cons, weighted Comparison Matrices, SWOT quadrants, and group consensus voting.
        </p>

        {/* Quick Template pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick examples:</span>
          {DECISION_TEMPLATES.slice(0, 3).map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            >
              ⚡ {tpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Dilemma Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="dilemma" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>The Dilemma / Decision Question</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">Be as specific or raw as you want</span>
            </div>
            <textarea
              id="dilemma"
              rows={3}
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              placeholder="e.g. Should I accept the Founding Engineer offer at an early-stage startup or take the Senior Engineer promotion at my current Big Tech job?"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl p-4 text-white placeholder-slate-600 text-sm sm:text-base resize-none transition-all"
            />
          </div>

          {/* Options Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Options Being Compared</span>
                <span className="text-[11px] text-slate-500 font-normal">(Min 2, up to 4)</span>
              </label>

              <button
                type="button"
                onClick={handleSuggestOptions}
                disabled={isSuggestingOptions || !dilemma.trim()}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isSuggestingOptions ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Auto-Suggest Options</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`e.g. ${idx === 0 ? 'Founding Engineer at Startup' : idx === 1 ? 'Stay for Senior Promotion' : 'Explore alternative 3'}`}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 4 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors py-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add another option</span>
              </button>
            )}
          </div>

          {/* Perspective selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Strategic Lens
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {perspectiveOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = perspective === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPerspective(item.label)}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-snug">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced context & constraints toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showAdvanced ? 'Hide Constraints & Priorities' : 'Add Constraints, Priorities & Timeline (Optional)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Personal Context & Constraints
                  </label>
                  <textarea
                    rows={2}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. Savings: $40k, Risk tolerance: moderate, Partner is supportive, decision needed by Friday."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Must-Have Priorities & Weight Factors
                  </label>
                  <input
                    type="text"
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                    placeholder="e.g. Work-life balance (5/5), Long-term wealth (4/5), Low commute (5/5)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-500 p-0.5 font-bold text-white shadow-xl shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <div className="w-full bg-slate-950/20 group-hover:bg-transparent transition-colors py-4 px-6 rounded-[14px] flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                    <span className="text-base font-bold">Synthesizing Decision Matrix & Finding Tiebreaker...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-base font-bold">Analyze Decision & Reveal The Tiebreaker</span>
                    <ArrowRight className="w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
