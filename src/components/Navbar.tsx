import React, { useState } from 'react';
import { Scale, Users, PlusCircle, Bookmark, Sparkles, LogIn, X } from 'lucide-react';

interface NavbarProps {
  onNewDecision: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onJoinRoom: (code: string) => void;
  historyCount: number;
  currentRoomCode?: string;
  onLeaveRoom?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewDecision,
  onOpenTemplates,
  onOpenHistory,
  onJoinRoom,
  historyCount,
  currentRoomCode,
  onLeaveRoom,
}) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      onJoinRoom(joinCodeInput.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCodeInput('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div 
            onClick={onNewDecision}
            className="flex items-center gap-3 cursor-pointer group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  The Tiebreaker
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI + Group
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Rational Choice & Deadlock Resolution Engine
              </p>
            </div>
          </div>

          {/* Center: active room indicator if in a room */}
          {currentRoomCode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
              <Users className="w-3.5 h-3.5" />
              <span>Room: {currentRoomCode}</span>
              {onLeaveRoom && (
                <button
                  onClick={onLeaveRoom}
                  className="ml-1 p-0.5 hover:bg-amber-500/20 rounded-full transition-colors"
                  title="Exit group room"
                >
                  <X className="w-3 h-3 text-amber-400" />
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenTemplates}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              title="Explore decision templates"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Templates</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              title="Join a collaborative voting room"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Join Room</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              title="View saved decisions"
            >
              <Bookmark className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={onNewDecision}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Decision</span>
            </button>
          </div>
        </div>
      </header>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Join Collaborative Room</h3>
                <p className="text-xs text-slate-400">Enter a 6-letter room code shared by your team</p>
              </div>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Room Code
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 7K4R9M"
                  className="w-full text-center tracking-widest text-xl font-mono uppercase bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Enter Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
