import React, { useState, useMemo } from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { AlertSeverity } from '../../types';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Flame, 
  Clock, 
  MapPin, 
  Camera, 
  Search, 
  Siren,
  Car,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RealTimeStreamControlBar } from '../common/RealTimeStreamControlBar';

export const SafetyAlertsPage: React.FC = () => {
  const { 
    safetyAlerts, 
    acknowledgeAlert, 
    setSelectedCamera, 
    cameras, 
    setSelectedAlertForModal,
    ingestRealTimeIncident,
    triggerSimulatedCollisionAlert
  } = useCommandCenter();

  const [severityFilter, setSeverityFilter] = useState<'All' | AlertSeverity | 'Acknowledged'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    return safetyAlerts.filter((alert) => {
      // Severity Filter
      if (severityFilter === 'Acknowledged') {
        if (!alert.acknowledged) return false;
      } else if (severityFilter !== 'All') {
        if (alert.severity !== severityFilter) return false;
      }

      // Type Filter
      if (typeFilter === 'Kinematic Hazards') {
        if (!alert.collisionType && !alert.hazardStatus) return false;
      } else if (typeFilter !== 'All' && alert.type !== typeFilter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLoc = alert.location.toLowerCase().includes(q);
        const matchesType = alert.type.toLowerCase().includes(q);
        const matchesCam = alert.cameraId.toLowerCase().includes(q);
        const matchesExpl = alert.aiExplanation.toLowerCase().includes(q);
        if (!matchesLoc && !matchesType && !matchesCam && !matchesExpl) return false;
      }

      return true;
    });
  }, [safetyAlerts, severityFilter, typeFilter, searchQuery]);

  const criticalCount = safetyAlerts.filter((a) => a.severity === 'Critical' && !a.acknowledged).length;
  const highCount = safetyAlerts.filter((a) => a.severity === 'High' && !a.acknowledged).length;
  const mediumCount = safetyAlerts.filter((a) => a.severity === 'Medium' && !a.acknowledged).length;
  const ackCount = safetyAlerts.filter((a) => a.acknowledged).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Live Real-Time Telemetry Stream Controls & HUD */}
      <RealTimeStreamControlBar />

      {/* Header Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Public Safety & Incident Log</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                {safetyAlerts.filter((a) => !a.acknowledged).length} ACTIVE INCIDENTS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous computer vision violation detection and real-time emergency dispatch nexus
            </p>
          </div>
        </div>

        {/* Real-time Incident Influx Stream Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto">
          <button
            onClick={() => ingestRealTimeIncident()}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/80 font-mono text-[11px] flex items-center gap-1 transition-colors shadow"
            title="Stream next real incident from Sentinel confirmed database"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> +Stream Real Incident
          </button>
          <button
            onClick={() => triggerSimulatedCollisionAlert('Vehicle-Pedestrian')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700/80 font-mono text-[11px] flex items-center gap-1 transition-colors shadow"
            title="Stream vehicle-pedestrian conflict telemetry"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> +Veh↔Ped Hazard
          </button>
          <button
            onClick={() => triggerSimulatedCollisionAlert('Vehicle-Animal')}
            className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/80 font-mono text-[11px] flex items-center gap-1 transition-colors shadow"
            title="Stream roadway wildlife intrusion telemetry"
          >
            <span>🐾</span> +Veh↔Animal Intrusion
          </button>
          <button
            onClick={() => ingestRealTimeIncident()}
            className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] flex items-center gap-1 transition-colors"
            title="Stream next telemetry violation event"
          >
            <Siren className="w-3.5 h-3.5 text-cyan-400" /> Telemetry Event
          </button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSeverityFilter('All')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border",
            severityFilter === 'All'
              ? "bg-slate-800 text-white border-slate-600 font-bold"
              : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-white"
          )}
        >
          All Alerts ({safetyAlerts.length})
        </button>

        <button
          onClick={() => setSeverityFilter('Critical')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-1.5",
            severityFilter === 'Critical'
              ? "bg-red-600 text-white border-red-500 font-bold glow-red"
              : "bg-red-950/30 text-red-300 border-red-900/50 hover:bg-red-950/50"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
          Critical ({criticalCount})
        </button>

        <button
          onClick={() => setSeverityFilter('High')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border",
            severityFilter === 'High'
              ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
              : "bg-amber-950/30 text-amber-300 border-amber-900/50 hover:bg-amber-950/50"
          )}
        >
          High ({highCount})
        </button>

        <button
          onClick={() => setSeverityFilter('Medium')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border",
            severityFilter === 'Medium'
              ? "bg-blue-600 text-white border-blue-500 font-bold"
              : "bg-blue-950/30 text-blue-300 border-blue-900/50 hover:bg-blue-950/50"
          )}
        >
          Medium ({mediumCount})
        </button>

        <button
          onClick={() => setSeverityFilter('Acknowledged')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-1",
            severityFilter === 'Acknowledged'
              ? "bg-emerald-600 text-white border-emerald-500 font-bold"
              : "bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/40"
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged ({ackCount})
        </button>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="p-3 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px] mr-1">Category:</span>
          {[
            { id: 'All', label: 'All Types' },
            { id: 'Kinematic Hazards', label: 'Collision Radar' },
            { id: 'Traffic Accident', label: 'Traffic Accident' },
            { id: 'Wrong-Way Vehicle', label: 'Wrong-Way' },
            { id: 'Overspeeding', label: 'Overspeeding' },
            { id: 'Pedestrian in Restricted Area', label: 'Pedestrian in Area' },
            { id: 'Illegal Parking', label: 'Illegal Parking' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors",
                typeFilter === cat.id
                  ? "bg-cyan-600 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident by text or sensor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
          />
        </div>
      </div>

      {/* Alerts Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-xl border border-dashed border-slate-800 bg-[#0d1424] text-slate-400 font-mono text-xs">
            No safety alerts match the selected criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'Critical';
            const isHigh = alert.severity === 'High';
            const isDispatched = alert.dispatchedStatus === 'dispatched';

            return (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col justify-between shadow-lg relative",
                  alert.acknowledged
                    ? "bg-slate-900/40 border-slate-800/80"
                    : isCritical
                    ? "bg-red-950/20 border-red-500/60 glow-red"
                    : isHigh
                    ? "bg-amber-950/20 border-amber-500/50"
                    : "bg-[#0d1424] border-slate-800 hover:border-slate-700"
                )}
              >
                <div>
                  {/* Top Bar with Thumbnail Placeholder & Badges */}
                  <div className="flex items-start gap-3">
                    {/* Incident Thumbnail */}
                    <div className="w-24 h-16 rounded-lg bg-slate-950 border border-slate-800 shrink-0 relative overflow-hidden flex items-center justify-center group/thumb">
                      {alert.imageUrl ? (
                        <>
                          <img
                            src={alert.imageUrl}
                            alt={alert.type}
                            className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
                          />
                          <div className="absolute inset-0 cctv-scanline opacity-30 pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 px-1 py-0.5 text-[8px] font-mono text-cyan-300 flex items-center justify-between">
                            <span>{alert.cameraId}</span>
                            <span>{alert.confidence}%</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 cctv-scanline opacity-50" />
                          <div className="text-[9px] font-mono text-cyan-400 text-center z-10 leading-tight">
                            <span className="block text-slate-400">{alert.cameraId}</span>
                            <span className="text-[8px] text-amber-300">CONF {alert.confidence}%</span>
                          </div>
                        </>
                      )}
                      {isCritical && (
                        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                          isCritical
                            ? "bg-red-600 text-white"
                            : isHigh
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-blue-600 text-white"
                        )}>
                          {alert.severity}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {alert.timeAgo}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-1 truncate">
                        {alert.type}
                      </h3>
                      <p className="text-xs text-cyan-400 font-mono truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {alert.location}
                      </p>
                    </div>
                  </div>

                  {/* AI Explanation Text */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
                    <span className="text-cyan-400 font-mono font-bold text-[10px] block mb-0.5">
                      AI INFERENCE EXPLANATION:
                    </span>
                    {alert.aiExplanation}
                  </div>

                  {/* Kinematic Collision Telemetry Pill */}
                  {(alert.collisionType || alert.hazardStatus || alert.timeToCollisionSec !== undefined) && (
                    <div className="mt-2.5 p-2 rounded-lg bg-red-950/30 border border-red-500/40 text-[11px] font-mono flex items-center justify-between text-red-200">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        {alert.collisionType || 'Multi-Entity Collision'}
                      </span>
                      <span className="text-amber-300 text-[10px]">
                        {alert.timeToCollisionSec !== undefined ? `TTC: ${alert.timeToCollisionSec}s` : 'Impact'}
                        {alert.proximityMeters !== undefined && ` • ${alert.proximityMeters}m`}
                        {alert.relativeClosureSpeedKmH !== undefined && ` • ${alert.relativeClosureSpeedKmH} km/h`}
                      </span>
                    </div>
                  )}

                  {/* Target details */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1 truncate max-w-[240px]">
                      <Car className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{alert.vehiclesInvolved.join(', ')}</span>
                    </div>
                    <span className="text-slate-500">{alert.timestamp}</span>
                  </div>

                  {/* Dispatched state notification */}
                  {isDispatched && (
                    <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Units En Route: {alert.dispatchedUnits?.[0]} (ETA: 4 mins)
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cam = cameras.find((c) => c.id === alert.cameraId);
                      if (cam) setSelectedCamera(cam);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" /> View Feed
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAlertForModal(alert)}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-lg font-mono text-xs flex items-center justify-center gap-1.5 transition-colors font-bold shadow-sm",
                      isCritical
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white"
                    )}
                  >
                    <Flame className="w-3.5 h-3.5" /> Incident Details
                  </button>

                  {!alert.acknowledged && (
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-emerald-900/50 hover:text-emerald-300 text-slate-300 font-mono text-xs transition-colors border border-slate-700"
                      title="Acknowledge alert without dispatch"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
