import React, { useState } from 'react';
import { CameraFeed } from '../../types';
import { CCTVFeedPlayer } from '../common/CCTVFeedPlayer';
import { 
  X, 
  Car, 
  Users, 
  RotateCw, 
  Cpu,
  TrendingUp,
  AlertTriangle,
  Video,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { modelInferenceService } from '../../services/modelInferenceService';

interface CameraDetailModalProps {
  camera: CameraFeed | null;
  onClose: () => void;
}

export const CameraDetailModal: React.FC<CameraDetailModalProps> = ({ camera, onClose }) => {
  const { rebootCamera, createDynamicSafetyAlert, setSelectedAlertForModal } = useCommandCenter();
  const [activeTab, setActiveTab] = useState<'detections' | 'telemetry' | 'events'>('detections');

  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b101c] border border-cyan-500/40 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(
              "w-3 h-3 rounded-full",
              camera.status === 'online' ? "bg-emerald-400" : camera.status === 'warning' ? "bg-amber-400 animate-pulse" : "bg-red-500"
            )} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  [{camera.id}] {camera.name}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  {camera.resolution} @ {camera.fps} FPS
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  IP: {camera.ip}
                </span>
              </div>
              <p className="text-xs text-slate-400">{camera.location} • Zone: {camera.zone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => rebootCamera(camera.id)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Soft reboot camera RTSP buffer"
            >
              <RotateCw className="w-3.5 h-3.5" /> Reboot Stream
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 hover:text-red-300 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split 2/3 Feed, 1/3 Analytics Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-y-auto">
          {/* Main Video Section */}
          <div className="lg:col-span-2 p-4 bg-black/40 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
              <CCTVFeedPlayer key={camera.id} camera={camera} isDetailed={true} showAiOverlayDefault={true} />
            </div>

            {/* AI Model Architecture & Telemetry Bar below player */}
            <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">INFERENCE LATENCY</span>
                <span className="text-cyan-400 font-bold text-sm">{camera.latencyMs} ms</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">VIDEO BITRATE</span>
                <span className="text-emerald-400 font-bold text-sm">4.85 Mbps CBR</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">CONGESTION SCORE</span>
                <span className={cn(
                  "font-bold text-sm",
                  camera.congestionScore > 75 ? "text-red-400" : camera.congestionScore > 50 ? "text-amber-400" : "text-emerald-400"
                )}>
                  {camera.congestionScore} / 100
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px]">ENCRYPTION / RTSP</span>
                <span className="text-slate-200 font-bold text-sm">TLS 1.3 / H.265</span>
              </div>
            </div>
          </div>

          {/* Right Detailed Monitoring Panel */}
          <div className="p-4 flex flex-col bg-[#0b101c] gap-4">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-mono">
                  <Car className="w-3.5 h-3.5" /> Vehicles In Frame
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {camera.vehicleCount}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-mono">
                  <Users className="w-3.5 h-3.5" /> Pedestrians
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {camera.pedestrianCount}
                </div>
              </div>
            </div>

            {/* Tabs for Panel */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs font-mono">
              <button
                onClick={() => setActiveTab('detections')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors",
                  activeTab === 'detections' ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Objects ({camera.objects.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors",
                  activeTab === 'events' ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Events ({camera.recentEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors",
                  activeTab === 'telemetry' ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                )}
              >
                AI Pipeline
              </button>
            </div>

            {/* Tab 1: Detected Objects List */}
            {/* Tab 1: Detected Objects List */}
            {activeTab === 'detections' && (() => {
              const stabilizedObjects = modelInferenceService.stabilizeDetections(camera.id, camera.objects || []);
              const activeInteractions = modelInferenceService.analyzeMultiEntityInteractions(stabilizedObjects);

              return (
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {/* Active Kinematic Interacting Hazards Banner */}
                  {activeInteractions.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/50 space-y-1.5 font-mono text-xs">
                      <div className="text-red-300 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          Multi-Entity Hazards Detected ({activeInteractions.length})
                        </span>
                        <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-red-900 text-red-200">
                          Kinematic Radar
                        </span>
                      </div>
                      {activeInteractions.map((inter) => (
                        <div key={inter.id} className="p-1.5 rounded bg-black/60 border border-red-900/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-red-200">
                            <span className="font-bold">{inter.scenario}</span>
                            <span className="text-slate-400">({inter.entityAId} ↔ {inter.entityBId})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right text-amber-300">
                              <span>{inter.proximityMeters}m</span>
                              {inter.timeToCollisionSec !== null && <span className="ml-1.5 text-red-400 font-bold">TTC: {inter.timeToCollisionSec}s</span>}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const alert = createDynamicSafetyAlert(camera, inter);
                                setSelectedAlertForModal(alert);
                              }}
                              className="px-2 py-0.5 rounded bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold shadow flex items-center gap-1 transition-colors"
                              title="Generate dynamic forensic safety alert"
                            >
                              <span>🚨</span> Log Alert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 font-mono mb-1 flex items-center justify-between">
                    <span>Track-Stabilized Bounding Boxes (YOLOv11):</span>
                    <span className="text-[10px] text-cyan-400">De-Jitter Active (EMA α=0.65)</span>
                  </div>
                  {stabilizedObjects.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 font-mono text-xs">
                      No active targets in camera sensor field.
                    </div>
                  ) : (
                    stabilizedObjects.map((obj) => (
                      <div
                        key={obj.id}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs font-mono flex flex-col gap-1.5",
                          obj.collisionRisk?.status === 'Critical: Active Collision'
                            ? "bg-red-950/40 border-red-500/70 text-red-200 shadow-sm shadow-red-950"
                            : obj.collisionRisk?.status === 'Warning: Accident-Prone Near-Miss'
                            ? "bg-amber-950/30 border-amber-500/60 text-amber-200"
                            : obj.type === 'animal'
                            ? "bg-purple-950/30 border-purple-500/60 text-purple-200"
                            : "bg-slate-900/60 border-slate-800 text-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              obj.collisionRisk?.status === 'Critical: Active Collision' ? "bg-red-500 animate-ping" : 
                              obj.type === 'animal' ? "bg-purple-400" : "bg-cyan-400"
                            )} />
                            <div>
                              <span className="font-bold uppercase text-white flex items-center gap-1">
                                {obj.type === 'animal' && <span>🐾</span>}
                                {obj.type}
                              </span>
                              {obj.licensePlate && (
                                <span className="ml-2 text-amber-300 bg-black/60 px-1 py-0.2 rounded text-[10px]">
                                  {obj.licensePlate}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {obj.speed !== undefined && (
                              <span className="text-slate-400 text-[11px]">{obj.speed} km/h</span>
                            )}
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold",
                              obj.confidence > 95 ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-slate-800 text-slate-300"
                            )}>
                              {obj.confidence.toFixed(1)}% conf
                            </span>
                          </div>
                        </div>

                        {/* Collision / Interaction Risk Tag */}
                        {obj.collisionRisk && (
                          <div className="text-[10px] font-mono px-2 py-1 rounded bg-black/50 border border-slate-800 flex items-center justify-between">
                            <span className={cn(
                              "font-bold",
                              obj.collisionRisk.status === 'Critical: Active Collision' ? "text-red-400" : "text-amber-400"
                            )}>
                              {obj.collisionRisk.scenario} [{obj.collisionRisk.interactionType}]
                            </span>
                            <span className="text-slate-400">
                              Prox: {obj.collisionRisk.distanceMeters}m
                              {obj.collisionRisk.ttc !== null && ` | TTC: ${obj.collisionRisk.ttc}s`}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {/* Tab 2: Recent Events Timeline */}
            {activeTab === 'events' && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="text-[11px] text-slate-400 font-mono mb-1">
                  Temporal Event Audit Trail:
                </div>
                {camera.recentEvents.map((event, idx) => (
                  <div key={idx} className="relative pl-5 border-l-2 border-slate-800 pb-3 last:pb-0">
                    <span className={cn(
                      "absolute -left-[5px] top-0 w-2 h-2 rounded-full",
                      event.severity === 'Critical' ? "bg-red-500" : event.severity === 'High' ? "bg-amber-400" : "bg-cyan-400"
                    )} />
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                      <span>{event.time}</span>
                      <span className={cn(
                        "px-1 py-0.2 rounded font-bold uppercase",
                        event.severity === 'Critical' ? "text-red-400 bg-red-950" : event.severity === 'High' ? "text-amber-400 bg-amber-950" : "text-cyan-400 bg-cyan-950"
                      )}>
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-snug">
                      {event.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: AI Pipeline & Trained Models Telemetry */}
            {activeTab === 'telemetry' && (() => {
              const tgcnForecast = modelInferenceService.predictTrafficSpeed(
                camera.id, 
                Math.max(12, 65 - camera.congestionScore * 0.5)
              );
              const riskAssessment = modelInferenceService.classifyIncidentRisk({
                speed: camera.objects[0]?.speed || Math.max(15, 65 - camera.congestionScore * 0.5),
                acceleration: camera.incidentType === 'Traffic Accident' ? -8.5 : 0.4,
                density: camera.congestionScore,
                vehicleType: camera.objects[0]?.type || 'car',
                proximityHazard: camera.incidentType === 'Traffic Accident' ? 92 : 12
              });

              const stabilizedObjects = modelInferenceService.stabilizeDetections(camera.id, camera.objects || []);
              const activeInteractions = modelInferenceService.analyzeMultiEntityInteractions(stabilizedObjects);
              const aiVideoTelemetry = modelInferenceService.getAiVideoFeedTelemetry();

              const primaryHazard = activeInteractions[0];
              const kinematicInference = modelInferenceService.classifyKinematicInteraction(
                primaryHazard
                  ? {
                      proximityMeters: primaryHazard.proximityMeters,
                      relativeSpeedKmH: primaryHazard.relativeVelocityKmH,
                      ttcSec: primaryHazard.timeToCollisionSec,
                      pairType: primaryHazard.interactionType,
                      trajectoryHazardScore: primaryHazard.riskScore
                    }
                  : {
                      proximityMeters: 4.8,
                      relativeSpeedKmH: 52.0,
                      ttcSec: 0.9,
                      pairType: 'vehicle-vehicle',
                      trajectoryHazardScore: 68
                    }
              );

              return (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs font-mono">
                  {/* Kinematic Collision & Multi-Entity Interaction Radar */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-red-800/60 shadow">
                    <div className="text-red-400 font-bold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-red-400" />
                        Kinematic Collision Classifier
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700">
                        Accuracy: 96.4%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Multi-Entity Vector Projection (TTC, Proximity, Closure Speed):
                    </p>

                    {activeInteractions.length > 0 ? (
                      <div className="space-y-1.5 mb-2">
                        {activeInteractions.map((inter) => (
                          <div key={inter.id} className="p-2 rounded bg-red-950/40 border border-red-500/40 text-[11px] flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-red-200">
                                {inter.interactionType}: {inter.scenario}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1 py-0.2 rounded bg-red-900 text-red-100 text-[10px] font-bold">
                                  {inter.status}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const alert = createDynamicSafetyAlert(camera, inter);
                                    setSelectedAlertForModal(alert);
                                  }}
                                  className="px-1.5 py-0.2 rounded bg-red-700 hover:bg-red-600 text-white text-[9px] font-bold shadow transition-colors"
                                  title="Log forensic Safety Alert"
                                >
                                  🚨 Log Alert
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] text-amber-200 font-mono">
                              <div>TTC: <span className="font-bold text-white">{inter.timeToCollisionSec !== null ? `${inter.timeToCollisionSec}s` : 'N/A'}</span></div>
                              <div>Prox: <span className="font-bold text-white">{inter.proximityMeters}m</span></div>
                              <div>RelVel: <span className="font-bold text-white">{inter.relativeVelocityKmH} km/h</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-black/40 border border-slate-800 text-[11px] text-emerald-400 flex items-center justify-between mb-2">
                        <span>Safe headway: No immediate vector conflicts</span>
                        <span className="text-[10px] text-slate-400">Radar Active</span>
                      </div>
                    )}

                    {/* Neural Softmax Head Distribution */}
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                        <span>Neural Softmax Distribution ({primaryHazard ? primaryHazard.scenario : 'Baseline Kinematics'}):</span>
                        <span className="text-cyan-300">{kinematicInference.predictedClass} ({kinematicInference.confidence}%)</span>
                      </div>
                      <div className="space-y-1">
                        {kinematicInference.classProbabilities.map((cp) => (
                          <div key={cp.className} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-400">{cp.className}</span>
                              <span className="font-bold text-slate-200">{cp.probability}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  cp.className.includes('Critical') ? "bg-red-500" :
                                  cp.className.includes('Warning') ? "bg-amber-500" :
                                  cp.className.includes('Caution') ? "bg-yellow-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${cp.probability}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Dispatch Protocol: <span className="text-cyan-300">{kinematicInference.recommendedProtocol}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-1.5 mt-2">
                      <div>• Scenarios: Vehicle↔Vehicle, Vehicle↔Pedestrian, Vehicle↔Animal</div>
                      <div>• Architecture: 2-Layer MLP (5→32→4 Softmax Head, 6,000 samples)</div>
                    </div>
                  </div>

                  {/* 4K Autonomous AI Stream Telemetry Card */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-cyan-800/60 shadow">
                    <div className="text-cyan-400 font-bold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-cyan-400" />
                        4K AI Surveillance Stream
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                        {aiVideoTelemetry.fps} FPS HEVC
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2">
                      <div className="p-1.5 rounded bg-black/40 border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Source File</span>
                        <span className="text-white font-bold">{aiVideoTelemetry.sourceFile}</span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Resolution</span>
                        <span className="text-cyan-300 font-bold">{aiVideoTelemetry.resolution}</span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Track Stabilizer</span>
                        <span className="text-emerald-400 font-bold">EMA α=0.65 (Active)</span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Jitter Suppression</span>
                        <span className="text-emerald-400 font-bold">99.4% Physical Clamp</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {aiVideoTelemetry.detectedClasses.map((cls) => (
                        <span key={cls} className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono",
                          cls === 'animal' ? "bg-purple-950 text-purple-300 border border-purple-800" :
                          cls === 'pedestrian' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                          "bg-slate-800 text-slate-300"
                        )}>
                          {cls === 'animal' && '🐾 '}
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* T-GCN Speed Forecast Card */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-cyan-800/60 shadow">
                    <div className="text-cyan-400 font-bold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                        T-GCN Speed Forecast
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                        Spatial Graph v2.4
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Spatio-Temporal Graph Laplacian forward projection:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {tgcnForecast.map((fc, i) => (
                        <div key={i} className="p-1.5 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400 text-[10px]">{fc.horizon}</span>
                          <span className={cn(
                            "font-bold text-[11px]",
                            fc.predictedSpeed < 20 ? "text-red-400" : fc.predictedSpeed < 45 ? "text-amber-400" : "text-emerald-400"
                          )}>
                            {fc.predictedSpeed} km/h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CrashSense Incident Risk Assessment */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 shadow">
                    <div className="text-amber-300 font-bold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        CrashSense Risk Classifier
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded font-bold uppercase",
                        riskAssessment.severity === 'Critical' ? "bg-red-950 text-red-300 border border-red-800" :
                        riskAssessment.severity === 'High' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                        "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      )}>
                        {riskAssessment.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-white font-bold mt-1">
                      Target: {riskAssessment.predictedClass} ({riskAssessment.confidence}%)
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Recommended: {riskAssessment.recommendedDispatch}
                    </p>
                  </div>

                  {/* Hardware & Weights Meta */}
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Edge Pipeline Architecture
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <div>• Weights: 156-Node Normalized Laplacian + GRU Head</div>
                      <div>• Training Accuracy: 75.5% (Val RMSE: 4.37 km/h)</div>
                      <div>• Inference Engine: Client-Side WebGL / Tensor Kernel</div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {camera.activeAiModels.map((model) => (
                        <span key={model} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px]">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
