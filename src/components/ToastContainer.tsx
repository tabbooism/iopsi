import React, { useEffect, useState } from 'react';
import { toast, ToastItem } from '../lib/toast';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe(updated => setToasts(updated));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
    >
      {toasts.map(t => {
        let bg = 'bg-slate-900 border-slate-700 text-slate-100';
        let Icon = Info;
        let iconColor = 'text-sky-400';

        if (t.type === 'success') {
          bg = 'bg-emerald-950/90 border-emerald-600/60 text-emerald-100';
          Icon = CheckCircle;
          iconColor = 'text-emerald-400';
        } else if (t.type === 'warning') {
          bg = 'bg-amber-950/90 border-amber-600/60 text-amber-100';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (t.type === 'error') {
          bg = 'bg-rose-950/90 border-rose-600/60 text-rose-100';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        }

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-sm transition-all duration-200 text-sm animate-in fade-in slide-in-from-bottom-2 ${bg}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 font-medium leading-snug">{t.message}</div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-white shrink-0 p-0.5 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
