import React from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { CheckCircle2, AlertTriangle, Info, Siren, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCommandCenter();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isCritical = toast.type === 'critical';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={cn(
              "p-3 rounded-xl border shadow-2xl backdrop-blur-md pointer-events-auto flex items-start gap-2.5 text-xs animate-in slide-in-from-bottom-2 duration-200",
              isCritical
                ? "bg-red-950/90 border-red-500 text-white glow-red"
                : isSuccess
                ? "bg-slate-900/95 border-emerald-500/60 text-slate-100"
                : isWarning
                ? "bg-slate-900/95 border-amber-500/60 text-slate-100"
                : "bg-slate-900/95 border-cyan-500/50 text-slate-100"
            )}
          >
            <div className="mt-0.5">
              {isCritical ? (
                <Siren className="w-4 h-4 text-red-400 animate-pulse" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 font-mono">
              <div className="font-bold text-white tracking-wide">{toast.title}</div>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
