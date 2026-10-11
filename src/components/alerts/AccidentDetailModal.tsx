import React, { useState } from 'react';
import { SafetyAlert } from '../../types';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { 
  X, 
  CheckCircle, 
  Siren, 
  Sparkles,
  Car,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccidentDetailModalProps {
  alert: SafetyAlert | null;
  onClose: () => void;
}

export const AccidentDetailModal: React.FC<AccidentDetailModalProps> = ({ alert, onClose }) => {
  const { dispatchEmergencyTeam, acknowledgeAlert, cameras } = useCommandCenter();
  const [selectedUnit, setSelectedUnit] = useState<string>('EMS Ambulance + Highway Patrol');
  const [isDispatching, setIsDispatching] = useState(false);
  const [mediaMode, setMediaMode] = useState<'video' | 'snapshot'>('snapshot');

  if (!alert) return null;

  const handleDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      dispatchEmergencyTeam(alert.id, selectedUnit);
      setIsDispatching(false);
    }, 900);
  };

  const isDispatched = alert.dispatchedStatus === 'dispatched';
  const relatedCamera = cameras.find((c) => c.id === alert.cameraId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b101c] border border-red-500/60 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Emergency Bar */}
        <div className="p-4 bg-red-950/70 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white animate-pulse">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                  PRIORITY 1 // {alert.severity}
                </span>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {alert.type}: {alert.location}
                </h2>
              </div>
              <p className="text-xs text-red-200/80 font-mono mt-0.5">
                Incident ID: {alert.id} • Camera: {alert.cameraId} {relatedCamera ? `(${relatedCamera.name})` : ''} • Triggered: {alert.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-y-auto">
          {/* Left 2 Cols: Incident Video Replay & Bounding Box Snapshot */}
          <div className="lg:col-span-2 p-5 bg-black/50 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col gap-4">
            {/* Media Mode Switcher if video is available */}
            {alert.videoUrl && (
              <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">Evidence Source:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMediaMode('snapshot')}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                      mediaMode === 'snapshot' ? "bg-red-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    )}
                  >
                    Forensic Frame
                  </button>
                  <button
                    onClick={() => setMediaMode('video')}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                      mediaMode === 'video' ? "bg-red-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    )}
                  >
                    CCTV Incident Stream
                  </button>
                </div>
              </div>
            )}

            {/* Incident Frame Player */}
            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-red-500/70 bg-slate-950 shadow-2xl group">
              {mediaMode === 'video' && alert.videoUrl ? (
                <video
                  src={alert.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : alert.imageUrl ? (
                <>
                  <img
                    src={alert.imageUrl}
                    alt={alert.type}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle CCTV Scanline & Vignette */}
                  <div className="absolute inset-0 cctv-scanline opacity-30 pointer-events-none" />
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]" />

                  {/* Dynamic Tactical AI Overlays on Image */}
                  <div 
                    className="absolute border-2 border-red-500 bg-red-500/15 p-1 flex flex-col justify-between pointer-events-none animate-pulse"
                    style={{ left: '28%', top: '38%', width: '38%', height: '35%' }}
                  >
                    <div className="flex items-center gap-1 -translate-y-4">
                      <span className="bg-red-600 text-white font-mono font-bold text-[9px] px-1 py-0.2 rounded shadow">
                        IMPACT CRITICAL [{alert.confidence}%]
                      </span>
                    </div>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-400" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-400" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-400" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-400" />
                  </div>
                </>
              ) : (
                /* Fallback Edge Vector Tactical Map */
                <svg className="w-full h-full object-cover" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#0d1424" />
                  <rect x="25" y="0" width="50" height="100" fill="#141c2e" />
                  <rect x="0" y="25" width="100" height="50" fill="#141c2e" />
                  <circle cx="48" cy="45" r="14" fill="#ef4444" opacity="0.3" className="animate-ping" />
                  <circle cx="48" cy="45" r="8" fill="#f59e0b" opacity="0.5" />
                  <circle cx="48" cy="45" r="3" fill="#ffffff" />
                  <text x="35" y="47" fill="#ffffff" fontSize="4" fontFamily="monospace" fontWeight="bold">COLLISION POINT</text>
                </svg>
              )}

              {/* HUD Timestamp & Watermark */}
              <div className="absolute top-2 left-2 flex items-center gap-2 text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-white border border-red-500/50 backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-blink" />
                <span>INCIDENT EVIDENCE SNAPSHOT // {alert.timestamp}</span>
              </div>

              <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-cyan-300 border border-slate-700 backdrop-blur">
                AI CONFIDENCE: {alert.confidence}%
              </div>
            </div>

            {/* Multi-Entity Kinematic Collision Card */}
            {(alert.collisionType || alert.hazardStatus || alert.proximityMeters !== undefined) && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/60 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-red-300 font-bold">
                    <Activity className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    Kinematic Multi-Entity Collision Telemetry
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    alert.hazardStatus?.includes('Critical') ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                  )}>
                    {alert.hazardStatus || 'Critical: Active Collision'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded bg-black/60 border border-red-900/60">
                    <span className="text-[10px] text-slate-400 block">Scenario</span>
                    <span className="text-white font-bold">{alert.collisionType || 'Multi-Entity Hazard'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-red-900/60">
                    <span className="text-[10px] text-slate-400 block">Time-To-Collision</span>
                    <span className={cn(
                      "font-bold",
                      alert.timeToCollisionSec !== undefined && alert.timeToCollisionSec < 1.0 ? "text-red-400" : "text-amber-300"
                    )}>
                      {alert.timeToCollisionSec !== undefined ? `${alert.timeToCollisionSec}s` : '0.0s (Impact)'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-red-900/60">
                    <span className="text-[10px] text-slate-400 block">Spatial Proximity</span>
                    <span className="text-cyan-300 font-bold">
                      {alert.proximityMeters !== undefined ? `${alert.proximityMeters}m` : '0.4m'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-red-900/60">
                    <span className="text-[10px] text-slate-400 block">Closure Speed</span>
                    <span className="text-amber-400 font-bold">
                      {alert.relativeClosureSpeedKmH !== undefined ? `${alert.relativeClosureSpeedKmH} km/h` : '62.4 km/h'}
                    </span>
                  </div>
                </div>

                {alert.interactingObjectIds && alert.interactingObjectIds.length > 0 && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-red-900/40">
                    <span>Interacting Vector Nodes:</span>
                    <span className="text-white font-bold">{alert.interactingObjectIds.join(' ↔ ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* AI Explanation Callout */}
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 text-xs">
              <div className="flex items-center gap-1.5 text-red-300 font-bold mb-1 font-mono">
                <Sparkles className="w-3.5 h-3.5" /> AI Forensic Assessment:
              </div>
              <p className="text-slate-200 leading-relaxed">
                {alert.aiExplanation}
              </p>
            </div>

            {/* Incident Event Timeline */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 font-bold mb-2 block">TEMPORAL LOG RECONSTRUCTION:</span>
              <div className="space-y-2 border-l border-slate-800 pl-3">
                <div className="text-slate-300">
                  <span className="text-cyan-400 font-bold">12:34:08 PM</span> - Vehicle A enters intersection on red signal (Speed: 54 km/h)
                </div>
                <div className="text-red-400 font-bold">
                  <span>12:34:11 PM</span> - Lateral impact confirmed with Vehicle B. Airbag deployment signature detected.
                </div>
                <div className="text-slate-300">
                  <span className="text-amber-400 font-bold">12:34:13 PM</span> - Computer Vision neural net flags incident with 97.4% confidence score.
                </div>
                {isDispatched && (
                  <div className="text-emerald-400 font-bold">
                    <span>{alert.dispatchedAt || '12:35:00 PM'}</span> - Emergency Response dispatched by Operator.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Dispatch Actions & Units */}
          <div className="p-5 flex flex-col justify-between bg-[#0d1424] gap-4">
            <div className="space-y-4">
              {/* Confidence Score Pill */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">AI Confidence Score</span>
                  <span className="text-emerald-400 font-bold text-sm">{alert.confidence}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${alert.confidence}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">YOLOv11-Urban + ImpactDetector Ensemble</span>
              </div>

              {/* Detected Vehicles & Entities List */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 font-bold">Entities Involved:</span>
                {alert.vehiclesInvolved.map((v, i) => {
                  const isAnimal = v.toLowerCase().includes('animal') || v.toLowerCase().includes('deer');
                  const isPed = v.toLowerCase().includes('pedestrian');
                  return (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between">
                      <span className="text-slate-200">{v}</span>
                      {isAnimal ? (
                        <span className="text-xs">🐾</span>
                      ) : isPed ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">PEDESTRIAN</span>
                      ) : (
                        <Car className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dispatch Unit Selector */}
              {!isDispatched ? (
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 font-bold block">
                    Select Response Package:
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="EMS Ambulance + Highway Patrol">EMS Ambulance + Highway Patrol (Code 3)</option>
                    <option value="Full Emergency Response (Fire, EMS, Police)">Full Emergency Response (Fire, EMS, Police)</option>
                    <option value="Traffic Diversion & Tow Squad">Traffic Diversion & Tow Squad</option>
                  </select>
                </div>
              ) : (
                /* Dispatched Status Badge */
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm font-mono text-emerald-400">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    EMERGENCY TEAM DISPATCHED
                  </div>
                  <div className="text-xs font-mono space-y-1 text-slate-300">
                    <div>Units: {alert.dispatchedUnits?.join(', ')}</div>
                    <div>Dispatched At: {alert.dispatchedAt}</div>
                    <div className="text-amber-300 font-bold">Estimated Arrival: 4 mins (GPS Tracking Active)</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {!isDispatched ? (
                <button
                  type="button"
                  disabled={isDispatching}
                  onClick={handleDispatch}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg glow-red"
                >
                  <Siren className={cn("w-4 h-4", isDispatching && "animate-spin")} />
                  {isDispatching ? 'Transmitting Dispatch Signal...' : 'Dispatch Emergency Team'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition-colors"
                >
                  Return to Dashboard
                </button>
              )}

              {!alert.acknowledged && !isDispatched && (
                <button
                  type="button"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  Acknowledge Without Dispatch
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
