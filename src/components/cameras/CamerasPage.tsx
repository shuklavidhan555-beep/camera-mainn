import React, { useState } from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { CameraFeed } from '../../types';
import { 
  Camera, 
  Search, 
  RotateCw, 
  Eye, 
  Sliders
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RealTimeStreamControlBar } from '../common/RealTimeStreamControlBar';

export const CamerasPage: React.FC = () => {
  const { cameras, rebootCamera, setSelectedCamera, showToast } = useCommandCenter();
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const onlineCount = cameras.filter((c) => c.status === 'online').length;
  const warningCount = cameras.filter((c) => c.status === 'warning').length;
  const offlineCount = cameras.filter((c) => c.status === 'offline').length;
  const workingCount = onlineCount + warningCount;
  const zones = ['All', ...Array.from(new Set(cameras.map((c) => c.zone))).sort()];

  const filteredCameras = cameras.filter((cam) => {
    if (zoneFilter !== 'All' && cam.zone !== zoneFilter) return false;
    if (statusFilter !== 'All' && cam.status !== statusFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!cam.name.toLowerCase().includes(q) && !cam.id.toLowerCase().includes(q) && !cam.ip.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleCalibrate = (cam: CameraFeed) => {
    showToast('AI Calibration Initiated', `Recalibrating focal distortion matrix for ${cam.id}...`, 'info');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Live Real-Time Telemetry Stream Controls & HUD */}
      <RealTimeStreamControlBar />

      {/* Header */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Camera Sensor Inventory & Telemetry</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {cameras.length} REGISTERED NODES
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Hardware health status, optical calibration, RTSP streams, and edge vision models
            </p>
          </div>
        </div>

        {/* Quick summary counters */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800 text-cyan-300 font-bold">
            {workingCount} / {cameras.length} WORKING
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300">
            {onlineCount} ONLINE
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-300">
            {warningCount} WARNINGS
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            {offlineCount} OFFLINE
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, location, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-[11px]">Zone:</span>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
          >
            {zones.map((z) => (
              <option key={z} value={z}>{z === 'All' ? 'All Zones' : z}</option>
            ))}
          </select>

          <span className="text-slate-400 font-mono text-[11px] ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All</option>
            <option value="Online">Online</option>
            <option value="Warning">Warning</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Cameras Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Camera Node</th>
                <th className="p-3">Location & Zone</th>
                <th className="p-3">IP & Stream</th>
                <th className="p-3">Resolution & FPS</th>
                <th className="p-3">Active AI Models</th>
                <th className="p-3">Status</th>
                <th className="p-3">Inference Latency</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCameras.map((cam) => {
                const isOnline = cam.status === 'online';
                const isWarning = cam.status === 'warning';

                return (
                  <tr key={cam.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          isOnline ? "bg-emerald-400" : isWarning ? "bg-amber-400 animate-pulse" : "bg-red-500"
                        )} />
                        <span className="font-bold text-cyan-400">{cam.id}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="text-white font-sans font-medium">{cam.name}</div>
                      <div className="text-slate-400 text-[11px]">{cam.location} • {cam.zone}</div>
                    </td>

                    <td className="p-3">
                      <div className="text-slate-300">{cam.ip}</div>
                      <div className="text-slate-500 text-[10px]">rtsp://{cam.ip}:554/live</div>
                    </td>

                    <td className="p-3">
                      <div className="text-white">{cam.resolution}</div>
                      <div className="text-slate-400 text-[10px]">{cam.fps} FPS Target</div>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {cam.activeAiModels.map((m) => (
                          <span key={m} className="px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-700 text-[10px]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                        isOnline ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                        isWarning ? "bg-amber-950 text-amber-300 border border-amber-800" :
                        "bg-red-950 text-red-300 border border-red-800"
                      )}>
                        {cam.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={cn(
                        "font-bold",
                        cam.latencyMs > 40 ? "text-amber-400" : "text-emerald-400"
                      )}>
                        {cam.latencyMs > 0 ? `${cam.latencyMs} ms` : 'N/A'}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCamera(cam)}
                          className="p-1.5 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white transition-colors"
                          title="Open Live Stream"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => rebootCamera(cam.id)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Soft Reboot Stream"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCalibrate(cam)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Calibrate AI Lens Matrix"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
