import React from 'react';
import { Sparkles, X, ArrowRight, Tag } from 'lucide-react';
import { DECISION_TEMPLATES, DecisionTemplate } from '../data/templates';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DecisionTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Decision Playbooks & Templates</h3>
            <p className="text-xs text-slate-400">Pre-configured high-stakes scenarios with calibrated criteria</p>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {DECISION_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl);
                onClose();
              }}
              className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-950 transition-all cursor-pointer group flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tpl.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {tpl.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {tpl.dilemma}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-900">
                {tpl.options.map((opt, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-800"
                  >
                    {String.fromCharCode(65 + i)}: {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
