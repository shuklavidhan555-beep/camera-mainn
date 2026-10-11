import React from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { 
  Radio, 
  Play, 
  Pause, 
  Zap, 
  Wifi, 
  ShieldAlert, 
  Car, 
  Camera 
} from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

export const RealTimeStreamControlBar: React.FC = () => {
  const { 
    isStreamingActive, 
    setIsStreamingActive, 
    streamSpeed, 
    setStreamSpeed, 
    streamTickCount, 
    todayVehiclesCount, 
    todayAccidentsCount, 
    activeWorkingCamerasCount, 
    streamBandwidthMbps, 
    ingestRealTimeIncident,
    kpis
  } = useCommandCenter();

  const handleIngestClick = () => {
    ingestRealTimeIncident();
  };

  return (
    <div className="rounded-xl border border-cyan-900/60 bg-gradient-to-r from-[#09111e] via-[#0d1629] to-[#09111e] p-3 shadow-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: Stream Status & Pulse */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {isStreamingActive ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 relative z-10" />
              </>
            ) : (
              <span className="w-3 h-3 rounded-full bg-amber-500" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                {isStreamingActive ? 'Real-Time Edge Sensor Stream' : 'Telemetry Stream Paused'}
              </span>
              <span className={cn(
                "text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase",
                isStreamingActive ? "bg-emerald-950 text-emerald-300 border border-emerald-700/80" : "bg-amber-950 text-amber-300 border border-amber-800"
              )}>
                {isStreamingActive ? 'LIVE' : 'STANDBY'}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60">
                Tick #{streamTickCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              PeMS D7 Sensors (228 stations) • T-GCN Speed Matrix (2,976 intervals) • YOLOv8 Flow
            </p>
          </div>
        </div>

        {/* Center: Live Streaming Telemetry Counters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
          {/* Active Cameras Working */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Cameras:</span>
            <span className="text-white font-bold">{activeWorkingCamerasCount} / {kpis.totalCameras} Working</span>
          </div>

          {/* Real-Time Vehicles Influx */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Car className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Detections:</span>
            <span className="text-blue-300 font-bold">{formatNumber(todayVehiclesCount)}</span>
          </div>

          {/* Accidents Occurred Today */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">Accidents Today:</span>
            <span className="text-red-400 font-bold">{todayAccidentsCount} Logged</span>
          </div>

          {/* Bandwidth Throughput */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Bandwidth:</span>
            <span className="text-emerald-300 font-bold">{streamBandwidthMbps} Mbps</span>
          </div>
        </div>

        {/* Right: Stream Controls */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Stream Rate Buttons */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            {([1, 2, 5] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setStreamSpeed(speed)}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors font-bold",
                  streamSpeed === speed ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
                title={`Set stream rate to ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsStreamingActive(!isStreamingActive)}
            className={cn(
              "px-2.5 py-1 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-colors border",
              isStreamingActive 
                ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm"
            )}
            title={isStreamingActive ? "Pause live telemetry stream" : "Resume live telemetry stream"}
          >
            {isStreamingActive ? (
              <>
                <Pause className="w-3 h-3" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Resume
              </>
            )}
          </button>

          {/* Live Incident Stream Influx Button */}
          <button
            onClick={handleIngestClick}
            className="px-2.5 py-1 rounded-lg bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-700/80 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Ingest next real accident from Sentinel confirmed database"
          >
            <Zap className="w-3 h-3 text-red-400" />
            <span>Stream Real Incident</span>
          </button>
        </div>
      </div>
    </div>
  );
};
