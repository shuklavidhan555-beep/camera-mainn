import React, { useState } from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { CameraFeed } from '../../types';
import { 
  MapPin, 
  AlertTriangle, 
  Radio, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const CityMapPanel: React.FC = () => {
  const { cameras, setSelectedCamera, safetyAlerts, zoneSpeedData } = useCommandCenter();
  const [activeLayers, setActiveLayers] = useState({
    cameras: true,
    heatmap: true,
    incidents: true,
    boundaries: true,
  });
  const [hoveredCamera, setHoveredCamera] = useState<CameraFeed | null>(null);
  const [mapZoom, setMapZoom] = useState(1);

  const offlineCount = cameras.filter((c) => c.status === 'offline').length;
  const criticalCount = cameras.filter((c) => c.incidentType === 'Traffic Accident' || c.incidentType === 'Wrong-Way Vehicle').length;
  const warningCount = cameras.filter((c) => 
    c.status !== 'offline' && 
    c.incidentType !== 'Traffic Accident' && 
    c.incidentType !== 'Wrong-Way Vehicle' && 
    (c.status === 'warning' || c.incidentType !== 'Normal')
  ).length;
  const normalCount = cameras.length - (offlineCount + criticalCount + warningCount);

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden flex flex-col h-[460px] shadow-lg">
      {/* Map Header / Tactical Bar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Tactical Urban GIS Map
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                LIVE GIS v4.2
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time geospatial camera distribution & traffic congestion matrix
            </p>
          </div>
        </div>

        {/* Tactical Layer Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => toggleLayer('cameras')}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-mono transition-colors",
                activeLayers.cameras ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Cameras ({cameras.length})
            </button>
            <button
              onClick={() => toggleLayer('heatmap')}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-mono transition-colors",
                activeLayers.heatmap ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Heatmap
            </button>
            <button
              onClick={() => toggleLayer('incidents')}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-mono transition-colors",
                activeLayers.incidents ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Incidents
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMapZoom((prev) => Math.min(prev + 0.15, 1.6))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMapZoom((prev) => Math.max(prev - 0.15, 0.9))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMapZoom(1)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              title="Reset Zoom"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing bg-[#090d16]">
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-300 origin-center"
          style={{ transform: `scale(${mapZoom})` }}
        >
          {/* Tactical Vector Map Canvas SVG */}
          <svg className="w-full h-full object-cover" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <defs>
              {/* Radar gradient */}
              <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
              
              {/* Heatmap blur filter */}
              <filter id="heatBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="30" />
              </filter>
            </defs>

            {/* Tactical Grid Background */}
            <g opacity="0.12" stroke="#38bdf8" strokeWidth="0.5">
              {[...Array(20)].map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" />
              ))}
              {[...Array(12)].map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} />
              ))}
            </g>

            {/* Waterfront River / Bay Vector */}
            <path
              d="M 680,0 C 720,150 630,280 750,420 C 820,500 890,540 1000,560 L 1000,0 Z"
              fill="#08182b"
              opacity="0.8"
            />
            <path
              d="M 680,0 C 720,150 630,280 750,420 C 820,500 890,540 1000,560"
              stroke="#0ea5e9"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
              strokeDasharray="4 2"
            />

            {/* Major Arterial Highway Lines */}
            <g opacity="0.7">
              {/* Highway A1 Arc */}
              <path
                d="M 50,80 Q 300,120 500,280 T 950,380"
                stroke="#3b82f6"
                strokeWidth="6"
                fill="none"
              />
              <path
                d="M 50,80 Q 300,120 500,280 T 950,380"
                stroke="#60a5fa"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                fill="none"
              />

              {/* North-South Ring Road */}
              <path
                d="M 250,20 L 250,560"
                stroke="#334155"
                strokeWidth="4"
              />
              <path
                d="M 480,40 L 480,560"
                stroke="#334155"
                strokeWidth="4"
              />
              <path
                d="M 50,320 L 780,320"
                stroke="#334155"
                strokeWidth="4"
              />
            </g>

            {/* Congestion Heatmap Overlays (if active) */}
            {activeLayers.heatmap && (
              <g filter="url(#heatBlur)">
                {/* Downtown Core Heavy Congestion (Red) */}
                <circle cx="480" cy="310" r="90" fill="#ef4444" opacity="0.38" />
                {/* North Sector Tunnel (Amber) */}
                <circle cx="210" cy="110" r="75" fill="#f59e0b" opacity="0.32" />
                {/* Harbour District (Amber) */}
                <circle cx="820" cy="220" r="80" fill="#f59e0b" opacity="0.28" />
                {/* Tech Corridor (Green/Normal) */}
                <circle cx="380" cy="460" r="70" fill="#10b981" opacity="0.2" />
                {/* Waterfront Promenade (Green) */}
                <circle cx="740" cy="410" r="70" fill="#10b981" opacity="0.2" />
              </g>
            )}

            {/* Zone Boundaries and Labels */}
            {activeLayers.boundaries && (
              <g fontFamily="monospace" fontSize="11" fill="#64748b" letterSpacing="1">
                {/* Zone Downtown Core */}
                <rect x="420" y="240" width="160" height="150" fill="none" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
                <text x="430" y="260" fill="#38bdf8" fontWeight="bold">ZONE: DOWNTOWN CORE</text>
                <text x="430" y="275" fill="#f87171" fontSize="9">CONGESTION: {zoneSpeedData.find(z => z.zone === 'Downtown Core')?.congestionScore || 82}% (CRITICAL)</text>

                {/* Zone Highway A1 */}
                <text x="80" y="65" fill="#93c5fd" fontWeight="bold">SECTOR: HIGHWAY A1 CORRIDOR</text>

                {/* Zone Tech Corridor */}
                <rect x="300" y="420" width="160" height="120" fill="none" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
                <text x="310" y="440" fill="#34d399">ZONE: TECH CORRIDOR</text>

                {/* Zone Waterfront Bay */}
                <text x="740" y="460" fill="#38bdf8">WATERFRONT BAY</text>

                {/* Zone North Sector */}
                <rect x="140" y="60" width="150" height="110" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
                <text x="150" y="80" fill="#fbbf24">ZONE: NORTH CORRIDOR</text>
              </g>
            )}

            {/* Active Radar Sweep in corner */}
            <circle cx="120" cy="500" r="70" fill="url(#radarSweep)" className="animate-radar" />
            <circle cx="120" cy="500" r="70" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
            <circle cx="120" cy="500" r="35" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
          </svg>

          {/* Interactive Camera Markers (Pinned to coordinate percentages) */}
          {activeLayers.cameras && cameras.map((camera) => {
            const isCritical = camera.incidentType === 'Traffic Accident' || camera.incidentType === 'Wrong-Way Vehicle';
            const isWarning = camera.status === 'warning' || camera.incidentType !== 'Normal';
            const isOffline = camera.status === 'offline';

            return (
              <div
                key={camera.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20"
                style={{
                  left: `${camera.coordinates.x}%`,
                  top: `${camera.coordinates.y}%`,
                }}
                onMouseEnter={() => setHoveredCamera(camera)}
                onMouseLeave={() => setHoveredCamera(null)}
                onClick={() => setSelectedCamera(camera)}
              >
                {/* Pulsing Alert Waves */}
                {isCritical && (
                  <>
                    <span className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                    <span className="absolute -inset-4 rounded-full border border-red-500/50 animate-pulse pointer-events-none" />
                  </>
                )}

                {isWarning && !isCritical && (
                  <span className="absolute -inset-2 rounded-full bg-amber-500/30 animate-pulse pointer-events-none" />
                )}

                {/* Marker Pin Icon */}
                <div className={cn(
                  "p-1.5 rounded-full shadow-lg border flex items-center justify-center transition-all",
                  isOffline 
                    ? "bg-slate-800 border-slate-600 text-slate-400"
                    : isCritical
                    ? "bg-red-600 border-white text-white glow-red"
                    : isWarning
                    ? "bg-amber-500 border-amber-300 text-slate-950 glow-amber"
                    : "bg-cyan-600 border-cyan-300 text-white glow-cyan"
                )}>
                  {isCritical ? (
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Micro Label */}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white whitespace-nowrap pointer-events-none border border-slate-700">
                  {camera.id}
                </span>
              </div>
            );
          })}

          {/* Incident Callouts Overlay (if active) */}
          {activeLayers.incidents && safetyAlerts.slice(0, 2).map((alert) => {
            const cam = cameras.find((c) => c.id === alert.cameraId);
            if (!cam) return null;
            return (
              <div
                key={alert.id}
                className="absolute z-25 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
                style={{
                  left: `${cam.coordinates.x}%`,
                  top: `${cam.coordinates.y - 4}%`,
                }}
              >
                <div className="bg-red-950/95 border border-red-500 text-white px-2 py-1 rounded shadow-xl backdrop-blur flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  <span className="text-[10px] font-mono font-bold text-red-200">
                    {alert.type.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover Camera Card Tooltip */}
        {hoveredCamera && (
          <div 
            className="absolute bottom-4 left-4 z-30 bg-slate-900/95 border border-cyan-500/50 rounded-lg p-3 shadow-2xl backdrop-blur w-72 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-mono text-xs font-bold text-cyan-400">
                {hoveredCamera.id}
              </span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded uppercase font-semibold font-mono",
                hoveredCamera.status === 'online' ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                hoveredCamera.status === 'warning' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                "bg-slate-800 text-slate-400"
              )}>
                {hoveredCamera.status}
              </span>
            </div>
            <p className="text-xs text-white font-medium mt-1.5">
              {hoveredCamera.name}
            </p>
            <p className="text-[11px] text-slate-400">
              {hoveredCamera.location}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
              <div className="text-slate-300">
                Vehicles: <span className="text-cyan-300 font-bold">{hoveredCamera.vehicleCount}</span>
              </div>
              <div className="text-slate-300">
                Pedestrians: <span className="text-amber-300 font-bold">{hoveredCamera.pedestrianCount}</span>
              </div>
              <div className="text-slate-300">
                Congestion: <span className={hoveredCamera.congestionScore > 75 ? "text-red-400 font-bold" : "text-emerald-400"}>
                  {hoveredCamera.congestionScore}%
                </span>
              </div>
              <div className="text-slate-300">
                FPS: <span className="text-slate-200">{hoveredCamera.fps}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tactical Legend and GIS status in Bottom Right */}
        <div className="absolute bottom-3 right-3 z-10 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg p-2 text-[10px] font-mono flex flex-col gap-1 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>Normal Stream ({normalCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Warning / Congestion ({warningCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>Critical Accident ({criticalCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Offline ({offlineCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
