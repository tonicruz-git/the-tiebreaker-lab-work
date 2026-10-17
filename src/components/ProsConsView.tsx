import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Sparkles, Plus, 
  Filter, ThumbsUp, Scale, Flame, ArrowUpRight
} from 'lucide-react';
import type { OptionAnalysis, ProConItem } from '../types/decision';

interface ProsConsViewProps {
  analyses: OptionAnalysis[];
  onAddArgument?: (optionId: string, item: Partial<ProConItem>) => void;
}

export const ProsConsView: React.FC<ProsConsViewProps> = ({ analyses, onAddArgument }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addingToOptionId, setAddingToOptionId] = useState<string | null>(null);
  const [newArgType, setNewArgType] = useState<'pro' | 'con'>('pro');
  const [newArgTitle, setNewArgTitle] = useState('');
  const [newArgDesc, setNewArgDesc] = useState('');
  const [newArgScore, setNewArgScore] = useState(3);
  const [newArgCategory, setNewArgCategory] = useState('Personal');

  // Extract all unique categories across options
  const allCategories = Array.from(
    new Set(
      analyses.flatMap((a) => [
        ...a.pros.map((p) => p.category),
        ...a.cons.map((c) => c.category),
      ])
    )
  );

  const handleAddSubmit = (optionId: string) => {
    if (!newArgTitle.trim()) return;
    if (onAddArgument) {
      onAddArgument(optionId, {
        type: newArgType,
        title: newArgTitle.trim(),
        description: newArgDesc.trim(),
        score: newArgScore,
        category: newArgCategory,
        author: 'You',
      });
    }
    setNewArgTitle('');
    setNewArgDesc('');
    setAddingToOptionId(null);
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400">Filter by Dimension:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Dimensions
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Impact ratings scaled from 1 (minor) to 5 (critical impact)
        </div>
      </div>

      {/* Grid of Options */}
      <div className={`grid grid-cols-1 ${analyses.length > 2 ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {analyses.map((analysis, index) => {
          const filteredPros = analysis.pros.filter(
            (p) => selectedCategory === 'all' || p.category === selectedCategory
          );
          const filteredCons = analysis.cons.filter(
            (c) => selectedCategory === 'all' || c.category === selectedCategory
          );

          const totalProScore = analysis.pros.reduce((acc, p) => acc + (p.score || 0), 0);
          const totalConScore = analysis.cons.reduce((acc, c) => acc + (c.score || 0), 0);
          const net = totalProScore - totalConScore;

          return (
            <div
              key={analysis.id || index}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              {/* Option Header & Score Banner */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {analysis.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {analysis.summary}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Net Balance
                    </span>
                    <span
                      className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                        net > 0
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : net < 0
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {net > 0 ? `+${net}` : net}
                    </span>
                  </div>
                </div>

                {/* Score Ratio Mini Bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span className="text-emerald-400">Pros (+{totalProScore})</span>
                    <span className="text-rose-400">Cons (-{totalConScore})</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${
                          totalProScore + totalConScore > 0
                            ? (totalProScore / (totalProScore + totalConScore)) * 100
                            : 50
                        }%`,
                      }}
                    />
                    <div
                      className="bg-rose-500 transition-all duration-500"
                      style={{
                        width: `${
                          totalProScore + totalConScore > 0
                            ? (totalConScore / (totalProScore + totalConScore)) * 100
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Pros List */}
                <div className="mb-5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Upsides & Pros ({filteredPros.length})</span>
                  </div>

                  <div className="space-y-2">
                    {filteredPros.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No pros in this category.</p>
                    ) : (
                      filteredPros.map((pro, pIdx) => (
                        <div
                          key={pro.id || pIdx}
                          className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-950/60 hover:border-emerald-800/60 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {pro.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                +{pro.score}
                              </span>
                            </div>
                          </div>

                          {pro.description && (
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {pro.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-900">
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full font-medium">
                              {pro.category}
                            </span>
                            {pro.isUnderrated && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                Underrated Perk
                              </span>
                            )}
                            {pro.author && (
                              <span className="text-[10px] text-indigo-400 italic">
                                by {pro.author}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cons List */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <XCircle className="w-4 h-4" />
                    <span>Downsides & Cons ({filteredCons.length})</span>
                  </div>

                  <div className="space-y-2">
                    {filteredCons.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No cons in this category.</p>
                    ) : (
                      filteredCons.map((con, cIdx) => (
                        <div
                          key={con.id || cIdx}
                          className="p-3 rounded-2xl bg-slate-950/70 border border-rose-950/60 hover:border-rose-800/60 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {con.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                -{con.score}
                              </span>
                            </div>
                          </div>

                          {con.description && (
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {con.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-900">
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full font-medium">
                              {con.category}
                            </span>
                            {con.isDealbreaker && (
                              <span className="flex items-center gap-1 text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                                Potential Dealbreaker
                              </span>
                            )}
                            {con.author && (
                              <span className="text-[10px] text-indigo-400 italic">
                                by {con.author}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Add Custom Argument to this Option */}
              <div className="pt-3 border-t border-slate-800/80">
                {addingToOptionId === analysis.id ? (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Add Point to {analysis.title}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setNewArgType('pro')}
                          className={`text-xs px-2 py-0.5 rounded font-bold transition-colors ${
                            newArgType === 'pro'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          + Pro
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewArgType('con')}
                          className={`text-xs px-2 py-0.5 rounded font-bold transition-colors ${
                            newArgType === 'con'
                              ? 'bg-rose-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          - Con
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Title / Key statement..."
                      value={newArgTitle}
                      onChange={(e) => setNewArgTitle(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />

                    <textarea
                      rows={2}
                      placeholder="Details / rationale..."
                      value={newArgDesc}
                      onChange={(e) => setNewArgDesc(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                    />

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">Impact (1-5):</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={newArgScore}
                          onChange={(e) => setNewArgScore(Number(e.target.value))}
                          className="w-16 accent-indigo-500"
                        />
                        <span className="text-slate-200 font-bold">{newArgScore}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAddingToOptionId(null)}
                          className="px-2 py-1 text-slate-400 hover:text-white rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSubmit(analysis.id)}
                          disabled={!newArgTitle.trim()}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded"
                        >
                          Add Point
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingToOptionId(analysis.id);
                      setNewArgTitle('');
                      setNewArgDesc('');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-400 hover:text-indigo-300 hover:bg-slate-800/50 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add custom Pro or Con to this option</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
