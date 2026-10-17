import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Users, Share2, Copy, Check, Gavel, ThumbsUp, MessageSquare, 
  Sparkles, Award, ArrowRight, RefreshCw, BarChart3, AlertCircle, Plus
} from 'lucide-react';
import type { CollaborativeRoom, ParticipantVote, ProConItem } from '../types/decision';

interface CollaborativeRoomViewProps {
  room: CollaborativeRoom;
  onRefreshRoom: () => Promise<void>;
  onViewAnalysis: () => void;
}

export const CollaborativeRoomView: React.FC<CollaborativeRoomViewProps> = ({
  room,
  onRefreshRoom,
  onViewAnalysis,
}) => {
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('tb_participant_name') || '';
  });
  const [participantId] = useState<string>(() => {
    let id = localStorage.getItem('tb_participant_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('tb_participant_id', id);
    }
    return id;
  });

  const [voteMode, setVoteMode] = useState<'points' | 'ranked' | 'approval'>('points');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [isTiebreaking, setIsTiebreaking] = useState(false);

  // Voting inputs
  // Points mode (total 100 points budget distributed across options)
  const [pointAllocations, setPointAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    const count = room.decisionData.options.length;
    const base = Math.floor(100 / count);
    room.decisionData.options.forEach((opt, idx) => {
      init[opt.id] = idx === 0 ? 100 - base * (count - 1) : base;
    });
    return init;
  });

  // Ranked mode (array of optionIds ordered from 1st to last)
  const [rankings, setRankings] = useState<string[]>(() => {
    return room.decisionData.options.map((o) => o.id);
  });

  // Approval mode
  const [approvals, setApprovals] = useState<Record<string, 'approve' | 'neutral' | 'reject'>>(() => {
    const init: Record<string, 'approve' | 'neutral' | 'reject'> = {};
    room.decisionData.options.forEach((o) => {
      init[o.id] = 'approve';
    });
    return init;
  });

  const [voteComment, setVoteComment] = useState('');

  // Argument submission
  const [showArgForm, setShowArgForm] = useState(false);
  const [argType, setArgType] = useState<'pro' | 'con'>('pro');
  const [argTitle, setArgTitle] = useState('');
  const [argDesc, setArgDesc] = useState('');
  const [argTargetOption, setArgTargetOption] = useState<string>(room.decisionData.options[0]?.id || '');
  const [isSubmittingArg, setIsSubmittingArg] = useState(false);

  // Poll room every 4 seconds for live collaborative updates
  useEffect(() => {
    const interval = setInterval(() => {
      onRefreshRoom();
    }, 4000);
    return () => clearInterval(interval);
  }, [onRefreshRoom]);

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalPointsUsed = Object.values(pointAllocations).reduce((acc, v) => acc + (v || 0), 0);

  const handlePointChange = (optId: string, val: number) => {
    setPointAllocations((prev) => ({
      ...prev,
      [optId]: val,
    }));
  };

  const moveRank = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= rankings.length) return;
    const updated = [...rankings];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setRankings(updated);
  };

  const submitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('Please enter your name or nickname to vote.');
      return;
    }

    localStorage.setItem('tb_participant_name', userName.trim());
    setIsSubmittingVote(true);

    try {
      const res = await fetch(`/api/rooms/${room.code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          participantName: userName.trim(),
          mode: voteMode,
          points: voteMode === 'points' ? pointAllocations : undefined,
          ranking: voteMode === 'ranked' ? rankings : undefined,
          approval: voteMode === 'approval' ? approvals : undefined,
          comment: voteComment.trim() || undefined,
        }),
      });

      if (res.ok) {
        setVoteSubmitted(true);
        await onRefreshRoom();
      }
    } catch (e) {
      console.error('Failed to submit vote:', e);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const submitArgument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argTitle.trim()) return;

    setIsSubmittingArg(true);
    try {
      const res = await fetch(`/api/rooms/${room.code}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: argType,
          title: argTitle.trim(),
          description: argDesc.trim(),
          score: 4,
          category: 'Group Feedback',
          author: userName.trim() || 'Team Member',
          targetOptionId: argTargetOption,
        }),
      });
      if (res.ok) {
        setArgTitle('');
        setArgDesc('');
        setShowArgForm(false);
        await onRefreshRoom();
      }
    } catch (e) {
      console.error('Failed to add argument:', e);
    } finally {
      setIsSubmittingArg(false);
    }
  };

  const upvoteArg = async (argId: string) => {
    try {
      await fetch(`/api/rooms/${room.code}/upvote-argument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ argumentId: argId }),
      });
      await onRefreshRoom();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerTiebreak = async () => {
    setIsTiebreaking(true);
    try {
      const res = await fetch(`/api/rooms/${room.code}/ai-tiebreak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await onRefreshRoom();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (e) {
      console.error('Tiebreak error:', e);
    } finally {
      setIsTiebreaking(false);
    }
  };

  // Calculate vote totals for live leaderboards
  const results = React.useMemo(() => {
    const scores: Record<string, number> = {};
    room.decisionData.options.forEach((o) => {
      scores[o.id] = 0;
    });

    let totalVoteWeight = 0;

    room.votes.forEach((v) => {
      if (v.mode === 'points' && v.points) {
        Object.entries(v.points).forEach(([optId, pts]) => {
          scores[optId] = (scores[optId] || 0) + pts;
          totalVoteWeight += pts;
        });
      } else if (v.mode === 'ranked' && v.ranking) {
        // Borda count: 1st gets N pts, 2nd gets N-1, etc.
        const n = room.decisionData.options.length;
        v.ranking.forEach((optId, rankIdx) => {
          const pts = (n - rankIdx) * 20;
          scores[optId] = (scores[optId] || 0) + pts;
          totalVoteWeight += pts;
        });
      } else if (v.mode === 'approval' && v.approval) {
        Object.entries(v.approval).forEach(([optId, status]) => {
          const pts = status === 'approve' ? 50 : status === 'neutral' ? 20 : 0;
          scores[optId] = (scores[optId] || 0) + pts;
          totalVoteWeight += pts;
        });
      }
    });

    const sorted = room.decisionData.options
      .map((o) => ({
        ...o,
        score: scores[o.id] || 0,
        percentage: totalVoteWeight > 0 ? Math.round(((scores[o.id] || 0) / totalVoteWeight) * 100) : 0,
      }))
      .sort((a, b) => b.score - a.score);

    // Detect deadlock: top 2 within 5% or tied
    const isDeadlock =
      sorted.length >= 2 &&
      sorted[0].score > 0 &&
      Math.abs(sorted[0].percentage - sorted[1].percentage) <= 7;

    return { sorted, totalVoteWeight, isDeadlock };
  }, [room]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Room Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Collaborative Room
              </span>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-400">
                <span>Code: {room.code}</span>
                <button
                  onClick={copyRoomCode}
                  className="ml-1 p-0.5 hover:text-white transition-colors"
                  title="Copy 6-letter room code"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <span className="text-xs text-slate-400">
                Created by <strong className="text-slate-200">{room.hostName}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {room.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Cast your vote, examine collective consensus, contribute arguments, or call the AI Tiebreaker if in deadlock.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-indigo-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Room Link'}</span>
            </button>

            <button
              onClick={onViewAnalysis}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/25"
            >
              <span>View Deep AI Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Tiebreaker Hammer Result Callout (if triggered) */}
      {room.tiebreakerResult && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Gavel className="w-6 h-6 rotate-12" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-amber-500 text-slate-950">
                  AI Tiebreaker Verdict
                </span>
                <span className="text-xs text-slate-400">
                  Deadlock officially resolved
                </span>
              </div>
              <h3 className="text-xl font-black text-amber-300 mt-1">
                {room.tiebreakerResult.verdict}
              </h3>
              <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                {room.tiebreakerResult.rationale}
              </p>

              {room.tiebreakerResult.compromiseSolution && (
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/20">
                  <span className="text-xs font-bold text-amber-400 block mb-1">
                    🤝 Consensus Compromise / Safeguard Plan:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {room.tiebreakerResult.compromiseSolution}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Left (Voting & Arguments) vs Right (Live Results & Consensus) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Voting Station */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cast Your Group Vote</h3>
                  <p className="text-xs text-slate-400">Your vote is factored into the live consensus tally</p>
                </div>
              </div>

              {voteSubmitted && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Vote Saved
                </span>
              )}
            </div>

            <form onSubmit={submitVote} className="space-y-5">
              {/* Participant name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Name / Handle <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah K. or DevLead"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Mode switch */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Voting Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoteMode('points')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      voteMode === 'points'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    100-Point Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteMode('ranked')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      voteMode === 'ranked'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ranked Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteMode('approval')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      voteMode === 'approval'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Approval (Yes/No)
                  </button>
                </div>
              </div>

              {/* MODE 1: 100 Points Budget */}
              {voteMode === 'points' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Distribute your 100 confidence points:</span>
                    <span
                      className={`font-mono font-bold ${
                        totalPointsUsed === 100
                          ? 'text-emerald-400'
                          : totalPointsUsed > 100
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {totalPointsUsed} / 100 points
                    </span>
                  </div>

                  <div className="space-y-3">
                    {room.decisionData.options.map((opt, idx) => (
                      <div key={opt.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-200">
                            {String.fromCharCode(65 + idx)}. {opt.title}
                          </span>
                          <span className="font-mono font-bold text-indigo-400">
                            {pointAllocations[opt.id] || 0} pts
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pointAllocations[opt.id] || 0}
                          onChange={(e) => handlePointChange(opt.id, Number(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 2: Ranked Choice */}
              {voteMode === 'ranked' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block mb-2">
                    Order options from favorite (Top) to least favorite (Bottom):
                  </span>
                  {rankings.map((optId, idx) => {
                    const opt = room.decisionData.options.find((o) => o.id === optId);
                    return (
                      <div
                        key={optId}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span>{opt?.title || optId}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveRank(idx, 'up')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === rankings.length - 1}
                            onClick={() => moveRank(idx, 'down')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODE 3: Approval */}
              {voteMode === 'approval' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  {room.decisionData.options.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <span className="text-xs font-bold text-white">
                        {String.fromCharCode(65 + idx)}. {opt.title}
                      </span>
                      <div className="flex gap-1.5">
                        {(['approve', 'neutral', 'reject'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setApprovals((prev) => ({
                                ...prev,
                                [opt.id]: status,
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                              approvals[opt.id] === status
                                ? status === 'approve'
                                  ? 'bg-emerald-600 text-white'
                                  : status === 'neutral'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                          >
                            {status === 'approve' ? '👍 Support' : status === 'neutral' ? '😐 Neutral' : '👎 Oppose'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Participant rationale comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Optional Comment / Rationale for the Group
                </label>
                <input
                  type="text"
                  placeholder="e.g. Happy with Option A as long as we set a strict $5k cap"
                  value={voteComment}
                  onChange={(e) => setVoteComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmittingVote || !userName.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingVote ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Vote...</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    <span>{voteSubmitted ? 'Update My Vote' : 'Submit My Official Vote'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Crowdsourced Arguments Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Group Arguments & Feedback</h3>
                <span className="text-xs text-slate-500">({room.customArguments.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setShowArgForm(!showArgForm)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Argument</span>
              </button>
            </div>

            {showArgForm && (
              <form onSubmit={submitArgument} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mb-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setArgType('pro')}
                      className={`text-xs px-2.5 py-1 rounded font-bold ${
                        argType === 'pro' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      + Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => setArgType('con')}
                      className={`text-xs px-2.5 py-1 rounded font-bold ${
                        argType === 'con' ? 'bg-rose-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      - Con
                    </button>
                  </div>

                  <select
                    value={argTargetOption}
                    onChange={(e) => setArgTargetOption(e.target.value)}
                    className="bg-slate-900 text-xs text-white border border-slate-700 rounded px-2 py-1"
                  >
                    {room.decisionData.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        Target: {o.title}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Key argument point..."
                  required
                  value={argTitle}
                  onChange={(e) => setArgTitle(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-600"
                />

                <textarea
                  rows={2}
                  placeholder="Supporting rationale or constraint..."
                  value={argDesc}
                  onChange={(e) => setArgDesc(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-600 resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArgForm(false)}
                    className="text-xs px-3 py-1.5 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingArg || !argTitle.trim()}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500"
                  >
                    Post to Group
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {room.customArguments.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center italic">
                  No group arguments posted yet. Be the first to add context!
                </p>
              ) : (
                room.customArguments.map((arg) => (
                  <div
                    key={arg.id}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            arg.type === 'pro'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {arg.type}
                        </span>
                        <span className="text-xs font-bold text-white">{arg.title}</span>
                      </div>
                      {arg.description && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {arg.description}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Added by {arg.author || 'Team Member'}
                      </span>
                    </div>

                    <button
                      onClick={() => upvoteArg(arg.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 text-xs font-bold transition-colors"
                      title="Agree with this point"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{arg.upvotes || 1}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Consensus & Deadlock Hammer */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Leaderboard Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Consensus Tally</h3>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {room.votes.length} {room.votes.length === 1 ? 'Vote' : 'Votes'}
              </span>
            </div>

            {/* Deadlock banner if scores are super close */}
            {results.isDeadlock && !room.tiebreakerResult && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <span className="text-xs font-bold text-amber-300 block">
                    Voting Deadlock Detected!
                  </span>
                  <span className="text-[11px] text-slate-300 leading-snug block mt-0.5">
                    The group is split evenly between the top choices. Call the AI Tiebreaker to resolve the conflict.
                  </span>
                </div>
              </div>
            )}

            {/* Results bars */}
            <div className="space-y-4">
              {results.sorted.map((opt, idx) => (
                <div key={opt.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono">#{idx + 1}</span>
                      <span>{opt.title}</span>
                    </span>
                    <span className="font-mono font-extrabold text-slate-300">
                      {opt.percentage}% ({opt.score} pts)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-500 to-indigo-500'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(opt.percentage, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* The AI Tiebreaker Hammer Button */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={triggerTiebreak}
                disabled={isTiebreaking || room.votes.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 hover:from-amber-400 hover:via-rose-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-amber-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
              >
                {isTiebreaking ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                    <span>Summoning The AI Tiebreaker...</span>
                  </>
                ) : (
                  <>
                    <Gavel className="w-5 h-5 text-amber-300 rotate-12" />
                    <span>
                      {room.tiebreakerResult
                        ? 'Recalculate AI Tiebreaker Verdict'
                        : 'Call The AI Tiebreaker Hammer'}
                    </span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Gemini will arbitrate the split votes, participant comments, and criteria to synthesize a definitive ruling.
              </p>
            </div>
          </div>

          {/* Participant Vote Feed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Participants ({room.votes.length})</span>
              <span className="text-[10px] text-slate-500">Live Roster</span>
            </h4>

            <div className="space-y-2.5 max-h-52 overflow-y-auto">
              {room.votes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 italic">
                  Awaiting first votes...
                </p>
              ) : (
                room.votes.map((v) => (
                  <div
                    key={v.participantId}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{v.participantName}</div>
                      {v.comment && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          "{v.comment}"
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {v.mode}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
