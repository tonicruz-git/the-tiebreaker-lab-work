import React, { useState } from 'react';
import { 
  ShieldCheck, AlertOctagon, Lightbulb, Flame, 
  Layers, ArrowRight
} from 'lucide-react';
import type { OptionAnalysis } from '../types/decision';

interface SwotAnalysisViewProps {
  analyses: OptionAnalysis[];
}

export const SwotAnalysisView: React.FC<SwotAnalysisViewProps> = ({ analyses }) => {
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  const currentAnalysis = analyses[activeOptionIndex] || analyses[0];
  const swot = currentAnalysis?.swot || {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };

  return (
    <div className="space-y-6">
      {/* Option Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Option for SWOT Quadrant:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {analyses.map((analysis, idx) => (
            <button
              key={analysis.id || idx}
              onClick={() => setActiveOptionIndex(idx)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeOptionIndex === idx
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="w-4 h-4 rounded bg-slate-950/40 flex items-center justify-center text-[10px]">
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{analysis.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SWOT Summary Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>SWOT Strategic Profile: {currentAnalysis?.title}</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal factors (Strengths & Weaknesses) vs External environment (Opportunities & Threats).
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
            {swot.strengths.length + swot.opportunities.length} Positive vs{' '}
            {swot.weaknesses.length + swot.threats.length} Risk Factors
          </span>
        </div>
      </div>

      {/* 2x2 SWOT Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* STRENGTHS (Internal Positive) */}
        <div className="bg-slate-900/90 border border-emerald-950/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Strengths</h4>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    Internal Advantage
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {swot.strengths.length}
              </span>
            </div>

            <ul className="space-y-2.5">
              {swot.strengths.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 border border-emerald-900/30 p-3 rounded-2xl leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800">
            How to leverage: Capitalize on these innate advantages to build compounding momentum.
          </p>
        </div>

        {/* WEAKNESSES (Internal Negative) */}
        <div className="bg-slate-900/90 border border-rose-950/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Weaknesses</h4>
                  <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
                    Internal Vulnerability
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                {swot.weaknesses.length}
              </span>
            </div>

            <ul className="space-y-2.5">
              {swot.weaknesses.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 border border-rose-900/30 p-3 rounded-2xl leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800">
            Mitigation rule: Acknowledge early and install explicit boundaries or safety nets.
          </p>
        </div>

        {/* OPPORTUNITIES (External Positive) */}
        <div className="bg-slate-900/90 border border-sky-950/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Opportunities</h4>
                  <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                    External Tailwinds
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                {swot.opportunities.length}
              </span>
            </div>

            <ul className="space-y-2.5">
              {swot.opportunities.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 border border-sky-900/30 p-3 rounded-2xl leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800">
            Strategic play: Potential doors this unlocks that might not be available otherwise.
          </p>
        </div>

        {/* THREATS (External Negative) */}
        <div className="bg-slate-900/90 border border-amber-950/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Threats</h4>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                    External Headwinds
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {swot.threats.length}
              </span>
            </div>

            <ul className="space-y-2.5">
              {swot.threats.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/60 border border-amber-900/30 p-3 rounded-2xl leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800">
            Pre-mortem check: Outside forces or competitive changes that could jeopardize success.
          </p>
        </div>
      </div>
    </div>
  );
};
