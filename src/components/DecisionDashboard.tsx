import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, CheckCircle2, AlertTriangle, Eye, Brain, Compass, 
  Share2, Users, Download, Flame, ListChecks, Table, 
  Grid2X2, ArrowRight, Check, Sparkles
} from 'lucide-react';
import type { DecisionData, ProConItem } from '../types/decision';
import { ProsConsView } from './ProsConsView';
import { ComparisonMatrixView } from './ComparisonMatrixView';
import { SwotAnalysisView } from './SwotAnalysisView';
import { DevilsAdvocateModal } from './DevilsAdvocateModal';

interface DecisionDashboardProps {
  decisionData: DecisionData;
  onCreateRoom: () => void;
  onNewDecision: () => void;
}

export const DecisionDashboard: React.FC<DecisionDashboardProps> = ({
  decisionData,
  onCreateRoom,
  onNewDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'pros-cons' | 'matrix' | 'swot'>('pros-cons');
  const [showDevilsAdvocate, setShowDevilsAdvocate] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Trigger celebration on initial render
  React.useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.25 },
    });
  }, [decisionData.id]);

  const { tiebreakerVerdict } = decisionData;

  const handleCopyReport = () => {
    let report = `# THE TIEBREAKER DECISION REPORT\n\n`;
    report += `**Dilemma**: ${decisionData.dilemma}\n`;
    if (decisionData.context) report += `**Context**: ${decisionData.context}\n`;
    report += `\n---\n\n`;
    report += `## 🏆 THE TIEBREAKER VERDICT\n`;
    report += `**Winner**: ${tiebreakerVerdict.winnerTitle} (Confidence: ${tiebreakerVerdict.confidenceScore}%)\n`;
    report += `**Verdict**: ${tiebreakerVerdict.oneLineVerdict}\n\n`;
    report += `### Executive Summary\n${tiebreakerVerdict.executiveSummary}\n\n`;
    report += `### Decision Rule\n`;
    report += `* **Choose ${tiebreakerVerdict.winnerTitle} if**: ${tiebreakerVerdict.decisionRule.chooseWinnerIf}\n`;
    report += `* **Choose Alternative if**: ${tiebreakerVerdict.decisionRule.chooseAlternativeIf}\n\n`;
    report += `### Blind Spots & Assumptions\n`;
    tiebreakerVerdict.blindSpots.forEach((b) => (report += `* ${b}\n`));
    report += `\n### Cognitive Biases to Watch Out For\n`;
    tiebreakerVerdict.cognitiveBiasesToWatch.forEach((b) => (report += `* ${b}\n`));
    report += `\n### Immediate 24-Hour Next Action\n${tiebreakerVerdict.immediateNextStep}\n`;

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dilemma Title & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">
              Evaluated Dilemma
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date(decisionData.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            {decisionData.dilemma}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onCreateRoom}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>Launch Group Voting Room</span>
          </button>

          <button
            onClick={() => setShowDevilsAdvocate(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-900 transition-all"
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Devil’s Advocate</span>
          </button>

          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
          >
            {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            <span>{copiedReport ? 'Report Copied!' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* The Tiebreaker Verdict & AI Recommendation Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/60 to-amber-950/40 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-6">
          {/* Top Verdict Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] uppercase font-black tracking-wider bg-amber-500 text-slate-950">
                    The Tiebreaker Recommendation
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{tiebreakerVerdict.confidenceScore}% Confidence Rating</span>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
                  {tiebreakerVerdict.winnerTitle}
                </h2>
                <p className="text-sm font-semibold text-amber-300/90 mt-1">
                  "{tiebreakerVerdict.oneLineVerdict}"
                </p>
              </div>
            </div>
          </div>

          {/* Rationale and Decision Rule Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Executive Rationale */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Executive Rationale & Synthesis
              </span>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                {tiebreakerVerdict.executiveSummary}
              </p>

              {/* Conditional Decision Rule */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>The Conditional Decision Rule:</span>
                </span>
                <div className="space-y-1.5 text-xs text-slate-200">
                  <p>
                    <strong className="text-emerald-400">Choose {tiebreakerVerdict.winnerTitle} if:</strong>{' '}
                    {tiebreakerVerdict.decisionRule.chooseWinnerIf}
                  </p>
                  <p>
                    <strong className="text-amber-400">Choose Alternative if:</strong>{' '}
                    {tiebreakerVerdict.decisionRule.chooseAlternativeIf}
                  </p>
                </div>
              </div>
            </div>

            {/* Blind Spots & Next Action */}
            <div className="lg:col-span-5 space-y-4">
              {/* Blind spots */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Overlooked Blind Spots & Assumptions:</span>
                </span>
                <ul className="space-y-1.5">
                  {tiebreakerVerdict.blindSpots.map((spot, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{spot}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cognitive Biases */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">
                    Cognitive Biases To Guard Against:
                  </span>
                  <span>{tiebreakerVerdict.cognitiveBiasesToWatch.join(', ')}</span>
                </div>
              </div>

              {/* Next step */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider block">
                    Immediate 24-Hour Next Step:
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    {tiebreakerVerdict.immediateNextStep}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Framework Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pros-cons')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pros-cons'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>Pros & Cons Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Comparison Matrix & Weights</span>
          </button>

          <button
            onClick={() => setActiveTab('swot')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'swot'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
            <span>SWOT Strategic Analysis</span>
          </button>
        </div>

        <button
          onClick={onNewDecision}
          className="text-xs text-slate-400 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-900 transition-colors"
        >
          Evaluate another decision
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'pros-cons' && (
          <ProsConsView analyses={decisionData.analyses} />
        )}

        {activeTab === 'matrix' && (
          <ComparisonMatrixView decisionData={decisionData} />
        )}

        {activeTab === 'swot' && (
          <SwotAnalysisView analyses={decisionData.analyses} />
        )}
      </div>

      {/* Devil's Advocate Modal */}
      <DevilsAdvocateModal
        isOpen={showDevilsAdvocate}
        onClose={() => setShowDevilsAdvocate(false)}
        dilemma={decisionData.dilemma}
        optionTitle={tiebreakerVerdict.winnerTitle}
        allOptions={decisionData.options.map((o) => o.title)}
        context={decisionData.context}
      />
    </div>
  );
};
