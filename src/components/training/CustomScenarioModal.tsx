import React, { useState } from 'react';
import { ScamProfile, ScamCategory, TargetAssetType, DifficultyLevel } from '../../types';
import { calculateCompositeRisk } from '../../data/defaultScams';
import { PlusCircle, Trash2, X, Save, Sparkles } from 'lucide-react';
import { toast } from '../../lib/toast';
import { sound } from '../../lib/audio';

interface CustomScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scam: ScamProfile) => void;
}

export const CustomScenarioModal: React.FC<CustomScenarioModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ScamCategory>('Social Engineering');
  const [targetAsset, setTargetAsset] = useState<TargetAssetType>('GP');
  const [narrative, setNarrative] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [successRate, setSuccessRate] = useState(50);
  const [assetValueRating, setAssetValueRating] = useState(7);
  const [technicalComplexity, setTechnicalComplexity] = useState(4);
  const [mitreTags, setMitreTags] = useState('T1566: Social Engineering, T1204: User Execution');
  const [jagexRules, setJagexRules] = useState('Rule 1: Scamming');
  const [defenseTip, setDefenseTip] = useState('Verify all trades and never trust unvouched third-party links.');

  // Dialogue steps
  const [scammerOpener, setScammerOpener] = useState('');
  const [safeOption, setSafeOption] = useState('');
  const [riskyOption, setRiskyOption] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !narrative.trim() || !scammerOpener.trim()) {
      toast.notify('Please fill out the scenario title, narrative, and opening prompt.', 'warning');
      return;
    }

    const calculatedRiskScore = calculateCompositeRisk(successRate, assetValueRating, technicalComplexity);

    const customProfile: ScamProfile = {
      id: 'custom_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      type,
      targetAsset,
      narrative: narrative.trim(),
      difficulty,
      successRate,
      assetValueRating,
      technicalComplexity,
      calculatedRiskScore,
      mitreTechniques: mitreTags.split(',').map(s => s.trim()).filter(Boolean),
      jagexRules: jagexRules.split(',').map(s => s.trim()).filter(Boolean),
      cognitiveBiases: ['Greed Bias', 'Social Proof', 'Urgency Pressure'],
      defenseTips: [defenseTip.trim()],
      tags: [type, 'Custom Scenario', difficulty],
      redFlags: [
        {
          id: 'rf_c1',
          sentence: scammerOpener,
          isRedFlag: true,
          biasType: 'Deceptive Solicitation',
          explanation: 'Opening lure proposition targeting player psychology.'
        }
      ],
      dialogueTree: [
        {
          id: 'node_start',
          speaker: 'scammer',
          speakerName: 'Sus_Player_X',
          text: scammerOpener.trim(),
          suspicionImpact: 20,
          options: [
            {
              text: safeOption.trim() || 'Decline offer, right click report, and walk away.',
              nextNodeId: 'node_safe_exit',
              riskImpact: 'safe',
              explanation: 'Clean defensive avoidance.'
            },
            {
              text: riskyOption.trim() || 'Accept proposal and follow to second location.',
              nextNodeId: 'node_loss_exit',
              riskImpact: 'fatal',
              explanation: 'Compromised by social engineering vector.'
            }
          ]
        },
        {
          id: 'node_safe_exit',
          speaker: 'system',
          speakerName: 'System',
          text: 'Threat successfully neutralized! You retained all assets.',
          suspicionImpact: 0,
          isTerminal: true,
          outcome: 'foiled',
          explanation: 'Proper anti-scam defense executed.'
        },
        {
          id: 'node_loss_exit',
          speaker: 'system',
          speakerName: 'System',
          text: 'COMPROMISED: The scammer exploited the vulnerability and took your assets.',
          suspicionImpact: 100,
          isTerminal: true,
          outcome: 'compromised',
          explanation: 'Target fell for scenario trap.'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(customProfile);
    sound.playSuccess();
    toast.notify(`Custom scenario "${customProfile.name}" created!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-white">Custom Scenario & Quiz Builder</h3>
              <p className="text-xs text-slate-400">Author custom defense simulations for clan training & education</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Scenario Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Raids 3 Teleport Trap Lure"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vector Category</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ScamCategory)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Social Engineering">Social Engineering</option>
                <option value="GE-Area">GE-Area</option>
                <option value="Client-Side">Client-Side</option>
                <option value="Wilderness Lure">Wilderness Lure</option>
                <option value="Discord Phishing">Discord Phishing</option>
                <option value="Trade Window Manipulation">Trade Window Manipulation</option>
                <option value="Clan Infiltration">Clan Infiltration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Threat Narrative / Description *</label>
            <textarea
              rows={2}
              required
              placeholder="Explain how the scam operates, what psychology is exploited, and what happens to the victim..."
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Asset</label>
              <select
                value={targetAsset}
                onChange={e => setTargetAsset(e.target.value as TargetAssetType)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              >
                <option value="GP">GP</option>
                <option value="Accounts">Accounts</option>
                <option value="Items">Items</option>
                <option value="Discord Credentials">Discord Credentials</option>
                <option value="2FA Tokens">2FA Tokens</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              >
                <option value="Novice">Novice</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Success Rate ({successRate}%)</label>
              <input
                type="range"
                min="10"
                max="95"
                value={successRate}
                onChange={e => setSuccessRate(Number(e.target.value))}
                className="w-full mt-2 accent-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">MITRE ATT&CK Techniques (comma separated)</label>
              <input
                type="text"
                value={mitreTags}
                onChange={e => setMitreTags(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Applicable Jagex Rule</label>
              <input
                type="text"
                value={jagexRules}
                onChange={e => setJagexRules(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
            <div className="font-semibold text-slate-200 text-xs">Simulated Dialogue Branch Configuration</div>
            <div>
              <label className="block text-slate-400 mb-1">Scammer Opener Dialogue *</label>
              <input
                type="text"
                required
                placeholder="e.g. 'Hey bro, come check out this drop party in level 4 wildy!'"
                value={scammerOpener}
                onChange={e => setScammerOpener(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-emerald-400 mb-1">Defensive Choice (Safe Branch)</label>
                <input
                  type="text"
                  placeholder="e.g. 'No thanks, I don't enter the wilderness with items.'"
                  value={safeOption}
                  onChange={e => setSafeOption(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-emerald-900/50 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-rose-400 mb-1">Vulnerable Choice (Compromised Branch)</label>
                <input
                  type="text"
                  placeholder="e.g. 'Okay, I will bring my bank and follow you!'"
                  value={riskyOption}
                  onChange={e => setRiskyOption(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-rose-900/50 rounded text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded shadow-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Scenario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
