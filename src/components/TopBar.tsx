import React from 'react';
import { Volume2, VolumeX, Eye, Terminal } from 'lucide-react';
import { sound } from '../lib/audio';

interface TopBarProps {
  activeTab: 'training' | 'sandbox' | 'database' | 'analytics' | 'operations';
  onSelectTab: (tab: 'training' | 'sandbox' | 'database' | 'analytics' | 'operations') => void;
  onOpenCommandPalette: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  highContrast: boolean;
  onToggleContrast: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCommandPalette,
  soundEnabled,
  onToggleSound,
  highContrast,
  onToggleContrast
}) => {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <span 
            onClick={() => onSelectTab('training')}
            className="text-lg font-bold tracking-tight text-white hover:text-amber-400 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            OSRS-OPS
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-500 font-mono tracking-wider">
            · DEFENSE SUITE
          </span>
        </div>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('training');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'training'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Defense Training
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('sandbox');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'sandbox'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Simulation Sandbox
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('database');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'database'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Threat Database
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('analytics');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'analytics'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Threat Analytics
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('operations');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'operations'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Operations & Dispatch
          </button>
        </nav>

        {/* Zone 3: 1 primary action + subtle utilities */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute 8-bit Sound FX' : 'Enable 8-bit Sound FX'}
            aria-label="Toggle sound effects"
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={onToggleContrast}
            title={highContrast ? 'Standard Contrast' : 'WCAG AAA High Contrast'}
            aria-label="Toggle high contrast"
            className={`p-1.5 transition-colors rounded ${
              highContrast ? 'text-amber-400 bg-amber-950/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:border-slate-500 hover:text-white transition-all whitespace-nowrap shrink-0"
            title="Open Command Palette (Ctrl+K)"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Commands</span>
            <kbd className="hidden lg:inline text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
