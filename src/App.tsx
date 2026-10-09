/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScamProfile } from './types';
import { Storage } from './lib/storage';
import { sound } from './lib/audio';
import { toast } from './lib/toast';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/ToastContainer';
import { CommandPalette } from './components/CommandPalette';
import { DefenseTraining } from './components/training/DefenseTraining';
import { SimulationSandbox } from './components/sandbox/SimulationSandbox';
import { ThreatDatabase } from './components/database/ThreatDatabase';
import { ThreatAnalytics } from './components/analytics/ThreatAnalytics';
import { OperationsDispatch } from './components/operations/OperationsDispatch';

export default function App() {
  const [activeTab, setActiveTab] = useState<'training' | 'sandbox' | 'database' | 'analytics' | 'operations'>('training');
  const [scams, setScams] = useState<ScamProfile[]>([]);
  const [currentScam, setCurrentScam] = useState<ScamProfile | null>(null);

  // UI & Accessibility states (Features 45, 49, 50)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const [highContrast, setHighContrast] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedScams = Storage.getScams();
    setScams(loadedScams);
    if (loadedScams.length > 0) {
      setCurrentScam(loadedScams[0]);
    }
  }, []);

  // Keyboard navigation shortcuts (Feature 48)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Alt + 1-5 for tab navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('training'); sound.playClick(); }
        else if (e.key === '2') { e.preventDefault(); setActiveTab('sandbox'); sound.playClick(); }
        else if (e.key === '3') { e.preventDefault(); setActiveTab('database'); sound.playClick(); }
        else if (e.key === '4') { e.preventDefault(); setActiveTab('analytics'); sound.playClick(); }
        else if (e.key === '5') { e.preventDefault(); setActiveTab('operations'); sound.playClick(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateScams = (updated: ScamProfile[]) => {
    setScams(updated);
    Storage.saveScams(updated);
    if (!currentScam || !updated.some(s => s.id === currentScam.id)) {
      setCurrentScam(updated[0] || null);
    }
  };

  const handleAddCustomScam = (newScam: ScamProfile) => {
    const updated = [newScam, ...scams];
    handleUpdateScams(updated);
    setCurrentScam(newScam);
    Storage.addAudit('CREATE', `Created custom scenario: ${newScam.name}`, newScam.id);
  };

  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
    if (newState) sound.playBlip();
    toast.notify(`8-bit Sound FX: ${newState ? 'Enabled' : 'Muted'}`, 'info');
  };

  const handleToggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    sound.playClick();
    toast.notify(`High Contrast Mode: ${next ? 'Active (WCAG AAA)' : 'Default'}`, 'info');
  };

  const handleTriggerSeededGen = () => {
    sound.playSuccess();
    const procedural = Storage.generateProceduralDatabase(1337);
    const merged = [...procedural, ...scams];
    handleUpdateScams(merged);
    Storage.addAudit('SEED_GENERATE', 'Generated procedural database via Mulberry32 PRNG seed 1337');
    toast.notify('Procedural threat profiles generated from Seed #1337', 'success');
  };

  if (!currentScam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-sm">
        Loading OSRS-OPS Defense Suite...
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      highContrast ? 'bg-black text-white contrast-125' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* 3-Zone Top Navigation Contract */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        highContrast={highContrast}
        onToggleContrast={handleToggleContrast}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {activeTab === 'training' && (
          <DefenseTraining
            scams={scams}
            currentScam={currentScam}
            onSelectScam={setCurrentScam}
            onAddCustomScam={handleAddCustomScam}
          />
        )}

        {activeTab === 'sandbox' && (
          <SimulationSandbox
            scams={scams}
            currentScam={currentScam}
            onSelectScam={setCurrentScam}
          />
        )}

        {activeTab === 'database' && (
          <ThreatDatabase
            scams={scams}
            onUpdateScams={handleUpdateScams}
            onSelectScamForTraining={scam => {
              setCurrentScam(scam);
              setActiveTab('training');
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <ThreatAnalytics
            scams={scams}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsDispatch
            scams={scams}
          />
        )}
      </main>

      {/* Subtle Quiet Footer (Anti-Slop rule compliant) */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 font-mono no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OSRS-OPS · Defensive Threat Intelligence & Training Suite</span>
          <span>Old School RuneScape is a registered trademark of Jagex Limited</span>
        </div>
      </footer>

      {/* Global Command Palette (Feature 45) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        scams={scams}
        onSelectScam={scam => {
          setCurrentScam(scam);
          setActiveTab('training');
        }}
        onNavigateTab={setActiveTab}
        onTriggerSeededGen={handleTriggerSeededGen}
        onToggleSound={handleToggleSound}
        soundEnabled={soundEnabled}
      />

      {/* Non-Blocking Toast Notification Container (Feature 47) */}
      <ToastContainer />
    </div>
  );
}
