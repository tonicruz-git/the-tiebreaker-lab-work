import React, { useState, useMemo } from 'react';
import { 
  Sliders, Trophy, Download, Check, AlertCircle, Info, RefreshCw, BarChart2 
} from 'lucide-react';
import type { CriteriaScore, DecisionData } from '../types/decision';

interface ComparisonMatrixViewProps {
  decisionData: DecisionData;
}

export const ComparisonMatrixView: React.FC<ComparisonMatrixViewProps> = ({ decisionData }) => {
  // Local state for interactive criteria weights so users can experiment with "What if I value X more?"
  const [weights, setWeights] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    decisionData.criteriaMatrix.forEach((c, idx) => {
      initial[idx] = c.weight || 3;
    });
    return initial;
  });

  const [copied, setCopied] = useState(false);

  const handleWeightChange = (idx: number, newWeight: number) => {
    setWeights((prev) => ({
      ...prev,
      [idx]: newWeight,
    }));
  };

  const handleResetWeights = () => {
    const reset: Record<number, number> = {};
    decisionData.criteriaMatrix.forEach((c, idx) => {
      reset[idx] = c.weight || 3;
    });
    setWeights(reset);
  };

  // Compute weighted totals for each option
  const { weightedTotals, winningOptionId } = useMemo(() => {
    const totals: Record<string, { sum: number; maxPossible: number; averageOutOf10: number }> = {};
    
    // Initialize totals for each option
    decisionData.options.forEach((opt) => {
      totals[opt.id] = { sum: 0, maxPossible: 0, averageOutOf10: 0 };
    });

    let totalWeightSum = 0;

    decisionData.criteriaMatrix.forEach((crit, idx) => {
      const w = weights[idx] ?? crit.weight ?? 3;
      totalWeightSum += w;

      decisionData.options.forEach((opt) => {
        // Fallback score if option id key differs slightly
        const score = crit.scores[opt.id] !== undefined ? crit.scores[opt.id] : 5;
        totals[opt.id].sum += score * w;
        totals[opt.id].maxPossible += 10 * w;
      });
    });

    let highestAvg = -1;
    let winnerId = decisionData.options[0]?.id || '';

    decisionData.options.forEach((opt) => {
      const avg = totalWeightSum > 0 ? (totals[opt.id].sum / totalWeightSum) : 0;
      totals[opt.id].averageOutOf10 = Number(avg.toFixed(1));
      if (avg > highestAvg) {
        highestAvg = avg;
        winnerId = opt.id;
      }
    });

    return { weightedTotals: totals, winningOptionId: winnerId };
  }, [decisionData, weights]);

  const winningOption = decisionData.options.find((o) => o.id === winningOptionId);

  const exportAsMarkdown = () => {
    let md = `# Decision Comparison Matrix: ${decisionData.dilemma}\n\n`;
    md += `| Criteria | Weight | ${decisionData.options.map((o) => o.title).join(' | ')} |\n`;
    md += `|---|---|${decisionData.options.map(() => '---').join('|')}|\n`;

    decisionData.criteriaMatrix.forEach((crit, idx) => {
      const w = weights[idx];
      const rowScores = decisionData.options.map((o) => `${crit.scores[o.id] || 5}/10`).join(' | ');
      md += `| ${crit.criteriaName} | ${w}x | ${rowScores} |\n`;
    });

    md += `| **Weighted Average (out of 10)** | - | ${decisionData.options
      .map((o) => `**${weightedTotals[o.id]?.averageOutOf10 || 0} / 10**`)
      .join(' | ')} |\n\n`;
    md += `**Matrix Winner**: ${winningOption?.title || 'Tie'}\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Weighted Winner Callout Bar */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/40 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                Matrix Leader with Your Weights
              </span>
              <span className="text-[11px] text-slate-400">
                ({weightedTotals[winningOptionId]?.averageOutOf10} / 10)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
              {winningOption?.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust the weight sliders below in real time to simulate different personal priorities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetWeights}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
            title="Reset to AI default weights"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Weights</span>
          </button>

          <button
            onClick={exportAsMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            <span>{copied ? 'Copied Matrix!' : 'Copy Markdown'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Matrix Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 min-w-[200px]">
                  Evaluation Criteria
                </th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-36 text-center">
                  Importance Weight
                </th>
                {decisionData.options.map((option, idx) => {
                  const isLeader = option.id === winningOptionId;
                  return (
                    <th
                      key={option.id}
                      className={`py-4 px-5 text-xs font-bold uppercase tracking-wider min-w-[180px] transition-colors ${
                        isLeader ? 'bg-indigo-950/40 text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option.title}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {decisionData.criteriaMatrix.map((crit, idx) => {
                const currentWeight = weights[idx] ?? crit.weight ?? 3;

                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    {/* Criteria name and description */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-200">{crit.criteriaName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {crit.description}
                      </div>
                    </td>

                    {/* Weight Slider */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={currentWeight}
                            onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                          <span className="text-xs font-mono font-bold text-indigo-400 w-6 text-right">
                            {currentWeight}x
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {currentWeight === 5
                            ? 'Must-have'
                            : currentWeight >= 4
                            ? 'High Priority'
                            : currentWeight >= 2
                            ? 'Moderate'
                            : 'Low Priority'}
                        </span>
                      </div>
                    </td>

                    {/* Scores per Option */}
                    {decisionData.options.map((option) => {
                      const score = crit.scores[option.id] !== undefined ? crit.scores[option.id] : 5;
                      const isLeader = option.id === winningOptionId;

                      return (
                        <td
                          key={option.id}
                          className={`py-4 px-5 align-middle ${
                            isLeader ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Score number */}
                            <span
                              className={`text-sm font-extrabold font-mono px-2 py-0.5 rounded-lg ${
                                score >= 8
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : score >= 5
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {score}
                            </span>

                            {/* Mini progress bar */}
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  score >= 8
                                    ? 'bg-emerald-500'
                                    : score >= 5
                                    ? 'bg-indigo-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${(score / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Total Aggregate Score Row */}
              <tr className="bg-slate-950/80 font-bold border-t-2 border-slate-700">
                <td className="py-4 px-5 text-xs uppercase tracking-wider text-slate-300">
                  Weighted Score Summary
                </td>
                <td className="py-4 px-4 text-center text-xs text-slate-400">
                  Scale 1 - 10
                </td>
                {decisionData.options.map((option) => {
                  const avg = weightedTotals[option.id]?.averageOutOf10 || 0;
                  const isLeader = option.id === winningOptionId;

                  return (
                    <td
                      key={option.id}
                      className={`py-4 px-5 ${isLeader ? 'bg-indigo-950/50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base sm:text-lg font-black font-mono ${
                            isLeader ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          {avg}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">/ 10</span>
                        {isLeader && (
                          <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Leader
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
