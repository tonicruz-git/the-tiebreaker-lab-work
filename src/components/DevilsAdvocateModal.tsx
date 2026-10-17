import React, { useState } from 'react';
import { Skull, AlertTriangle, X, RefreshCw, Flame, HelpCircle } from 'lucide-react';

interface DevilsAdvocateModalProps {
  isOpen: boolean;
  onClose: () => void;
  dilemma: string;
  optionTitle: string;
  allOptions: string[];
  context?: string;
}

export const DevilsAdvocateModal: React.FC<DevilsAdvocateModalProps> = ({
  isOpen,
  onClose,
  dilemma,
  optionTitle,
  allOptions,
  context,
}) => {
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);

  const fetchCritique = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/decision/devils-advocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma,
          optionTitle,
          allOptions,
          context,
        }),
      });
      const data = await res.json();
      setCritique(data.critique || 'No critique available.');
    } catch (e: any) {
      setCritique('Failed to run devil’s advocate stress test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !critique && !loading) {
      fetchCritique();
    }
  }, [isOpen, optionTitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-rose-900/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                Stress Test & Pre-Mortem
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5">
              Devil’s Advocate Critique: {optionTitle}
            </h3>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-sm text-slate-300 max-h-[60vh] overflow-y-auto leading-relaxed space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
              <p className="text-xs font-semibold">Stress-testing assumptions and running failure scenarios...</p>
            </div>
          ) : critique ? (
            <div className="whitespace-pre-line prose prose-invert prose-sm max-w-none text-slate-300">
              {critique}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No critique loaded.</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Use this to confirm you are prepared for downside failure modes.</span>
          </p>

          <div className="flex gap-2">
            <button
              onClick={fetchCritique}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Rerun Test</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/20"
            >
              Close Critique
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
