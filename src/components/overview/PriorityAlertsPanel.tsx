import React from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { SafetyAlert } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Camera, 
  ShieldAlert,
  ArrowRight,
  Flame
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const PriorityAlertsPanel: React.FC = () => {
  const { 
    safetyAlerts, 
    acknowledgeAlert, 
    setSelectedCamera, 
    setSelectedAlertForModal,
    cameras, 
    setActiveTab 
  } = useCommandCenter();

  // Show top priority unacknowledged or critical alerts
  const priorityAlerts = safetyAlerts.slice(0, 4);

  const handleViewFeed = (alert: SafetyAlert) => {
    const cam = cameras.find((c) => c.id === alert.cameraId);
    if (cam) {
      setSelectedCamera(cam);
    }
  };

  const handleInspectIncident = (alert: SafetyAlert) => {
    setSelectedAlertForModal(alert);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1424] flex flex-col h-[460px] shadow-lg overflow-hidden">
      {/* Panel Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-red-500/20 text-red-400">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Priority Safety Alerts</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800 animate-pulse">
                {safetyAlerts.filter((a) => !a.acknowledged && (a.severity === 'Critical' || a.severity === 'High')).length} UNRESOLVED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">AI Computer Vision anomaly detection stream</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('alerts')}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono hover:underline"
        >
          All Alerts <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Alert Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {priorityAlerts.map((alert) => {
          const isCritical = alert.severity === 'Critical';
          const isHigh = alert.severity === 'High';

          return (
            <div
              key={alert.id}
              className={cn(
                "p-3 rounded-lg border transition-all text-xs flex flex-col gap-2 relative group",
                alert.acknowledged
                  ? "bg-slate-900/40 border-slate-800/80 opacity-75"
                  : isCritical
                  ? "bg-red-950/30 border-red-500/50 hover:border-red-400 hover:bg-red-950/40 glow-red"
                  : isHigh
                  ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              )}
            >
              {/* Alert Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider",
                    isCritical
                      ? "bg-red-600 text-white"
                      : isHigh
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-blue-600 text-white"
                  )}>
                    {alert.severity}
                  </span>
                  <span className="font-semibold text-white truncate max-w-[160px]">
                    {alert.type}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{alert.timeAgo}</span>
                </div>
              </div>

              {/* AI Explanation / Context */}
              <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                {alert.aiExplanation}
              </p>

              {/* Location & Camera Tag */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                <div className="flex items-center gap-1 truncate max-w-[180px]">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{alert.location}</span>
                </div>

                <div className="flex items-center gap-1 text-slate-300 shrink-0">
                  <Camera className="w-3 h-3 text-slate-500" />
                  <span>{alert.cameraId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleViewFeed(alert)}
                  className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 font-mono text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <Camera className="w-3 h-3" /> View Feed
                </button>

                {alert.type === 'Traffic Accident' ? (
                  <button
                    type="button"
                    onClick={() => handleInspectIncident(alert)}
                    className="flex-1 py-1 px-2 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] flex items-center justify-center gap-1 transition-colors font-medium shadow-sm"
                  >
                    <Flame className="w-3 h-3" /> Inspect & Dispatch
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={alert.acknowledged}
                    onClick={() => acknowledgeAlert(alert.id)}
                    className={cn(
                      "flex-1 py-1 px-2 rounded font-mono text-[11px] flex items-center justify-center gap-1 transition-colors",
                      alert.acknowledged
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium shadow-sm"
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
