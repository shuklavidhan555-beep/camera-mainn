import React from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { Siren, ArrowRight, X } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  const { 
    safetyAlerts, 
    emergencyBannerOpen, 
    setEmergencyBannerOpen, 
    setSelectedAlertForModal 
  } = useCommandCenter();

  const criticalAlert = safetyAlerts.find((a) => a.severity === 'Critical' && !a.acknowledged);

  if (!emergencyBannerOpen || !criticalAlert) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b border-red-700/80 px-4 py-2 flex items-center justify-between text-xs text-white shadow-lg animate-in slide-in-from-top duration-200 z-40">
      <div className="flex items-center gap-2.5 truncate">
        <span className="p-1 rounded bg-red-600 animate-pulse text-white shrink-0">
          <Siren className="w-3.5 h-3.5" />
        </span>
        <span className="font-mono font-bold uppercase tracking-wider text-red-200 shrink-0">
          CRITICAL INCIDENT ALERT:
        </span>
        <span className="font-medium text-slate-100 truncate">
          {criticalAlert.type} at {criticalAlert.location} ({criticalAlert.timeAgo}) — AI Confidence: {criticalAlert.confidence}%
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button
          onClick={() => setSelectedAlertForModal(criticalAlert)}
          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 font-mono text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm"
        >
          Review & Dispatch <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => setEmergencyBannerOpen(false)}
          className="p-1 rounded text-red-300 hover:text-white transition-colors"
          title="Dismiss Banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
