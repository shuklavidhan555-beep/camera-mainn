import React, { useState, useMemo } from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { CCTVFeedPlayer } from '../common/CCTVFeedPlayer';
import { 
  Video, 
  Grid2X2, 
  Grid3X3, 
  LayoutList, 
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RealTimeStreamControlBar } from '../common/RealTimeStreamControlBar';

export const LiveSurveillancePage: React.FC = () => {
  const { cameras, setSelectedCamera } = useCommandCenter();

  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedIncident, setSelectedIncident] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [gridLayout, setGridLayout] = useState<'4' | '6' | 'list'>('4');

  const [currentPage, setCurrentPage] = useState(0);

  // Filter cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      if (selectedZone !== 'All' && cam.zone !== selectedZone) return false;
      if (selectedStatus !== 'All' && cam.status !== selectedStatus.toLowerCase()) return false;
      if (selectedIncident !== 'All') {
        if (selectedIncident === 'IncidentOnly' && cam.incidentType === 'Normal') return false;
        if (selectedIncident !== 'IncidentOnly' && cam.incidentType !== selectedIncident) return false;
      }
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchesName = cam.name.toLowerCase().includes(query);
        const matchesId = cam.id.toLowerCase().includes(query);
        const matchesLoc = cam.location.toLowerCase().includes(query);
        const matchesIp = cam.ip.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesLoc && !matchesIp) return false;
      }
      return true;
    });
  }, [cameras, selectedZone, selectedStatus, selectedIncident, searchFilter]);

  const pageSize = gridLayout === '4' ? 4 : gridLayout === '6' ? 6 : filteredCameras.length;
  const totalPages = Math.max(1, Math.ceil(filteredCameras.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));

  const displayedCameras = useMemo(() => {
    if (gridLayout === 'list') return filteredCameras;
    const start = safeCurrentPage * pageSize;
    return filteredCameras.slice(start, start + pageSize);
  }, [filteredCameras, gridLayout, safeCurrentPage, pageSize]);

  const onlineCount = cameras.filter((c) => c.status === 'online').length;
  const warningCount = cameras.filter((c) => c.status === 'warning').length;
  const offlineCount = cameras.filter((c) => c.status === 'offline').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Live Real-Time Telemetry Stream Controls & HUD */}
      <RealTimeStreamControlBar />

      {/* Top Filter and Matrix Control Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        {/* Left: Title & Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Live Surveillance Video Wall</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {filteredCameras.length} STREAMING
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> {onlineCount} Online
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> {warningCount} Warning
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-600" /> {offlineCount} Offline
              </span>
            </div>
          </div>
        </div>

        {/* Right: Layout Switchers & Pagination */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {gridLayout !== 'list' && totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300">
              <span className="text-[11px] text-slate-400">
                Page {safeCurrentPage + 1}/{totalPages}
              </span>
              <button
                disabled={safeCurrentPage === 0}
                onClick={() => setCurrentPage(Math.max(0, safeCurrentPage - 1))}
                className="px-1.5 py-0.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-cyan-400 font-bold"
                title="Previous Page"
              >
                ‹
              </button>
              <button
                disabled={safeCurrentPage >= totalPages - 1}
                onClick={() => setCurrentPage(Math.min(totalPages - 1, safeCurrentPage + 1))}
                className="px-1.5 py-0.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-cyan-400 font-bold"
                title="Next Page"
              >
                ›
              </button>
            </div>
          )}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setGridLayout('4')}
              className={cn(
                "p-1.5 rounded text-xs transition-colors font-mono flex items-center gap-1",
                gridLayout === '4' ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
              )}
              title="2x2 Focused Quad Grid"
            >
              <Grid2X2 className="w-4 h-4" />
              <span className="hidden sm:inline">2x2</span>
            </button>
            <button
              onClick={() => setGridLayout('6')}
              className={cn(
                "p-1.5 rounded text-xs transition-colors font-mono flex items-center gap-1",
                gridLayout === '6' ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
              )}
              title="3x2 Matrix Grid"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">3x2</span>
            </button>
            <button
              onClick={() => setGridLayout('list')}
              className={cn(
                "p-1.5 rounded text-xs transition-colors font-mono flex items-center gap-1",
                gridLayout === 'list' ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
              )}
              title="Detailed List Table"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center gap-3 text-xs shadow-md">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search camera by name, sector, IP, or ID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
          />
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px]">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Zones (6)</option>
            <option value="Downtown Core">Downtown Core</option>
            <option value="Highway A1">Highway A1</option>
            <option value="Waterfront Bay">Waterfront Bay</option>
            <option value="Tech Corridor">Tech Corridor</option>
            <option value="North Sector">North Sector</option>
            <option value="Harbour District">Harbour District</option>
          </select>
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px]">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="Online">Online Feeds</option>
            <option value="Warning">Warning / Incidents</option>
            <option value="Offline">Offline Units</option>
          </select>
        </div>

        {/* Incident Type Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono text-[11px]">Incident:</span>
          <select
            value={selectedIncident}
            onChange={(e) => setSelectedIncident(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Events</option>
            <option value="IncidentOnly">⚠️ Any Incident</option>
            <option value="Traffic Accident">Traffic Accident</option>
            <option value="Wrong-Way Vehicle">Wrong-Way Vehicle</option>
            <option value="Overspeeding">Overspeeding</option>
            <option value="Pedestrian in Restricted Area">Pedestrian Violation</option>
            <option value="Illegal Parking">Illegal Parking</option>
          </select>
        </div>
      </div>

      {/* Main Video Feeds Display */}
      {filteredCameras.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-800 bg-[#0d1424] text-slate-400 font-mono text-xs">
          No camera feeds matching the current filter criteria.
        </div>
      ) : gridLayout === 'list' ? (
        /* Detailed List Table View */
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Camera ID</th>
                  <th className="p-3">Location / Zone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Vehicles</th>
                  <th className="p-3">Pedestrians</th>
                  <th className="p-3">Congestion</th>
                  <th className="p-3">Incident</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCameras.map((camera) => (
                  <tr 
                    key={camera.id}
                    onClick={() => setSelectedCamera(camera)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold text-cyan-400">{camera.id}</td>
                    <td className="p-3">
                      <div className="text-white font-sans font-medium">{camera.name}</div>
                      <div className="text-slate-400 text-[11px]">{camera.location}</div>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                        camera.status === 'online' ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                        camera.status === 'warning' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                        "bg-red-950 text-red-300 border border-red-800"
                      )}>
                        {camera.status}
                      </span>
                    </td>
                    <td className="p-3 text-white font-bold">{camera.vehicleCount}</td>
                    <td className="p-3 text-amber-300">{camera.pedestrianCount}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              camera.congestionScore > 75 ? "bg-red-500" : camera.congestionScore > 50 ? "bg-amber-500" : "bg-emerald-500"
                            )} 
                            style={{ width: `${camera.congestionScore}%` }} 
                          />
                        </div>
                        <span className="text-[11px] text-slate-300">{camera.congestionScore}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {camera.incidentType !== 'Normal' ? (
                        <span className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                          {camera.incidentType}
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{camera.latencyMs} ms</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCamera(camera);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-[11px] transition-colors"
                      >
                        Inspect Feed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Video Feeds Grid (2x2 or 3x2) */
        <div className={cn(
          "grid gap-4",
          gridLayout === '4' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {displayedCameras.map((camera) => (
            <CCTVFeedPlayer
              key={camera.id}
              camera={camera}
              isDetailed={false}
              showAiOverlayDefault={true}
              onSelect={() => setSelectedCamera(camera)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
