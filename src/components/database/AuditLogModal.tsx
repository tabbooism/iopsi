import React from 'react';
import { AuditEntry } from '../../types';
import { History, X, Clock, Trash2 } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditEntry[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-white">Database Revision History & Audit Trail</h3>
              <p className="text-xs text-slate-400">Recorded mutations, schema updates, and procedural generations</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-800/80">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No audit records logged yet.</div>
          ) : (
            logs.map(entry => (
              <div key={entry.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-amber-400 font-semibold">{entry.action}</span>
                    <span className="text-[11px] text-slate-500 font-mono">[{entry.timestamp}]</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {entry.details}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
