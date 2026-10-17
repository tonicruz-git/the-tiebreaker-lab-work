import React, { useState, useEffect } from 'react';
import type { DecisionData, CollaborativeRoom } from './types/decision';
import type { DecisionTemplate } from './data/templates';
import { Navbar } from './components/Navbar';
import { DecisionInputForm } from './components/DecisionInputForm';
import { DecisionDashboard } from './components/DecisionDashboard';
import { CollaborativeRoomView } from './components/CollaborativeRoomView';
import { TemplatesModal } from './components/TemplatesModal';
import { HistoryDrawer } from './components/HistoryDrawer';

export default function App() {
  const [currentDecision, setCurrentDecision] = useState<DecisionData | null>(null);
  const [currentRoom, setCurrentRoom] = useState<CollaborativeRoom | null>(null);
  const [viewMode, setViewMode] = useState<'input' | 'dashboard' | 'room'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Modals & Drawers
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Saved Decisions in localStorage
  const [savedDecisions, setSavedDecisions] = useState<DecisionData[]>(() => {
    try {
      const stored = localStorage.getItem('tb_saved_decisions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Check URL query parameters for room on load (e.g., ?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      handleJoinRoom(roomCode);
    }
  }, []);

  const saveDecisionToHistory = (dec: DecisionData) => {
    setSavedDecisions((prev) => {
      const filtered = prev.filter((d) => d.id !== dec.id);
      const updated = [dec, ...filtered].slice(0, 20); // keep recent 20
      try {
        localStorage.setItem('tb_saved_decisions', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleDeleteSavedDecision = (id: string) => {
    setSavedDecisions((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem('tb_saved_decisions', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleAnalyze = async (payload: {
    dilemma: string;
    options: string[];
    criteria: string;
    context: string;
    perspective: string;
  }) => {
    setIsLoading(true);
    setErrorToast(null);

    try {
      const res = await fetch('/api/decision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to analyze decision.');
      }

      const data: DecisionData = await res.json();
      setCurrentDecision(data);
      saveDecisionToHistory(data);
      setViewMode('dashboard');
    } catch (e: any) {
      setErrorToast(e.message || 'Something went wrong while analyzing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!currentDecision) return;
    setIsLoading(true);

    try {
      const hostName = localStorage.getItem('tb_participant_name') || 'Decision Host';
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionData: currentDecision,
          hostName,
          title: currentDecision.dilemma,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create voting room.');
      }

      const roomData: CollaborativeRoom = await res.json();
      setCurrentRoom(roomData);
      setViewMode('room');

      // Update URL without full reload
      const newUrl = `${window.location.pathname}?room=${roomData.code}`;
      window.history.pushState({}, '', newUrl);
    } catch (e: any) {
      setErrorToast(e.message || 'Error creating collaborative room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (code: string) => {
    setIsLoading(true);
    setErrorToast(null);

    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        throw new Error(`Room "${code}" was not found or has expired.`);
      }

      const roomData: CollaborativeRoom = await res.json();
      setCurrentRoom(roomData);
      setCurrentDecision(roomData.decisionData);
      setViewMode('room');

      const newUrl = `${window.location.pathname}?room=${roomData.code}`;
      window.history.pushState({}, '', newUrl);
    } catch (e: any) {
      setErrorToast(e.message || 'Failed to join room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshRoom = async () => {
    if (!currentRoom) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoom.code}`);
      if (res.ok) {
        const updated: CollaborativeRoom = await res.json();
        setCurrentRoom(updated);
        if (updated.decisionData) {
          setCurrentDecision(updated.decisionData);
        }
      }
    } catch (e) {
      console.error('Refresh error:', e);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    window.history.pushState({}, '', window.location.pathname);
    setViewMode(currentDecision ? 'dashboard' : 'input');
  };

  const handleSelectTemplate = (template: DecisionTemplate) => {
    handleAnalyze({
      dilemma: template.dilemma,
      options: template.options,
      criteria: template.criteria,
      context: template.context,
      perspective: 'Balanced & Objective',
    });
  };

  const handleSelectSavedDecision = (dec: DecisionData) => {
    setCurrentDecision(dec);
    setViewMode('dashboard');
  };

  const handleNewDecision = () => {
    setCurrentRoom(null);
    window.history.pushState({}, '', window.location.pathname);
    setViewMode('input');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onNewDecision={handleNewDecision}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onJoinRoom={handleJoinRoom}
        historyCount={savedDecisions.length}
        currentRoomCode={currentRoom?.code}
        onLeaveRoom={currentRoom ? handleLeaveRoom : undefined}
      />

      {/* Error Toast if any */}
      {errorToast && (
        <div className="fixed top-20 right-4 z-50 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-semibold animate-in slide-in-from-top-2">
          <span>{errorToast}</span>
          <button
            onClick={() => setErrorToast(null)}
            className="text-white/80 hover:text-white font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {viewMode === 'input' && (
          <DecisionInputForm
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {viewMode === 'dashboard' && currentDecision && (
          <DecisionDashboard
            decisionData={currentDecision}
            onCreateRoom={handleCreateRoom}
            onNewDecision={handleNewDecision}
          />
        )}

        {viewMode === 'room' && currentRoom && (
          <CollaborativeRoomView
            room={currentRoom}
            onRefreshRoom={handleRefreshRoom}
            onViewAnalysis={() => setViewMode('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            The Tiebreaker © 2026 • AI-Powered Rational Choice & Multi-Criteria Decision Engine
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Playbooks
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Saved ({savedDecisions.length})
            </button>
            <span>•</span>
            <button
              onClick={handleNewDecision}
              className="hover:text-slate-300 transition-colors"
            >
              New Decision
            </button>
          </div>
        </div>
      </footer>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedDecisions={savedDecisions}
        onSelectDecision={handleSelectSavedDecision}
        onDeleteDecision={handleDeleteSavedDecision}
      />
    </div>
  );
}
