import React, { useState } from 'react';
import { ScamProfile } from '../../types';
import { Flag, X, Shield, CheckCircle2 } from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';
import { Storage } from '../../lib/storage';

interface AbuseReportModalProps {
  scam: ScamProfile;
  isOpen: boolean;
  onClose: () => void;
  onReportFiled: () => void;
}

const JAGEX_REPORT_CATEGORIES = [
  'Rule 1: Scamming',
  'Rule 2: Buying or Selling an Account',
  'Rule 7: Macroing, Botting, or Third-Party Software',
  'Rule 10: False Information / Hoaxing',
  'Rule 11: Real-World Trading (RWT)',
  'Rule 14: Impersonation of Jagex Staff / Moderation',
  'Inappropriate Chat / Offensive Language',
  'Encouraging Rule Breaking'
];

export const AbuseReportModal: React.FC<AbuseReportModalProps> = ({
  scam,
  isOpen,
  onClose,
  onReportFiled
}) => {
  const perpetrator = scam.dialogueTree.find(n => n.speaker === 'scammer')?.speakerName || 'Doubler_Chad99';
  const [targetName, setTargetName] = useState(perpetrator);
  const [selectedRule, setSelectedRule] = useState(JAGEX_REPORT_CATEGORIES[0]);
  const [evidenceSnippet, setEvidenceSnippet] = useState(
    scam.dialogueTree.find(n => n.speaker === 'scammer')?.text || ''
  );
  const [isMuting, setIsMuting] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();

    // Check if the selected category matches any of the scam's recorded jagex rules
    const isAccurate = scam.jagexRules.some(r => 
      selectedRule.toLowerCase().includes(r.toLowerCase().split(':')[0]) ||
      r.toLowerCase().includes(selectedRule.toLowerCase().split(':')[0])
    );

    Storage.saveReport({
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      ruleCategory: selectedRule,
      perpetratorName: targetName,
      evidenceSnippet,
      scamId: scam.id,
      submittedAt: new Date().toLocaleTimeString(),
      status: 'Accepted'
    });

    Storage.addAudit('CREATE', `Abuse report submitted against ${targetName} for ${selectedRule}.`, scam.id);

    if (isAccurate) {
      toast.notify(`Report logged! Accurate Jagex Rule category selected (${selectedRule}).`, 'success');
    } else {
      toast.notify(`Report logged. Note: Recommended primary rule for this vector was ${scam.jagexRules[0] || 'Rule 1: Scamming'}.`, 'info');
    }

    onReportFiled();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-amber-950/20 border-2 border-amber-700/80 rounded-lg shadow-2xl p-0.5 overflow-hidden"
        style={{
          boxShadow: '0 0 35px rgba(0, 0, 0, 0.9), inset 0 0 10px rgba(180, 83, 9, 0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-900 border border-amber-900/60 rounded p-6">
          {/* OSRS Classic Report Header */}
          <div className="flex items-center justify-between pb-4 border-b border-amber-900/40">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-amber-400 font-mono tracking-wide">
                  REPORT ABUSE INTERFACE
                </h3>
                <p className="text-[11px] text-amber-200/70 font-mono">
                  Jagex Player Safety System · Section 4.1
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-amber-500/70 hover:text-amber-300 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-mono">
            {/* Target Player */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Name of Offender:
              </label>
              <input
                type="text"
                value={targetName}
                onChange={e => setTargetName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Offence Categories */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Select Primary Rule Violation:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {JAGEX_REPORT_CATEGORIES.map(cat => {
                  const isSelected = selectedRule === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedRule(cat);
                      }}
                      className={`text-left p-2 rounded border text-[11px] transition-all leading-tight ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evidence Text Snippet */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Attached Chat Transcript Snippet:
              </label>
              <textarea
                rows={3}
                value={evidenceSnippet}
                onChange={e => setEvidenceSnippet(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-amber-500 text-xs"
                placeholder="Paste or review the offending dialogue..."
              />
            </div>

            {/* Options */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="muteCheck"
                checked={isMuting}
                onChange={e => setIsMuting(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 bg-slate-950"
              />
              <label htmlFor="muteCheck" className="text-slate-400 text-xs cursor-pointer">
                Also add offender to local Ignore List (Mute public chat)
              </label>
            </div>

            {/* Submit buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 font-sans">
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
                <Flag className="w-3.5 h-3.5" />
                Submit Abuse Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
