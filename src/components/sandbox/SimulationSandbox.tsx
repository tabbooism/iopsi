import React, { useState, useEffect } from 'react';
import { ScamProfile, DialogueNode, DialogueOption, VictimArchetype } from '../../types';
import { VICTIM_ARCHETYPES } from '../../data/defaultScams';
import { 
  Cpu, 
  RotateCcw, 
  Undo2, 
  Download, 
  BrainCircuit, 
  Flame, 
  User, 
  Users, 
  Tv, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';
import { DialogueGraphCanvas } from './DialogueGraphCanvas';

interface SimulationSandboxProps {
  scams: ScamProfile[];
  currentScam: ScamProfile;
  onSelectScam: (scam: ScamProfile) => void;
}

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({
  scams,
  currentScam,
  onSelectScam
}) => {
  // Sandbox states
  const [selectedArchetype, setSelectedArchetype] = useState<VictimArchetype>(VICTIM_ARCHETYPES[0]);
  const [suspicionMeter, setSuspicionMeter] = useState<number>(15);
  const [retroTheme, setRetroTheme] = useState<boolean>(false);
  const [showBiasInspector, setShowBiasInspector] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Dialogue traversal
  const [currentNodeId, setCurrentNodeId] = useState<string>('node_start');
  const [chatLog, setChatLog] = useState<Array<{
    id: string;
    speaker: 'scammer' | 'target' | 'accomplice' | 'system';
    speakerName: string;
    text: string;
    cognitiveBias?: string;
    suspicionDelta?: number;
  }>>([]);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [sessionTerminated, setSessionTerminated] = useState<boolean>(false);
  const [terminationReason, setTerminationReason] = useState<string>('');

  const currentNode = currentScam.dialogueTree.find(n => n.id === currentNodeId) || currentScam.dialogueTree[0];

  useEffect(() => {
    resetSandbox();
  }, [currentScam.id, selectedArchetype.id]);

  const resetSandbox = () => {
    setCurrentNodeId('node_start');
    setStepHistory([]);
    setSuspicionMeter(15);
    setSessionTerminated(false);
    setTerminationReason('');

    const startNode = currentScam.dialogueTree[0];
    if (startNode) {
      setChatLog([
        {
          id: 'log_start',
          speaker: startNode.speaker,
          speakerName: startNode.speakerName,
          text: startNode.text,
          cognitiveBias: startNode.cognitiveBias,
          suspicionDelta: Math.round(startNode.suspicionImpact * selectedArchetype.suspicionMultiplier)
        }
      ]);
    }
  };

  // Branch Rewind / Turn Undo (Feature 16)
  const handleUndo = () => {
    if (stepHistory.length === 0) {
      toast.notify('Already at initial dialogue node', 'info');
      return;
    }
    sound.playClick();
    const previousNodeId = stepHistory[stepHistory.length - 1];
    setStepHistory(prev => prev.slice(0, -1));
    setChatLog(prev => prev.slice(0, -2)); // Remove last player response and opponent reply
    setCurrentNodeId(previousNodeId);
    setSuspicionMeter(prev => Math.max(0, prev - 15));
    setSessionTerminated(false);
    toast.notify('Rewound one branch turn', 'info');
  };

  // Turn choice handler with Simulated Latency (Feature 19) & Evasion Engine (Feature 20)
  const handleSelectOption = (option: DialogueOption) => {
    sound.playClick();
    setStepHistory(prev => [...prev, currentNodeId]);

    // 1. Log target's response
    const targetEntry = {
      id: 'target_' + Math.random().toString(36).substring(2, 7),
      speaker: 'target' as const,
      speakerName: selectedArchetype.name,
      text: option.text
    };
    setChatLog(prev => [...prev, targetEntry]);

    // 2. Compute Suspicion change based on Archetype multiplier (Feature 12 & 18)
    const baseImpact = option.riskImpact === 'safe' ? 30 : option.riskImpact === 'fatal' ? -10 : 15;
    const scaledImpact = Math.round(baseImpact * selectedArchetype.suspicionMultiplier);
    const newSuspicion = Math.min(100, Math.max(0, suspicionMeter + scaledImpact));
    setSuspicionMeter(newSuspicion);

    // Suspicion Meter 100% threshold check (Feature 12)
    if (newSuspicion >= 100) {
      setSessionTerminated(true);
      setTerminationReason('VICTIM SKEPTICISM MAXED (100%): Target detected deception and logged out or walked away.');
      sound.playSuccess();
      toast.notify('Victim Suspicion reached 100%: Scam Terminated!', 'success');
      return;
    }

    // 3. Evasion Branch Engine (Feature 20): Check if node has evasion branch when target acts safely
    let nextNodeId = option.nextNodeId;
    if (option.riskImpact === 'safe' && currentNode.evasionBranch) {
      nextNodeId = currentNode.evasionBranch;
      toast.notify('Scammer detected resistance: Triggering Evasion Pivot!', 'warning');
    }

    const nextNode = currentScam.dialogueTree.find(n => n.id === nextNodeId);

    // 4. Simulated Response Delay (Feature 19)
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      if (!nextNode) return;

      sound.playBlip();
      setChatLog(prev => [
        ...prev,
        {
          id: 'reply_' + Math.random().toString(36).substring(2, 7),
          speaker: nextNode.speaker,
          speakerName: nextNode.speakerName,
          text: nextNode.text,
          cognitiveBias: nextNode.cognitiveBias,
          suspicionDelta: scaledImpact
        }
      ]);

      if (nextNode.isTerminal) {
        setSessionTerminated(true);
        if (nextNode.outcome === 'foiled') {
          setTerminationReason('DEFENSE SECURED: Target successfully deflected scam attempt.');
        } else {
          setTerminationReason('TARGET COMPROMISED: Scammer extracted target wealth or credentials.');
        }
      } else {
        setCurrentNodeId(nextNode.id);
      }
    }, 700);
  };

  // Export Transcript (Feature 17)
  const handleExportTranscript = () => {
    sound.playClick();
    const lines = [
      `====================================================`,
      `OSRS-OPS SIMULATION TRANSCRIPT`,
      `Scenario: ${currentScam.name}`,
      `Archetype: ${selectedArchetype.name}`,
      `Vector: ${currentScam.type} | Date: ${new Date().toLocaleString()}`,
      `Final Suspicion Level: ${suspicionMeter}%`,
      `====================================================\n`
    ];

    chatLog.forEach(entry => {
      lines.push(`[${entry.speaker.toUpperCase()}] ${entry.speakerName}: ${entry.text}`);
      if (entry.cognitiveBias) {
        lines.push(`   └─ Psychology: ${entry.cognitiveBias}`);
      }
    });

    if (sessionTerminated) {
      lines.push(`\n[OUTCOME]: ${terminationReason}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OSRS_OPS_Transcript_${currentScam.id}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.notify('Simulation transcript exported as .txt', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Adversarial Simulation Sandbox</h2>
            <p className="text-xs text-slate-400">
              Interactive multi-agent behavioral engine with cognitive bias tracking and branch inspection.
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Retro Theme Toggle (Feature 14) */}
          <button
            onClick={() => {
              sound.playClick();
              setRetroTheme(!retroTheme);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border ${
              retroTheme
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            {retroTheme ? 'Retro OSRS Chat' : 'Modern UI Skin'}
          </button>

          {/* Cognitive Bias Toggle (Feature 15) */}
          <button
            onClick={() => setShowBiasInspector(!showBiasInspector)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              showBiasInspector
                ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Bias Inspector
          </button>

          {/* Undo Turn (Feature 16) */}
          <button
            onClick={handleUndo}
            disabled={stepHistory.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-lg transition-colors"
            title="Rewind one dialogue turn"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Rewind
          </button>

          {/* Export Transcript (Feature 17) */}
          <button
            onClick={handleExportTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log
          </button>

          <button
            onClick={resetSandbox}
            className="p-1.5 text-slate-400 hover:text-white rounded"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Two-Zone Sandbox Split (Educational Guideline Compliant) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Top Stage: Interactive Chat & Retro Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Victim Suspicion Meter (Feature 12) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Flame className={`w-4 h-4 ${suspicionMeter > 70 ? 'text-rose-500' : 'text-amber-400'}`} />
                Target Suspicion Meter
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-200">
                {suspicionMeter}% / 100% {suspicionMeter >= 100 && '(MAX - SESSION TERMINATED)'}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  suspicionMeter >= 75
                    ? 'bg-rose-500'
                    : suspicionMeter >= 45
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${suspicionMeter}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Trusting / Compliant</span>
              <span>Skeptical / On Guard</span>
              <span>Hostile / Exit</span>
            </div>
          </div>

          {/* Chat Interface Container (Switchable Retro Skin: Feature 14) */}
          <div className={`rounded-xl border shadow-xl overflow-hidden flex flex-col ${
            retroTheme 
              ? 'bg-[#3e3529] border-[#5e5340] text-yellow-300 osrs-retro-theme'
              : 'bg-slate-950 border-slate-800 text-slate-100'
          }`}>
            {/* Window Bar */}
            <div className={`px-4 py-2.5 flex items-center justify-between border-b text-xs ${
              retroTheme
                ? 'bg-[#2b241c] border-[#5e5340] text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold">ALL CHAT</span>
                <span>|</span>
                <span>GAME</span>
                <span>|</span>
                <span>PUBLIC</span>
                <span>|</span>
                <span>PRIVATE</span>
                <span>|</span>
                <span>CLAN</span>
                <span>|</span>
                <span>TRADE</span>
              </div>
              <span className="text-[11px] opacity-75">World 302 · Grand Exchange</span>
            </div>

            {/* Chat Transcript Stream */}
            <div className={`p-4 space-y-3 min-h-[300px] max-h-[380px] overflow-y-auto ${
              retroTheme ? 'font-mono text-base leading-snug' : 'font-sans text-xs'
            }`}>
              {chatLog.map(msg => {
                let colorClass = 'text-yellow-300';
                if (!retroTheme) {
                  if (msg.speaker === 'scammer') colorClass = 'text-amber-400';
                  else if (msg.speaker === 'accomplice') colorClass = 'text-purple-400';
                  else if (msg.speaker === 'target') colorClass = 'text-sky-300';
                  else colorClass = 'text-emerald-400';
                } else {
                  if (msg.speaker === 'accomplice') colorClass = 'text-cyan-300';
                  if (msg.speaker === 'system') colorClass = 'text-white';
                }

                return (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className={`font-bold shrink-0 ${colorClass}`}>
                        {msg.speakerName}:
                      </span>
                      <span className={retroTheme ? 'text-[#ffff00]' : 'text-slate-200'}>
                        {msg.text}
                      </span>
                    </div>

                    {/* Cognitive Bias Tag (Feature 15) */}
                    {showBiasInspector && msg.cognitiveBias && (
                      <div className="pl-4 text-[11px] text-purple-400 flex items-center gap-1 font-mono">
                        <BrainCircuit className="w-3 h-3" />
                        <span>Exploits: {msg.cognitiveBias}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Latency Indicator (Feature 19) */}
              {isTyping && (
                <div className="text-xs text-slate-400 italic flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"></span>
                  <span>{currentNode.speakerName} is typing...</span>
                </div>
              )}

              {/* Session Termination Notice */}
              {sessionTerminated && (
                <div className={`p-3 rounded border text-xs font-mono mt-3 ${
                  terminationReason.includes('DEFENSE SECURED') || terminationReason.includes('TERMINATED')
                    ? 'border-emerald-600/60 bg-emerald-950/30 text-emerald-300'
                    : 'border-rose-600/60 bg-rose-950/30 text-rose-300'
                }`}>
                  {terminationReason}
                </div>
              )}
            </div>

            {/* Target Response Decision Controls */}
            {!sessionTerminated && currentNode?.options && (
              <div className={`p-4 border-t space-y-2 ${
                retroTheme ? 'bg-[#2b241c] border-[#5e5340]' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-75">
                  Choose Target Response ({selectedArchetype.name}):
                </div>
                <div className="space-y-1.5">
                  {currentNode.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isTyping}
                      className={`w-full text-left p-2.5 rounded border transition-all text-xs font-medium flex items-center justify-between group ${
                        retroTheme
                          ? 'border-[#705e46] bg-[#3e3529] hover:bg-[#524432] text-yellow-200'
                          : 'border-slate-700 bg-slate-950/70 hover:bg-slate-800 hover:border-amber-400/80 text-slate-200'
                      }`}
                    >
                      <span>{opt.text}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right / Deck Stage: Archetypes, Graph & Biases (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Visual Dialogue Graph (Feature 11) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Visual Dialogue Tree Graph</span>
              <span className="text-[11px] text-slate-400 font-mono">Interactive Nodes</span>
            </div>
            <DialogueGraphCanvas
              dialogueTree={currentScam.dialogueTree}
              currentNodeId={currentNodeId}
              onNodeClick={nodeId => {
                sound.playClick();
                setCurrentNodeId(nodeId);
              }}
            />
          </div>

          {/* Victim Personality Archetypes (Feature 18) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Victim Archetype Profile
              </span>
              <span className="text-xs text-amber-400 font-mono font-medium">
                {selectedArchetype.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {VICTIM_ARCHETYPES.map(arch => {
                const isSelected = selectedArchetype.id === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedArchetype(arch);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{arch.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {arch.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Agent Accomplice Details (Feature 13) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              Syndicate Accomplice Modeling
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Scam operations in Old School RuneScape frequently deploy secondary player accounts to act as fake winners, hypemen, and false witnesses. This triggers the <strong>Bandwagon Effect</strong> and bypasses isolated suspicion.
            </p>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-purple-300">
              Active accomplices in this vector: <strong>PkGod_X</strong>, <strong>ToA_RaidLeader</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
