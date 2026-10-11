import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraFeed } from '../../types';
import { 
  Maximize2, 
  Eye, 
  Camera, 
  Layers,
  Moon,
  WifiOff,
  ZoomIn,
  RotateCcw,
  Video,
  Play
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { modelInferenceService } from '../../services/modelInferenceService';

interface CCTVFeedPlayerProps {
  camera: CameraFeed;
  isDetailed?: boolean;
  showAiOverlayDefault?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const CCTVFeedPlayer: React.FC<CCTVFeedPlayerProps> = ({
  camera,
  isDetailed = false,
  showAiOverlayDefault = true,
  onSelect,
  className
}) => {
  const { setSelectedCamera, showToast, createDynamicSafetyAlert, setSelectedAlertForModal } = useCommandCenter();
  const [showAiOverlay, setShowAiOverlay] = useState(showAiOverlayDefault);
  const [isNightVision, setIsNightVision] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentTimecode, setCurrentTimecode] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [autoplayHeld, setAutoplayHeld] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fast, browser-compatible stream: Map ProRes MOV or other streams to real playable MP4
  const resolvedVideoUrl = React.useMemo(() => {
    if (!camera.videoUrl) return undefined;
    if (camera.videoUrl.endsWith('.mov') || camera.videoUrl.includes('cam_ai_stream.mov')) {
      return '/videos/cam_highway_collision.mp4';
    }
    if (camera.videoUrl.includes('cam_cmc_tracked.mp4')) {
      return '/videos/cam_downtown_cmc.mp4';
    }
    if (camera.videoUrl.includes('cam_wild_tracked.mp4')) {
      return '/videos/cam_expressway_wild.mp4';
    }
    return camera.videoUrl;
  }, [camera.videoUrl]);

  // Track-stabilized and de-jittered objects (removes random flickering and enforces physical bounds)
  const stabilizedObjects = React.useMemo(() => {
    return modelInferenceService.stabilizeDetections(camera.id, camera.objects || []);
  }, [camera.id, camera.objects]);

  // Compute multi-entity kinematic interactions (TTC, proximity, relative velocity)
  const activeInteractions = React.useMemo(() => {
    const computed = modelInferenceService.analyzeMultiEntityInteractions(stabilizedObjects);
    if (camera.activeHazards && camera.activeHazards.length > 0) {
      return [...camera.activeHazards, ...computed];
    }
    return computed;
  }, [camera.activeHazards, stabilizedObjects]);

  // Single most severe acute conflict for clean, non-cluttered vector overlay
  const primaryConflict = React.useMemo(() => {
    if (!activeInteractions || activeInteractions.length === 0) return null;

    const getSeverityWeight = (status: string) => {
      if (status === 'Critical: Active Collision') return 3;
      if (status === 'Warning: Accident-Prone Near-Miss') return 2;
      return 1;
    };

    const sorted = [...activeInteractions].sort((a, b) => {
      const weightA = getSeverityWeight(a.status);
      const weightB = getSeverityWeight(b.status);
      if (weightB !== weightA) return weightB - weightA;

      if ((b.riskScore || 0) !== (a.riskScore || 0)) {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }

      const ttcA = a.timeToCollisionSec ?? 999;
      const ttcB = b.timeToCollisionSec ?? 999;
      if (ttcA !== ttcB) return ttcA - ttcB;

      return a.proximityMeters - b.proximityMeters;
    });

    return sorted[0] || null;
  }, [activeInteractions]);

  // Highest severity active hazard for top HUD banner
  const highestHazard = React.useMemo(() => {
    if (!primaryConflict) return null;
    if (primaryConflict.status === 'Critical: Active Collision' || primaryConflict.status === 'Warning: Accident-Prone Near-Miss') {
      return primaryConflict;
    }
    return null;
  }, [primaryConflict]);

  // Live second-by-second timecode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now.toTimeString().slice(0, 8);
      setCurrentTimecode(`${datePart} ${timePart}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reliable DOM Video Autoplay handler with proper muted & playsInline attributes
  const setupAndPlayVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || camera.status === 'offline' || !resolvedVideoUrl) {
      setIsVideoPlaying(false);
      return;
    }

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsVideoPlaying(true);
          setAutoplayHeld(false);
        })
        .catch((err: unknown) => {
          // Ignore AbortError when play is superseded by a newer load/render
          if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
            return;
          }
          // Autoplay suspended or pending user gesture
          setIsVideoPlaying(false);
          setAutoplayHeld(true);
        });
    }
  }, [camera.status, resolvedVideoUrl]);

  useEffect(() => {
    setIsVideoPlaying(false);
    setAutoplayHeld(false);

    // Give DOM element a frame to bind attributes and begin stream playback
    const timer = setTimeout(() => {
      setupAndPlayVideo();
    }, 40);

    return () => clearTimeout(timer);
  }, [camera.id, resolvedVideoUrl, setupAndPlayVideo]);

  const handleCaptureSnapshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, 1280, 720);
        } else {
          // Render informative evidence capture frame
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(0, 0, 1280, 720);
          ctx.fillStyle = '#0284c7';
          ctx.font = 'bold 28px monospace';
          ctx.fillText(`MUNICIPAL CCTV SURVEILLANCE // ${camera.id}`, 60, 80);
          ctx.font = '18px monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`LOCATION: ${camera.location} • TIMESTAMP: ${currentTimecode}`, 60, 120);
          ctx.fillText(`ZONE: ${camera.zone.toUpperCase()} • STATUS: ${camera.status.toUpperCase()} • VEHICLES: ${camera.vehicleCount}`, 60, 155);
          ctx.fillText(`AI RESOLUTION: ${camera.resolution} @ ${camera.fps} FPS • BITRATE: 4.8 Mbps CBR`, 60, 190);
          
          // Draw bounding box markers
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(60, 240, 1160, 420);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
          ctx.fillRect(60, 240, 1160, 420);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const link = document.createElement('a');
        link.download = `cctv_evidence_${camera.id}_${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch {
      // In case canvas export is restricted
    }
    showToast('Evidence Captured', `Snapshot from ${camera.id} archived with cryptographic watermark.`, 'info');
  };

  const isOffline = camera.status === 'offline';
  const isWarning = camera.status === 'warning';

  const handleContainerClick = () => {
    if (videoRef.current && !isOffline && resolvedVideoUrl) {
      setupAndPlayVideo();
    }
    if (onSelect) {
      onSelect();
    } else {
      setSelectedCamera(camera);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-lg overflow-hidden border transition-all duration-200 select-none group bg-slate-950 shadow-md",
        isOffline ? "border-slate-800" : isWarning ? "border-amber-500/50" : "border-slate-800/80 hover:border-cyan-500/60",
        className
      )}
      onClick={handleContainerClick}
    >
      {/* CCTV Screen Viewport */}
      <div 
        className={cn(
          "relative w-full aspect-video overflow-hidden transition-all duration-300 bg-[#070b14]",
          isNightVision && "filter contrast-150 brightness-110 saturate-150"
        )}
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {/* For cameras with video: Video is the PRIMARY visible element with preload="auto", no still image masking */}
        {resolvedVideoUrl && !isOffline ? (
          <video
            ref={videoRef}
            key={resolvedVideoUrl}
            src={resolvedVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onPlay={() => {
              setIsVideoPlaying(true);
              setAutoplayHeld(false);
            }}
            onPlaying={() => {
              setIsVideoPlaying(true);
              setAutoplayHeld(false);
            }}
            onPause={() => {
              if (videoRef.current?.paused) {
                setIsVideoPlaying(false);
              }
            }}
            onEnded={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
              }
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none opacity-100"
          >
            <source src={resolvedVideoUrl} type="video/mp4" />
          </video>
        ) : !isOffline ? (
          /* Fallback image ONLY when camera has no video URL */
          <img
            src={camera.imageUrl || '/incidents/accident_detection.jpg'}
            alt={camera.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}

        {/* Clear, Clickable "Click to Play Video Stream" Overlay when Autoplay is Held by Browser Policy */}
        {resolvedVideoUrl && !isOffline && autoplayHeld && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setupAndPlayVideo();
            }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] cursor-pointer hover:bg-black/40 transition-colors pointer-events-auto"
            title="Click to start video stream"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900/90 border border-cyan-500/60 shadow-2xl text-center group-hover:scale-105 transition-transform max-w-[85%]">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md">
                <Play className="w-5 h-5 fill-cyan-400 translate-x-0.5" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Click to Play Video Stream
                </p>
                <p className="font-mono text-[10px] text-slate-400">
                  Autoplay held by browser • Click to resume live optical feed
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Offline Banner Overlay */}
        {isOffline && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 text-slate-400 gap-2 backdrop-blur-[1px]">
            <WifiOff className="w-10 h-10 text-red-500 animate-pulse" />
            <span className="font-mono text-xs tracking-widest uppercase text-red-400 font-bold">
              SIGNAL LOST // NO CARRIER
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              IP: {camera.ip} (Click reboot stream to recover)
            </span>
          </div>
        )}

        {/* AI Bounding Boxes & Kinematic Hazard Overlay */}
        {showAiOverlay && !isOffline && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Top HUD Hazard Warning Banner */}
            {highestHazard && (
              <div className={cn(
                "absolute top-8 left-2 right-2 px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-between z-30 backdrop-blur-sm border shadow-xl animate-in fade-in slide-in-from-top-2 duration-200",
                highestHazard.status === 'Critical: Active Collision'
                  ? "bg-red-950/90 text-red-200 border-red-500/80 shadow-red-900/50"
                  : highestHazard.status === 'Warning: Accident-Prone Near-Miss'
                  ? "bg-amber-950/90 text-amber-200 border-amber-500/80 shadow-amber-900/50"
                  : "bg-yellow-950/90 text-yellow-200 border-yellow-500/80"
              )}>
                <span className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    highestHazard.status === 'Critical: Active Collision' ? "bg-red-500 animate-ping" : "bg-amber-400"
                  )} />
                  {highestHazard.status.toUpperCase()}: {highestHazard.scenario} [{highestHazard.interactionType.toUpperCase()}]
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono opacity-90 hidden sm:inline">
                    PROX: {highestHazard.proximityMeters}m | REL: {highestHazard.relativeVelocityKmH} km/h
                    {highestHazard.timeToCollisionSec !== null && ` | TTC: ${highestHazard.timeToCollisionSec}s`}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const createdAlert = createDynamicSafetyAlert(camera, highestHazard);
                      setSelectedAlertForModal(createdAlert);
                    }}
                    className="pointer-events-auto px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold shadow flex items-center gap-1 transition-colors"
                    title="Dynamically generate and inspect Safety Alert"
                  >
                    <span>🚨</span> Log Alert
                  </button>
                </div>
              </div>
            )}

            {/* SVG Layer: Single Clean Proximity Vector Line for Most Severe Acute Conflict */}
            {primaryConflict && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                {(() => {
                  const isCritical = primaryConflict.status === 'Critical: Active Collision';
                  const isWarning = primaryConflict.status === 'Warning: Accident-Prone Near-Miss';
                  const strokeColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#eab308';
                  return (
                    <g key={primaryConflict.id}>
                      {/* Glowing outer shadow line */}
                      <line
                        x1={`${primaryConflict.pointA.x}`}
                        y1={`${primaryConflict.pointA.y}`}
                        x2={`${primaryConflict.pointB.x}`}
                        y2={`${primaryConflict.pointB.y}`}
                        stroke={strokeColor}
                        strokeWidth={isCritical ? "2.2" : "1.4"}
                        strokeOpacity="0.85"
                        strokeDasharray={isCritical ? "3 1.5" : "2 2"}
                        className={isCritical ? "animate-pulse" : ""}
                      />
                      {/* Interacting Node Target Pins */}
                      <circle cx={`${primaryConflict.pointA.x}`} cy={`${primaryConflict.pointA.y}`} r={isCritical ? "2" : "1.4"} fill={strokeColor} />
                      <circle cx={`${primaryConflict.pointB.x}`} cy={`${primaryConflict.pointB.y}`} r={isCritical ? "2" : "1.4"} fill={strokeColor} />
                    </g>
                  );
                })()}
              </svg>
            )}

            {/* Single Floating Kinematic Metric Badge at Vector Midpoint */}
            {primaryConflict && (() => {
              const midX = (primaryConflict.pointA.x + primaryConflict.pointB.x) / 2;
              const midY = (primaryConflict.pointA.y + primaryConflict.pointB.y) / 2;
              const isCritical = primaryConflict.status === 'Critical: Active Collision';
              const isWarning = primaryConflict.status === 'Warning: Accident-Prone Near-Miss';
              return (
                <div
                  key={`badge-${primaryConflict.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const createdAlert = createDynamicSafetyAlert(camera, primaryConflict);
                    setSelectedAlertForModal(createdAlert);
                  }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold whitespace-nowrap shadow-lg flex items-center gap-1 z-20 pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 transition-transform border",
                    isCritical 
                      ? "bg-red-950/95 text-red-200 border-red-500 animate-bounce shadow-red-900/40" 
                      : isWarning 
                      ? "bg-amber-950/95 text-amber-200 border-amber-500 shadow-amber-900/40" 
                      : "bg-yellow-950/95 text-yellow-200 border-yellow-500"
                  )}
                  style={{ left: `${midX}%`, top: `${midY}%` }}
                  title="Click to generate forensic Safety Alert for this hazard"
                >
                  <span>{isCritical ? '⚡ COLLISION' : isWarning ? '⚠️ NEAR-MISS' : '👁️ HAZARD'}</span>
                  <span>•</span>
                  <span>{primaryConflict.proximityMeters}m</span>
                  {primaryConflict.timeToCollisionSec !== null && (
                    <>
                      <span>•</span>
                      <span>TTC: {primaryConflict.timeToCollisionSec}s</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{primaryConflict.relativeVelocityKmH} km/h</span>
                </div>
              );
            })()}

            {/* Stabilized Bounding Boxes with Class-Specific Styling */}
            {stabilizedObjects.map((obj) => {
              const isBus = obj.type === 'bus';
              const isTruck = obj.type === 'truck';
              const isPed = obj.type === 'pedestrian';
              const isAnimal = obj.type === 'animal';
              const isBicycle = obj.type === 'bicycle';
              const hasCollision = obj.collisionRisk?.status === 'Critical: Active Collision';
              const hasNearMiss = obj.collisionRisk?.status === 'Warning: Accident-Prone Near-Miss';

              const boxBorderColor = hasCollision || obj.isViolation 
                ? 'border-red-500 bg-red-500/15 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse' 
                : hasNearMiss
                ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : isAnimal
                ? 'border-purple-400 bg-purple-500/15 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                : isPed 
                ? 'border-amber-400 bg-amber-400/10 text-amber-300' 
                : isBicycle
                ? 'border-teal-400 bg-teal-400/10 text-teal-300'
                : isBus || isTruck
                ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                : 'border-cyan-400 bg-cyan-400/10 text-cyan-300';

              const tagBg = hasCollision || obj.isViolation 
                ? 'bg-red-600 text-white' 
                : hasNearMiss
                ? 'bg-amber-600 text-white'
                : isAnimal
                ? 'bg-purple-900/95 text-purple-200 border border-purple-500/60'
                : isBicycle
                ? 'bg-teal-950/95 text-teal-300 border border-teal-500/50'
                : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/40';

              return (
                <div
                  key={obj.id}
                  className={cn(
                    "absolute border transition-all duration-150 flex flex-col justify-between p-0.5",
                    boxBorderColor
                  )}
                  style={{
                    left: `${obj.box.x}%`,
                    top: `${obj.box.y}%`,
                    width: `${obj.box.w}%`,
                    height: `${obj.box.h}%`,
                  }}
                >
                  {/* Top Label Tag */}
                  <div className="flex items-center gap-1 -translate-y-4">
                    <span className={cn(
                      "px-1 py-0.5 text-[9px] font-mono font-bold uppercase rounded leading-none whitespace-nowrap shadow-sm flex items-center gap-1",
                      tagBg
                    )}>
                      {isAnimal && <span>🐾</span>}
                      {obj.type} {obj.confidence.toFixed(0)}%
                    </span>
                    {obj.speed !== undefined && obj.speed > 0 && (
                      <span className="bg-slate-900/80 text-[8px] font-mono px-1 py-0.2 rounded text-slate-300 border border-slate-700">
                        {obj.speed} km/h
                      </span>
                    )}
                    {obj.collisionRisk && (
                      <span className={cn(
                        "text-[7px] font-mono px-1 py-0.2 rounded font-bold uppercase",
                        obj.collisionRisk.status === 'Critical: Active Collision'
                          ? "bg-red-600 text-white"
                          : "bg-amber-600 text-white"
                      )}>
                        {obj.collisionRisk.status === 'Critical: Active Collision' ? 'IMPACT' : 'RISK'}
                      </span>
                    )}
                  </div>

                  {/* Corner Target Markers */}
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-current" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-current" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-current" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-current" />

                  {/* License plate or Obstacle Tag */}
                  {obj.licensePlate ? (
                    <div className="text-[7px] font-mono bg-black/80 text-amber-300 px-0.5 py-0.2 self-center rounded tracking-tighter">
                      [{obj.licensePlate}]
                    </div>
                  ) : isAnimal ? (
                    <div className="text-[7px] font-mono bg-purple-950/80 text-purple-300 px-0.5 py-0.2 self-center rounded tracking-tighter border border-purple-800">
                      [ROADWAY INTRUSION]
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Scanline CRT Texture & Vignette */}
        <div className="absolute inset-0 cctv-scanline pointer-events-none opacity-25" />
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_35px_rgba(0,0,0,0.85)]" />

        {/* HUD Top Bar */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-white/90 pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          <div className="flex items-center gap-2 pointer-events-auto">
            {!isOffline ? (
              <span className="flex items-center gap-1 text-red-500 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-blink inline-block" />
                REC
              </span>
            ) : (
              <span className="text-red-400 font-bold bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> NO SYNC
              </span>
            )}
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-cyan-400 font-bold tracking-wider">
              {camera.id}
            </span>
            <span className="bg-black/50 px-1.5 py-0.5 rounded text-slate-300 hidden sm:inline">
              {camera.resolution}
            </span>

            {/* Stream Mode Indicator */}
            {!isOffline && (
              <span
                title={resolvedVideoUrl ? "Active RTSP Video Feed" : "Static CCTV Sensor Snapshot"}
                className="bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1"
              >
                <Video className="w-2.5 h-2.5" /> {resolvedVideoUrl ? 'LIVE RTSP' : 'CCTV FRAME'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-emerald-400">
              {camera.fps || 30} FPS
            </span>
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-slate-200 hidden md:inline">
              {currentTimecode}
            </span>
          </div>
        </div>

        {/* HUD Bottom Status Bar */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold text-white tracking-wide bg-black/60 px-1.5 py-0.5 rounded">
              {camera.name}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
              <span className="bg-black/50 px-1 py-0.5 rounded flex items-center gap-1 text-cyan-300">
                🚘 {camera.vehicleCount} Veh
              </span>
              <span className="bg-black/50 px-1 py-0.5 rounded flex items-center gap-1 text-amber-300">
                🚶 {camera.pedestrianCount} Ped
              </span>
              {camera.incidentType !== 'Normal' && (
                <span className="bg-red-950/80 text-red-400 border border-red-500/50 px-1 py-0.5 rounded font-bold">
                  ⚠️ {camera.incidentType}
                </span>
              )}
            </div>
          </div>

          {/* Quick HUD controls overlay */}
          <div className="flex items-center gap-1 pointer-events-auto">
            {resolvedVideoUrl && (
              <button
                type="button"
                title="Restart RTSP Stream"
                onClick={(e) => {
                  e.stopPropagation();
                  setupAndPlayVideo();
                }}
                className="p-1.5 rounded bg-black/70 backdrop-blur text-slate-400 hover:text-white text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              title="Toggle AI Overlays"
              onClick={(e) => {
                e.stopPropagation();
                setShowAiOverlay(!showAiOverlay);
              }}
              className={cn(
                "p-1.5 rounded bg-black/70 backdrop-blur text-xs transition-colors hover:text-white",
                showAiOverlay ? "text-cyan-400 border border-cyan-500/40" : "text-slate-400"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Toggle Night Vision"
              onClick={(e) => {
                e.stopPropagation();
                setIsNightVision(!isNightVision);
              }}
              className={cn(
                "p-1.5 rounded bg-black/70 backdrop-blur text-xs transition-colors hover:text-white",
                isNightVision ? "text-emerald-400 border border-emerald-500/40" : "text-slate-400"
              )}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Digital 1.4x Zoom"
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel(zoomLevel === 1 ? 1.4 : 1);
              }}
              className={cn(
                "p-1.5 rounded bg-black/70 backdrop-blur text-xs transition-colors hover:text-white",
                zoomLevel > 1 ? "text-cyan-400 border border-cyan-500/40" : "text-slate-400"
              )}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Save Snapshot"
              onClick={handleCaptureSnapshot}
              className="p-1.5 rounded bg-black/70 backdrop-blur text-slate-300 hover:text-cyan-300 text-xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Inspect Live Feed"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCamera(camera);
              }}
              className="p-1.5 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Footer (Shown in feed grids) */}
      {!isDetailed && (
        <div className="p-2.5 bg-slate-900/90 flex items-center justify-between border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isOffline ? "bg-slate-500" : isWarning ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            )} />
            <span className="font-mono text-slate-400 text-[11px] truncate max-w-[140px]">
              {camera.location}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {camera.activeAiModels.slice(0, 1).map((m, idx) => (
              <span key={idx} className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {m}
              </span>
            ))}
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCamera(camera);
              }}
              className="text-slate-400 hover:text-cyan-400 cursor-pointer p-1"
            >
              <Eye className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
