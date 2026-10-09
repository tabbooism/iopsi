import React, { useState, useEffect } from 'react';
import { ScamProfile, DialogueNode, DialogueOption, Badge, UserStats } from '../../types';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Timer, 
  HelpCircle, 
  Flag, 
  Award, 
  RotateCcw, 
  ArrowRight, 
  ChevronRight, 
  BookOpen, 
  Flame, 
  PlusCircle, 
  FileSearch,
  AlertTriangle
} from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';
import { Storage } from '../../lib/storage';
import { SpotRedFlagModal } from './SpotRedFlagModal';
import { AbuseReportModal } from './AbuseReportModal';
import { CustomScenarioModal } from './CustomScenarioModal';

interface DefenseTrainingProps {
  scams: ScamProfile[];
  currentScam: ScamProfile;
  onSelectScam: (scam: ScamProfile) => void;
  onAddCustomScam: (scam: ScamProfile) => void;
}

export const DefenseTraining: React.FC<DefenseTrainingProps> = ({
  scams,
  currentScam,
  onSelectScam,
  onAddCustomScam
}) => {
  // Scenario simulation state
  const [currentNodeId, setCurrentNodeId] = useState<string>('node_start');
  const [history, setHistory] = useState<Array<{ node: DialogueNode; chosenOption?: DialogueOption }>>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<'foiled' | 'compromised' | null>(null);

  // Gamification & Settings
  const [stats, setStats] = useState<UserStats>(Storage.getUserStats());
  const [badges, setBadges] = useState<Badge[]>(Storage.getBadges());
  const [timedMode, setTimedMode] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Modals
  const [showRedFlagModal, setShowRedFlagModal] = useState<boolean>(false);
  const [showAbuseReportModal, setShowAbuseReportModal] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Current node in dialogue tree
  const currentNode = currentScam.dialogueTree.find(n => n.id === currentNodeId) || currentScam.dialogueTree[0];

  // Reset when scenario changes
  useEffect(() => {
    resetScenario();
  }, [currentScam.id]);

  // Timed pressure mode timer (Feature 7)
  useEffect(() => {
    if (!timedMode || isCompleted) return;

    if (timeLeft <= 0) {
      sound.playWarning();
      toast.notify('Time expired! Panic decision triggered.', 'warning');
      // Auto select the first risky or available option
      const fallbackOpt = currentNode?.options?.find(o => o.riskImpact !== 'safe') || currentNode?.options?.[0];
      if (fallbackOpt) {
        handleSelectOption(fallbackOpt);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timedMode, timeLeft, isCompleted, currentNode]);

  const resetScenario = () => {
    setCurrentNodeId('node_start');
    setHistory([]);
    setIsCompleted(false);
    setOutcome(null);
    setTimeLeft(10);
    setShowHint(false);
    setHintsUsed(0);
  };

  const handleSelectOption = (option: DialogueOption) => {
    sound.playClick();
    const nextNode = currentScam.dialogueTree.find(n => n.id === option.nextNodeId);

    setHistory(prev => [...prev, { node: currentNode, chosenOption: option }]);

    if (!nextNode || nextNode.isTerminal) {
      // Reached completion
      setIsCompleted(true);
      const isFoiled = nextNode?.outcome === 'foiled' || option.riskImpact === 'safe';
      setOutcome(isFoiled ? 'foiled' : 'compromised');

      if (isFoiled) {
        sound.playSuccess();
        toast.notify('Threat Deflected! High resilience choice confirmed.', 'success');
        updateResilienceScore(true);
      } else {
        sound.playWarning();
        toast.notify('Compromised! Review debrief to understand the exploit.', 'error');
        updateResilienceScore(false);
      }
    } else {
      setCurrentNodeId(option.nextNodeId);
      setTimeLeft(10);
    }
  };

  const updateResilienceScore = (passed: boolean) => {
    const current = { ...stats };
    const scoreDelta = passed ? Math.max(20, 60 - hintsUsed * 25) : -40;
    const newScore = Math.min(1000, Math.max(100, current.resilienceScore + scoreDelta));

    let tier: UserStats['tier'] = 'Novice Target';
    if (newScore >= 850) tier = 'Anti-Scam Vanguard';
    else if (newScore >= 700) tier = 'Hardened Defender';
    else if (newScore >= 500) tier = 'Vigilant Scaper';

    const newStreak = passed ? current.currentStreak + 1 : 0;
    const bestStreak = Math.max(current.bestStreak, newStreak);

    const updatedStats: UserStats = {
      ...current,
      resilienceScore: newScore,
      tier,
      scenariosAttempted: current.scenariosAttempted + 1,
      scenariosPassed: current.scenariosPassed + (passed ? 1 : 0),
      currentStreak: newStreak,
      bestStreak,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          score: newScore,
          scenarioName: currentScam.name,
          result: passed ? 'Passed' : 'Compromised'
        },
        ...current.history.slice(0, 9)
      ]
    };

    setStats(updatedStats);
    Storage.saveUserStats(updatedStats);

    // Check badges
    checkBadgeUnlocks(updatedStats);
  };

  const checkBadgeUnlocks = (currentStats: UserStats) => {
    let changed = false;
    const updatedBadges = badges.map(b => {
      if (b.unlocked) return b;
      let shouldUnlock = false;

      if (b.id === 'badge_zero_loss_streak_3' && currentStats.currentStreak >= 3) shouldUnlock = true;
      if (b.id === 'badge_hardened_tier' && currentStats.resilienceScore >= 850) shouldUnlock = true;

      if (shouldUnlock) {
        changed = true;
        toast.notify(`Badge Unlocked: "${b.name}"!`, 'success');
        sound.playSuccess();
        return { ...b, unlocked: true, unlockedAt: new Date().toISOString().split('T')[0] };
      }
      return b;
    });

    if (changed) {
      setBadges(updatedBadges);
      Storage.saveBadges(updatedBadges);
    }
  };

  const handleUseHint = () => {
    if (showHint) return;
    sound.playBlip();
    setShowHint(true);
    setHintsUsed(prev => prev + 1);
    toast.notify('Contextual Hint revealed (-25 DRS points penalty on scenario win)', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: DRS Score & Badges Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        {/* Metric 1: Dynamic Resilience Score */}
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium">Dynamic Resilience Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {stats.resilienceScore}
            </span>
            <span className="text-xs text-amber-400 font-semibold font-mono">
              / 1000
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-1">
            Rank: <strong className="text-amber-300">{stats.tier}</strong>
          </span>
        </div>

        {/* Metric 2: Scenario Success Rate */}
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium">Defensive Accuracy</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
              {stats.scenariosAttempted > 0 
                ? Math.round((stats.scenariosPassed / stats.scenariosAttempted) * 100) 
                : 0}%
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({stats.scenariosPassed}/{stats.scenariosAttempted} passed)
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-1">
            Streak: <strong className="text-orange-400">{stats.currentStreak}</strong> (Best: {stats.bestStreak})
          </span>
        </div>

        {/* Metric 3: Red Flags Identified */}
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium">Forensic Spotter</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-mono tabular-nums text-sky-400">
              {stats.redFlagsFound}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              / {stats.totalRedFlags} flagged
            </span>
          </div>
          <button
            onClick={() => setShowRedFlagModal(true)}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-1 text-left font-medium"
          >
            <FileSearch className="w-3.5 h-3.5" /> Launch "Spot Red Flag" Review
          </button>
        </div>

        {/* Metric 4: Quick Action Controls */}
        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 md:pl-4 pt-3 md:pt-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Timed Pressure Mode</span>
            <button
              onClick={() => {
                sound.playClick();
                setTimedMode(!timedMode);
                setTimeLeft(10);
              }}
              className={`px-2 py-0.5 text-xs font-semibold rounded font-mono transition-colors ${
                timedMode ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {timedMode ? '10s ACTIVE' : 'OFF'}
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowCustomModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors font-medium"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" /> Custom Quiz
            </button>
            <button
              onClick={() => setShowAbuseReportModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs rounded transition-colors font-medium border border-amber-500/30"
            >
              <Flag className="w-3.5 h-3.5" /> Mock Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Training Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scenario Selector & Metadata (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Active Scenario Profile</h2>
              <span className="text-xs text-slate-400 font-mono">
                {scams.findIndex(s => s.id === currentScam.id) + 1} of {scams.length}
              </span>
            </div>

            {/* Scenario dropdown selector */}
            <select
              value={currentScam.id}
              onChange={e => {
                const found = scams.find(s => s.id === e.target.value);
                if (found) {
                  sound.playClick();
                  onSelectScam(found);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-400 mb-4"
            >
              {scams.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.difficulty})
                </option>
              ))}
            </select>

            {/* Clean unboxed metadata with typographic separators (anti-slop rule compliant) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pb-3 border-b border-slate-800">
              <span className="text-amber-400 font-medium">{currentScam.type}</span>
              <span aria-hidden="true">·</span>
              <span>Target: <strong className="text-slate-200">{currentScam.targetAsset}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Difficulty: <strong className="text-slate-200">{currentScam.difficulty}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Risk: <strong className="text-rose-400 font-mono">{currentScam.calculatedRiskScore}</strong></span>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {currentScam.narrative}
            </p>

            {/* Jagex Rule Mapping (Feature 4) */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Jagex Rule Violations:
              </div>
              <div className="space-y-1">
                {currentScam.jagexRules.map((rule, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800/80">
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            {/* Defense Tips */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-400">Core Avoidance Rules:</div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {currentScam.defenseTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">›</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Badges Showcase (Feature 9) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                Victim Defense Badges
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {badges.filter(b => b.unlocked).length} / {badges.length}
              </span>
            </div>

            <div className="space-y-2">
              {badges.map(b => (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-3 transition-colors ${
                    b.unlocked
                      ? 'border-amber-500/40 bg-amber-500/5 text-slate-200'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-500 opacity-60'
                  }`}
                >
                  <Award className={`w-4 h-4 shrink-0 ${b.unlocked ? 'text-amber-400' : 'text-slate-600'}`} />
                  <div className="flex-1 truncate">
                    <div className="font-semibold text-slate-200">{b.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{b.description}</div>
                  </div>
                  {b.unlocked && (
                    <span className="text-[10px] text-emerald-400 font-mono shrink-0">UNLOCKED</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Stage Interactive Decision Terminal (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200 tracking-wide">
                  Multi-Stage Defense Simulation · Stage {history.length + 1}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {timedMode && !isCompleted && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/60 border border-rose-800 text-rose-300 rounded text-xs font-mono">
                    <Timer className="w-3.5 h-3.5 animate-pulse" />
                    <span className="font-bold">{timeLeft}s remaining</span>
                  </div>
                )}

                <button
                  onClick={resetScenario}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  title="Restart Scenario"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>

            {/* Conversation Log & Transcript */}
            <div className="p-5 space-y-4 min-h-[320px] max-h-[460px] overflow-y-auto bg-slate-950/50">
              {/* Prior steps in history */}
              {history.map((step, idx) => (
                <div key={idx} className="space-y-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs font-bold text-amber-400 font-mono shrink-0">
                      [{step.node.speakerName}]:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {step.node.text}
                    </p>
                  </div>
                  {step.chosenOption && (
                    <div className="flex items-start gap-2.5 pl-4 text-xs text-sky-400 font-mono">
                      <span className="font-semibold shrink-0">› Your Decision:</span>
                      <span>{step.chosenOption.text}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Current Active Speaker Node */}
              {!isCompleted && currentNode && (
                <div className="space-y-3 pt-1">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-700/80 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono text-amber-400">
                        [{currentNode.speakerName}]
                      </span>
                      {currentNode.cognitiveBias && (
                        <span className="text-[11px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                          Psychology: {currentNode.cognitiveBias}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-slate-100 leading-relaxed">
                      {currentNode.text}
                    </p>
                  </div>

                  {/* Hint System (Feature 6) */}
                  {showHint ? (
                    <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded text-xs text-amber-200 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Contextual Hint:</strong> Look out for cognitive pressure ({currentNode.cognitiveBias || 'social proof'}). True OSRS transactions never require secondary off-game steps or high-risk blind trust.
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleUseHint}
                      className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Need a clue? (Use hint with -25 DRS penalty)
                    </button>
                  )}
                </div>
              )}

              {/* Terminal Outcome / Educational Debrief View (Feature 8) */}
              {isCompleted && (
                <div className={`p-5 rounded-xl border space-y-4 animate-in fade-in duration-200 ${
                  outcome === 'foiled'
                    ? 'border-emerald-600/60 bg-emerald-950/20'
                    : 'border-rose-600/60 bg-rose-950/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {outcome === 'foiled' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {outcome === 'foiled' ? 'Scenario Defended Successfully' : 'Victim Assets Compromised'}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {outcome === 'foiled' 
                          ? 'You demonstrated resilient decision-making and resisted the adversary vector.'
                          : 'The deceptive vector succeeded. Study the post-scenario debrief below to harden your defense.'}
                      </p>
                    </div>
                  </div>

                  {/* Psychological Debrief Breakdown */}
                  <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                    <div className="font-semibold text-slate-200">Psychological Biases Leveraged in this Vector:</div>
                    <div className="flex flex-wrap gap-2 text-slate-300">
                      {currentScam.cognitiveBiases.map((bias, i) => (
                        <span key={i} className="bg-slate-900 border border-slate-700 px-2 py-1 rounded font-mono text-[11px]">
                          {bias}
                        </span>
                      ))}
                    </div>

                    <div className="font-semibold text-slate-200 pt-2">Recommended Defensive Rule:</div>
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded font-mono text-slate-300 leading-relaxed">
                      {currentScam.defenseTips[0]}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={resetScenario}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors"
                    >
                      Try Alternate Branch
                    </button>
                    <button
                      onClick={() => {
                        const nextIdx = (scams.findIndex(s => s.id === currentScam.id) + 1) % scams.length;
                        onSelectScam(scams[nextIdx]);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded shadow transition-colors"
                    >
                      Next Scenario <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Decision Controls: Player Options */}
            {!isCompleted && currentNode?.options && (
              <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-2.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Your Action:
                </div>
                <div className="space-y-2">
                  {currentNode.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      className="w-full text-left p-3.5 rounded-lg border border-slate-700 bg-slate-950/60 hover:bg-slate-800 hover:border-amber-400/80 transition-all text-xs font-medium text-slate-200 flex items-center justify-between group"
                    >
                      <span className="pr-4">{opt.text}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spot the Red Flag Modal */}
      <SpotRedFlagModal
        scam={currentScam}
        isOpen={showRedFlagModal}
        onClose={() => setShowRedFlagModal(false)}
        onComplete={(found, total) => {
          const updated = {
            ...stats,
            redFlagsFound: stats.redFlagsFound + found,
            totalRedFlags: stats.totalRedFlags + total
          };
          setStats(updated);
          Storage.saveUserStats(updated);
        }}
      />

      {/* Mock Abuse Report Modal */}
      <AbuseReportModal
        scam={currentScam}
        isOpen={showAbuseReportModal}
        onClose={() => setShowAbuseReportModal(false)}
        onReportFiled={() => {
          const updated = {
            ...stats,
            reportsFiled: stats.reportsFiled + 1
          };
          setStats(updated);
          Storage.saveUserStats(updated);
        }}
      />

      {/* Custom Scenario Builder Modal */}
      <CustomScenarioModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSave={onAddCustomScam}
      />
    </div>
  );
};
