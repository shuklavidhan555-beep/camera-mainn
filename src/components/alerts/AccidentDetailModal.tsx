import React, { useState } from 'react';
import { SafetyAlert } from '../../types';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { 
  X, 
  CheckCircle, 
  CheckCircle2,
  ShieldAlert, 
  Sparkles,
  Car,
  Camera,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccidentDetailModalProps {
  alert: SafetyAlert | null;
  onClose: () => void;
}

export const AccidentDetailModal: React.FC<AccidentDetailModalProps> = ({ alert, onClose }) => {
  const { 
    verifyIncidentDetection, 
    flagForSecurityAudit, 
    exportForensicReport, 
    cameras, 
    setSelectedCamera 
  } = useCommandCenter();

  const [mediaMode, setMediaMode] = useState<'video' | 'snapshot'>('snapshot');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!alert) return null;

  const resolvedVideoUrl = (alert.videoUrl && (alert.videoUrl.endsWith('.mov') || alert.videoUrl.includes('cam_ai_stream.mov')))
    ? '/videos/cam_highway_collision.mp4'
    : alert.videoUrl;

  const relatedCamera = cameras.find((c) => c.id === alert.cameraId);
  const isVerified = alert.acknowledged || alert.auditStatus === 'verified';
  const isFlagged = alert.auditStatus === 'flagged';

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      verifyIncidentDetection(alert.id);
      setIsVerifying(false);
    }, 350);
  };

  const handleInspectFeed = () => {
    if (relatedCamera) {
      setSelectedCamera(relatedCamera);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b101c] border border-red-500/60 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Surveillance Incident Header Bar */}
        <div className="p-4 bg-red-950/70 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                  SURVEILLANCE HAZARD // {alert.severity}
                </span>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {alert.type}: {alert.location}
                </h2>
              </div>
              <p className="text-xs text-red-200/80 font-mono mt-0.5">
                Incident ID: {alert.id} • Sensor Node: {alert.cameraId} {relatedCamera ? `(${relatedCamera.name})` : ''} • Detected: {alert.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white transition-colors"
            title="Close modal"
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
              {mediaMode === 'video' && resolvedVideoUrl ? (
                <video
                  ref={(el) => {
                    if (el) {
                      el.muted = true;
                      el.defaultMuted = true;
                      el.playsInline = true;
                      if (el.paused) {
                        el.play().catch(() => {});
                      }
                    }
                  }}
                  src={resolvedVideoUrl}
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
                  
                  {/* Bounding Box Simulation Overlay */}
                  <div className="absolute inset-0 p-4 pointer-events-none flex items-center justify-center">
                    <div className="border-2 border-red-500/90 rounded bg-red-500/10 w-3/4 h-3/5 relative animate-pulse">
                      <div className="absolute -top-6 left-0 bg-red-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shadow">
                        IMPACT HAZARD // {alert.confidence}%
                      </div>
                      <div className="absolute -bottom-5 right-0 bg-black/80 text-cyan-300 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700">
                        {alert.collisionType || 'MULTI-ENTITY CONFLICT'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                  <span>No recorded media stream for camera {alert.cameraId}</span>
                </div>
              )}

              {/* Watermark & Timestamp Overlay */}
              <div className="absolute top-3 left-3 bg-black/75 px-2.5 py-1 rounded text-[11px] font-mono text-cyan-300 border border-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>REC • SENSOR {alert.cameraId} • {alert.timestamp}</span>
              </div>
            </div>

            {/* Kinematic Collision Vector Telemetry Pill */}
            {(alert.collisionType || alert.hazardStatus || alert.timeToCollisionSec !== undefined) && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/60 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-red-200">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>Kinematic Radar Telemetry: {alert.collisionType || 'Multi-Entity Collision'}</span>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-900 text-red-100 font-bold">
                    {alert.hazardStatus || 'CRITICAL HAZARD'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-red-900/40 text-center">
                  <div className="p-1.5 rounded bg-black/40 border border-red-900/40">
                    <span className="text-[10px] text-slate-400 block">Time To Collision (TTC)</span>
                    <span className="text-red-400 font-bold">
                      {alert.timeToCollisionSec !== undefined ? `${alert.timeToCollisionSec}s` : '0.28s'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-red-900/40">
                    <span className="text-[10px] text-slate-400 block">Proximity Distance</span>
                    <span className="text-amber-300 font-bold">
                      {alert.proximityMeters !== undefined ? `${alert.proximityMeters}m` : '1.4m'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-black/40 border border-red-900/40">
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
                <Sparkles className="w-3.5 h-3.5" /> AI Optical & Kinematic Forensic Assessment:
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
                  <span className="text-cyan-400 font-bold">12:34:08 PM</span> - Target trajectory intersection detected on camera node (Speed: 54 km/h)
                </div>
                <div className="text-red-400 font-bold">
                  <span>12:34:11 PM</span> - Lateral impact confirmed with target vehicle. Airbag deployment optical signature detected.
                </div>
                <div className="text-slate-300">
                  <span className="text-amber-400 font-bold">12:34:13 PM</span> - Computer Vision neural net logged incident with {alert.confidence}% confidence score.
                </div>
                {isVerified && (
                  <div className="text-emerald-400 font-bold">
                    <span>{alert.verifiedAt || alert.timestamp}</span> - Incident detection verified and logged to surveillance security audit ledger.
                  </div>
                )}
                {isFlagged && (
                  <div className="text-amber-400 font-bold">
                    <span>{alert.timestamp}</span> - Incident queued for priority forensic security audit.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Forensic Review & Audit Controls */}
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

              {/* Security Audit Status Card */}
              {isVerified ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm font-mono text-emerald-400">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    SECURITY AUDIT VERIFIED
                  </div>
                  <div className="text-xs font-mono space-y-1 text-slate-300">
                    <div>Audited By: {alert.verifiedBy || 'Surveillance Operator #402'}</div>
                    <div>Audit Logged: {alert.verifiedAt || alert.timestamp}</div>
                    <div className="text-cyan-300 font-bold">Audit Hash: SHA256:{alert.id.replace('INC-', '')}-SURV-OK</div>
                  </div>
                </div>
              ) : isFlagged ? (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm font-mono text-amber-400">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    QUEUED FOR SECURITY AUDIT
                  </div>
                  <p className="text-xs font-mono text-slate-300">
                    Flagged for forensic investigation, optical telemetry review, and multi-camera corroboration.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm font-mono text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    PENDING OPERATOR VERIFICATION
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    Optical sensor incident logged by neural detector. Awaiting operator forensic review and confirmation.
                  </p>
                </div>
              )}
            </div>

            {/* Surveillance Workflow Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {!isVerified ? (
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerify}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950"
                  title="Acknowledge and verify incident in security ledger"
                >
                  <CheckCircle className={cn("w-4 h-4", isVerifying && "animate-spin")} />
                  {isVerifying ? 'Logging Verification...' : 'Acknowledge Incident Detection'}
                </button>
              ) : (
                <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 font-mono text-xs text-center flex items-center justify-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Incident Acknowledged & Logged
                </div>
              )}

              <button
                type="button"
                onClick={handleInspectFeed}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                title="Inspect CCTV Feed"
              >
                <Camera className="w-4 h-4" /> Inspect CCTV Feed
              </button>

              <button
                type="button"
                disabled={isFlagged}
                onClick={() => flagForSecurityAudit(alert.id)}
                className={cn(
                  "w-full py-2 px-3 rounded-lg font-mono text-xs flex items-center justify-center gap-2 transition-colors border",
                  isFlagged
                    ? "bg-amber-950/40 border-amber-600/50 text-amber-300 cursor-default"
                    : "bg-slate-800 hover:bg-amber-950/40 text-amber-300 border-slate-700 hover:border-amber-700"
                )}
                title="Flag for Security Audit"
              >
                <FileText className="w-4 h-4" /> {isFlagged ? 'Flagged for Security Audit' : 'Flag for Security Audit'}
              </button>

              <button
                type="button"
                onClick={() => exportForensicReport(alert.id)}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                title="Export Forensic Report"
              >
                <Download className="w-4 h-4" /> Export Forensic Report
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-xs transition-colors"
              >
                Close Forensic View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
