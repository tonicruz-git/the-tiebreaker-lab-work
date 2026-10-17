import React from 'react';
import { Bookmark, X, Clock, Trash2, ArrowRight } from 'lucide-react';
import type { DecisionData } from '../types/decision';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedDecisions: DecisionData[];
  onSelectDecision: (decision: DecisionData) => void;
  onDeleteDecision: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedDecisions,
  onSelectDecision,
  onDeleteDecision,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Saved Decisions ({savedDecisions.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {savedDecisions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No saved decisions yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Decisions you analyze are automatically preserved here.
              </p>
            </div>
          ) : (
            savedDecisions.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 transition-all group flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>{new Date(dec.createdAt).toLocaleDateString()}</span>
                    <span className="font-semibold text-amber-400">
                      Winner: {dec.tiebreakerVerdict.winnerTitle}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {dec.dilemma}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500">
                    {dec.options.length} options compared
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDeleteDecision(dec.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Delete decision"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectDecision(dec);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
