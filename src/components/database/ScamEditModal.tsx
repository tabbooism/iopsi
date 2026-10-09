import React, { useState, useEffect } from 'react';
import { ScamProfile, ScamCategory, TargetAssetType, DifficultyLevel } from '../../types';
import { calculateCompositeRisk } from '../../data/defaultScams';
import { X, Save, Edit3, ShieldAlert } from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';

interface ScamEditModalProps {
  scam: ScamProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ScamProfile) => void;
}

export const ScamEditModal: React.FC<ScamEditModalProps> = ({
  scam,
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
  const [assetValueRating, setAssetValueRating] = useState(6);
  const [technicalComplexity, setTechnicalComplexity] = useState(4);
  const [mitreTechniques, setMitreTechniques] = useState('');
  const [jagexRules, setJagexRules] = useState('');
  const [defenseTips, setDefenseTips] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (scam) {
      setName(scam.name);
      setType(scam.type);
      setTargetAsset(scam.targetAsset);
      setNarrative(scam.narrative);
      setDifficulty(scam.difficulty);
      setSuccessRate(scam.successRate);
      setAssetValueRating(scam.assetValueRating);
      setTechnicalComplexity(scam.technicalComplexity);
      setMitreTechniques(scam.mitreTechniques.join(', '));
      setJagexRules(scam.jagexRules.join(', '));
      setDefenseTips(scam.defenseTips.join('\n'));
      setTags(scam.tags.join(', '));
    } else {
      setName('');
      setType('Social Engineering');
      setTargetAsset('GP');
      setNarrative('');
      setDifficulty('Novice');
      setSuccessRate(40);
      setAssetValueRating(5);
      setTechnicalComplexity(3);
      setMitreTechniques('T1566: Phishing');
      setJagexRules('Rule 1: Scamming');
      setDefenseTips('Always verify trade values.');
      setTags('Social Engineering, New');
    }
  }, [scam, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !narrative.trim()) {
      toast.notify('Name and narrative are required.', 'warning');
      return;
    }

    const calculatedRiskScore = calculateCompositeRisk(successRate, assetValueRating, technicalComplexity);

    const saved: ScamProfile = {
      id: scam ? scam.id : 'scam_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      type,
      targetAsset,
      narrative: narrative.trim(),
      difficulty,
      successRate,
      assetValueRating,
      technicalComplexity,
      calculatedRiskScore,
      mitreTechniques: mitreTechniques.split(',').map(s => s.trim()).filter(Boolean),
      jagexRules: jagexRules.split(',').map(s => s.trim()).filter(Boolean),
      cognitiveBiases: scam?.cognitiveBiases || ['Social Proof', 'Greed Bias'],
      defenseTips: defenseTips.split('\n').map(s => s.trim()).filter(Boolean),
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      redFlags: scam?.redFlags || [],
      dialogueTree: scam?.dialogueTree || [
        {
          id: 'node_start',
          speaker: 'scammer',
          speakerName: 'SusPlayer',
          text: 'Trade me for a free giveaway!',
          suspicionImpact: 20,
          options: [
            { text: 'Decline trade', nextNodeId: 'node_safe_exit', riskImpact: 'safe', explanation: 'Defended' },
            { text: 'Accept trade', nextNodeId: 'node_loss_exit', riskImpact: 'fatal', explanation: 'Compromised' }
          ]
        },
        { id: 'node_safe_exit', speaker: 'system', speakerName: 'System', text: 'Neutralized', isTerminal: true, outcome: 'foiled', suspicionImpact: 0 },
        { id: 'node_loss_exit', speaker: 'system', speakerName: 'System', text: 'Compromised', isTerminal: true, outcome: 'compromised', suspicionImpact: 100 }
      ],
      createdAt: scam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sound.playSuccess();
    onSave(saved);
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
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">
              {scam ? 'Edit Threat Profile' : 'Create New Threat Profile'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Threat Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category Vector</label>
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
              rows={3}
              required
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
              <label className="block text-slate-300 font-semibold mb-1">Recorded Success Rate ({successRate}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={successRate}
                onChange={e => setSuccessRate(Number(e.target.value))}
                className="w-full mt-2 accent-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Asset Value Rating (1-10): {assetValueRating}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={assetValueRating}
                onChange={e => setAssetValueRating(Number(e.target.value))}
                className="w-full mt-2 accent-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Technical Complexity (1-10): {technicalComplexity}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={technicalComplexity}
                onChange={e => setTechnicalComplexity(Number(e.target.value))}
                className="w-full mt-2 accent-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">MITRE ATT&CK Techniques (comma-separated)</label>
            <input
              type="text"
              value={mitreTechniques}
              onChange={e => setMitreTechniques(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Jagex Rules (comma-separated)</label>
            <input
              type="text"
              value={jagexRules}
              onChange={e => setJagexRules(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Defense Avoidance Tips (one per line)</label>
            <textarea
              rows={2}
              value={defenseTips}
              onChange={e => setDefenseTips(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Taxonomy Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
            />
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
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
