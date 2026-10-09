import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldAlert, Cpu, Database, BarChart3, Radio, Volume2, Sparkles, X } from 'lucide-react';
import { ScamProfile } from '../types';
import { sound } from '../lib/audio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  scams: ScamProfile[];
  onSelectScam: (scam: ScamProfile) => void;
  onNavigateTab: (tab: 'training' | 'sandbox' | 'database' | 'analytics' | 'operations') => void;
  onTriggerSeededGen: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  scams,
  onSelectScam,
  onNavigateTab,
  onTriggerSeededGen,
  onToggleSound,
  soundEnabled
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : undefined;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredScams = scams.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.type.toLowerCase().includes(query.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, scenario name, or tag..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
          />
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/60 text-sm">
          {/* Quick Actions */}
          <div className="pb-2">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation & Operations
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateTab('training');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Go to Defense Training</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Alt + 1</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateTab('sandbox');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span>Go to Simulation Sandbox</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Alt + 2</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateTab('database');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Go to Threat Database</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Alt + 3</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateTab('analytics');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Go to Threat Analytics & Heatmap</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Alt + 4</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateTab('operations');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-rose-400" />
                  <span>Go to Operations & Webhook Queue</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Alt + 5</span>
              </button>

              <button
                onClick={() => {
                  onTriggerSeededGen();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>Run Deterministic PRNG Seed Generation</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Mulberry32</span>
              </button>

              <button
                onClick={() => {
                  onToggleSound();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Toggle 8-bit Sound FX ({soundEnabled ? 'Enabled' : 'Muted'})</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">AudioContext</span>
              </button>
            </div>
          </div>

          {/* Scenarios matching */}
          <div className="pt-2">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Scenarios ({filteredScams.length})
            </div>
            {filteredScams.length === 0 ? (
              <div className="px-3 py-3 text-slate-500 text-xs">No matching scam scenarios found.</div>
            ) : (
              <div className="space-y-0.5">
                {filteredScams.slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectScam(s);
                      onNavigateTab('training');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-medium text-slate-200 truncate">{s.name}</span>
                      <span className="text-xs text-slate-500">
                        {s.type} · Risk: {s.calculatedRiskScore} · {s.difficulty}
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-mono shrink-0">Train →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between px-4">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono">ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
