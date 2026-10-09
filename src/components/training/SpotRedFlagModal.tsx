import React, { useState } from 'react';
import { ScamProfile } from '../../types';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, X, HelpCircle } from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';

interface SpotRedFlagModalProps {
  scam: ScamProfile;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (foundCount: number, totalCount: number) => void;
}

export const SpotRedFlagModal: React.FC<SpotRedFlagModalProps> = ({
  scam,
  isOpen,
  onClose,
  onComplete
}) => {
  const [clickedIds, setClickedIds] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const redFlags = scam.redFlags || [];
  const totalActualFlags = redFlags.filter(rf => rf.isRedFlag).length;

  const toggleSentence = (id: string) => {
    if (submitted) return;
    sound.playClick();
    setClickedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleEvaluate = () => {
    setSubmitted(true);
    let correctPicks = 0;
    let falsePositives = 0;

    redFlags.forEach(rf => {
      const wasClicked = !!clickedIds[rf.id];
      if (rf.isRedFlag && wasClicked) {
        correctPicks++;
      } else if (!rf.isRedFlag && wasClicked) {
        falsePositives++;
      }
    });

    if (correctPicks === totalActualFlags && falsePositives === 0) {
      toast.notify('Flawless Forensic Analysis! All deceptive patterns identified.', 'success');
      sound.playSuccess();
    } else {
      toast.notify(`Analysis complete: ${correctPicks}/${totalActualFlags} red flags caught.`, 'info');
      sound.playBlip();
    }

    onComplete(correctPicks, totalActualFlags);
  };

  const handleReset = () => {
    setClickedIds({});
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Interactive Forensic Review: "Spot the Red Flag"</h3>
              <p className="text-xs text-slate-400">
                Click lines containing psychological manipulation, pretexting, or rule-breaking cues.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Forensic Instructions:</strong> Read through this extracted transcript from <em>{scam.name}</em>. Click on sentences you suspect are social engineering bait (urgency, social proof, false authority, or mechanic misdirection).
            </span>
          </div>

          <div className="space-y-3">
            {redFlags.map(rf => {
              const isSelected = !!clickedIds[rf.id];
              let borderColor = 'border-slate-800 hover:border-slate-700 bg-slate-950/40';
              let badge = null;

              if (isSelected && !submitted) {
                borderColor = 'border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/30';
              }

              if (submitted) {
                if (rf.isRedFlag && isSelected) {
                  // Correctly identified
                  borderColor = 'border-emerald-500/80 bg-emerald-950/30';
                  badge = (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correctly Flagged ({rf.biasType})
                    </span>
                  );
                } else if (rf.isRedFlag && !isSelected) {
                  // Missed red flag
                  borderColor = 'border-amber-500/80 bg-amber-950/30';
                  badge = (
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Missed Deception ({rf.biasType})
                    </span>
                  );
                } else if (!rf.isRedFlag && isSelected) {
                  // False positive
                  borderColor = 'border-rose-500/80 bg-rose-950/30';
                  badge = (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                      <XCircle className="w-3.5 h-3.5" /> False Alarm (Benign text)
                    </span>
                  );
                }
              }

              return (
                <div
                  key={rf.id}
                  onClick={() => toggleSentence(rf.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${borderColor}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-mono text-slate-200 leading-relaxed">
                      {rf.sentence}
                    </p>
                    <div className="shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 pointer-events-none"
                      />
                    </div>
                  </div>

                  {badge && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      {badge}
                      <span className="text-slate-400 italic text-[11px]">{rf.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Selected: <span className="text-white font-semibold font-mono">{Object.values(clickedIds).filter(Boolean).length}</span> candidate cues
          </div>
          <div className="flex items-center gap-2.5">
            {submitted ? (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Reset & Try Again
              </button>
            ) : (
              <button
                onClick={handleEvaluate}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Evaluate Red Flags
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
