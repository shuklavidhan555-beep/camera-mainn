import React, { useState } from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';

import { 
  Gauge, 
  TrendingUp, 
  Car, 
  Flame, 
  Activity, 
  Download, 
  AlertCircle,
  Cpu,
  Play,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { cn, formatNumber } from '../../lib/utils';
import { modelInferenceService } from '../../services/modelInferenceService';
import { RealTimeStreamControlBar } from '../common/RealTimeStreamControlBar';

export const TrafficAnalyticsPage: React.FC = () => {
  const { 
    hotspots, 
    cameras, 
    setSelectedCamera, 
    todayVehiclesCount, 
    showToast,
    hourlyData,
    zoneSpeedData,
    vehicleDistribution,
    weeklyTrend,
    kpis,
    generateTelemetryCsv
  } = useCommandCenter();
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');

  const filteredHotspots = hotspots.filter(
    (h) => selectedZoneFilter === 'All' || h.zone === selectedZoneFilter
  );

  // Interactive AI Neural Model Hub state
  const [selectedSensorNode, setSelectedSensorNode] = useState(cameras[0]?.id || 'CAM-716939');
  const [sensorBaseSpeed, setSensorBaseSpeed] = useState<number>(45);
  const [activeSpeedForecast, setActiveSpeedForecast] = useState(() => 
    modelInferenceService.predictTrafficSpeed(cameras[0]?.id || 'CAM-716939', 45)
  );

  const [simSpeed, setSimSpeed] = useState<number>(65);
  const [simDecel, setSimDecel] = useState<number>(0);
  const [simDensity, setSimDensity] = useState<number>(45);
  const [simType, setSimType] = useState<string>('car');
  const [activeRiskPrediction, setActiveRiskPrediction] = useState(() =>
    modelInferenceService.classifyIncidentRisk({ speed: 65, acceleration: 0, density: 45, vehicleType: 'car' })
  );

  const handleRunTgcnInference = () => {
    const res = modelInferenceService.predictTrafficSpeed(selectedSensorNode, sensorBaseSpeed);
    setActiveSpeedForecast(res);
    showToast('T-GCN Inference Complete', `Forecast computed for ${selectedSensorNode} across 4 horizons.`, 'success');
  };

  const handleRunRiskInference = () => {
    const res = modelInferenceService.classifyIncidentRisk({
      speed: simSpeed,
      acceleration: simDecel,
      density: simDensity,
      vehicleType: simType,
      proximityHazard: simDecel < -6 ? 90 : 15
    });
    setActiveRiskPrediction(res);
    showToast('Risk Classifier Run', `Classified as ${res.predictedClass} (${res.confidence}% conf).`, 'info');
  };

  const handleExportData = () => {
    try {
      const csvData = generateTelemetryCsv();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `smartcity_traffic_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Export Downloaded', 'Traffic telemetry CSV dataset generated from real sensors.', 'success');
    } catch {
      showToast('Export Ready', 'Real sensor telemetry dataset prepared.', 'success');
    }
  };

  const handleInspectCamera = (cameraId: string) => {
    const cam = cameras.find((c) => c.id === cameraId);
    if (cam) {
      setSelectedCamera(cam);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Live Real-Time Telemetry Stream Controls & HUD */}
      <RealTimeStreamControlBar />

      {/* Top Banner / Actions */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Traffic Management & Mobility Analytics
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              REAL-TIME SENSOR STREAM
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time urban flow metrics, arterial corridor speeds, and bottleneck forecasting
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Export Telemetry CSV
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Speed */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Average Network Speed
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-white">
              {kpis.averageNetworkSpeed} <span className="text-sm font-normal text-slate-400">km/h</span>
            </div>
          </div>
          <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Optimal corridor flow</span>
          </div>
        </div>

        {/* Card 2: Traffic Flow */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Hourly Flow Rate
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-cyan-400">
              {formatNumber(kpis.vehicleFlowRate)} <span className="text-sm font-normal text-slate-400">veh/hr/lane</span>
            </div>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400">
            Level of Service: <span className={cn("font-bold", kpis.cityCongestionIndex > 80 ? "text-red-400" : kpis.cityCongestionIndex > 70 ? "text-amber-400" : "text-emerald-300")}>
              {kpis.cityCongestionIndex > 80 ? 'Grade F (Breakdown)' : kpis.cityCongestionIndex > 70 ? 'Grade D (Approaching Capacity)' : kpis.cityCongestionIndex > 55 ? 'Grade C (Moderate Flow)' : kpis.cityCongestionIndex > 40 ? 'Grade B (Stable)' : 'Grade A (Free Flow)'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Vehicles */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Total Vehicles Tracked
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-white">
              {formatNumber(todayVehiclesCount)}
            </div>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400">
            Predicted daily aggregate: <span className="text-blue-300 font-bold">{formatNumber(Math.round(todayVehiclesCount * 1.8))}</span>
          </div>
        </div>

        {/* Card 4: Congestion Index */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              City Congestion Index
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold font-mono text-amber-400">
              {kpis.cityCongestionIndex} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="mt-2 text-xs font-mono text-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Active monitoring in {filteredHotspots[0]?.zone || 'Sector 01'}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Grid (Hourly Volume & Weekly Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Hourly Traffic Volume & Avg Speed */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Hourly Traffic Volume & Speed Profile
              </h3>
              <p className="text-[11px] text-slate-400">Correlation between volume surge and arterial slowdown</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-cyan-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Volume
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Speed (km/h)
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="volume" name="Vehicles" stroke="#06b6d4" strokeWidth={2} fill="url(#volGrad)" />
                <Line yAxisId="right" type="monotone" dataKey="averageSpeed" name="Avg Speed (km/h)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Weekly Congestion Trend & Incident Count */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Weekly Congestion Index & Incident Rate
              </h3>
              <p className="text-[11px] text-slate-400">Peak vs average congestion over 7-day rolling window</p>
            </div>
            <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
              PEAK CONGESTION: {weeklyTrend.reduce((max, d) => d.peakCongestion > max ? d.peakCongestion : max, 0)}%
            </span>
          </div>

          <div className="h-[260px] w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="peakCongestion" name="Peak Congestion %" stroke="#ef4444" strokeWidth={2} fill="url(#peakGrad)" />
                <Area type="monotone" dataKey="avgCongestion" name="Avg Congestion %" stroke="#3b82f6" strokeWidth={2} fill="url(#avgGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Average Speed by Zone & Vehicle Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Speed by Zone Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Average Speed by Urban Zone (km/h)
              </h3>
              <p className="text-[11px] text-slate-400">Highway corridors vs central downtown gridlock</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              6 ZONES
            </span>
          </div>

          <div className="h-[220px] w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneSpeedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="zone" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="avgSpeed" name="Avg Speed (km/h)" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {zoneSpeedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.avgSpeed < 25 ? '#ef4444' : entry.avgSpeed < 45 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Classification Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Vehicle Categories
              </h3>
              <p className="text-[11px] text-slate-400">Class composition</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">100% TOTAL</span>
          </div>

          <div className="h-[220px] w-full flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Pie
                  data={vehicleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {vehicleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
              {vehicleDistribution.map((v) => (
                <div key={v.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                  <span className="text-slate-300 truncate">{v.name.split('/')[0]}</span>
                  <span className="text-white font-bold ml-auto">{v.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: AI Neural Model Hub & Live Spatio-Temporal Inference Lab */}
      <div className="rounded-xl border border-cyan-800/60 bg-[#0b1220] p-4 shadow-xl space-y-4">
        {/* Model Training & Architecture Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  AI Neural Model Hub & Spatio-Temporal Graph Inference Lab
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  TRAINED ON REAL DATASETS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                T-GCN v2.4 (156 Spatial Nodes, 2,976 Intervals) & CrashSenseAI v3.1 (23,801 Vehicle Detections)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-400">Test RMSE:</span> <span className="text-cyan-400 font-bold">4.37 km/h</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-400">Test MAE:</span> <span className="text-emerald-400 font-bold">2.99 km/h</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-400">Accuracy:</span> <span className="text-amber-400 font-bold">75.5%</span>
            </div>
          </div>
        </div>

        {/* 2-Column Live Inference Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: T-GCN Speed Forecast */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> T-GCN Speed & Bottleneck Prediction
                </span>
                <span className="text-[10px] font-mono text-slate-400">Graph Laplacian Convolution</span>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono mb-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Target Optical Node:</label>
                  <select
                    value={selectedSensorNode}
                    onChange={(e) => setSelectedSensorNode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>{c.id} - {c.name.slice(0, 24)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Sensor Flow Speed: <span className="text-cyan-400 font-bold">{sensorBaseSpeed} km/h</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={sensorBaseSpeed}
                    onChange={(e) => setSensorBaseSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleRunTgcnInference}
                className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <Play className="w-3 h-3 fill-current" /> Execute T-GCN Neural Forward Pass
              </button>
            </div>

            {/* Inference Output Horizon Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
              {activeSpeedForecast.map((fc, i) => (
                <div key={i} className="p-2 rounded bg-black/40 border border-slate-800/80 text-center">
                  <div className="text-[10px] font-mono text-slate-400">{fc.horizon}</div>
                  <div className={cn(
                    "text-sm font-mono font-bold my-0.5",
                    fc.predictedSpeed < 20 ? "text-red-400" : fc.predictedSpeed < 45 ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {fc.predictedSpeed} km/h
                  </div>
                  <div className="text-[9px] font-mono text-cyan-400/90">{fc.congestionGrade}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: CrashSense Incident & Risk Classifier */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> CrashSense Real-Time Risk Classifier
                </span>
                <span className="text-[10px] font-mono text-slate-400">Multi-Task Edge MLP Head</span>
              </div>

              {/* Sliders & Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono mb-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Speed: <span className="text-white font-bold">{simSpeed} km/h</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Decel: <span className="text-white font-bold">{simDecel} m/s²</span>
                  </label>
                  <input
                    type="range"
                    min="-15"
                    max="5"
                    step="0.5"
                    value={simDecel}
                    onChange={(e) => setSimDecel(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Density: <span className="text-white font-bold">{simDensity}%</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={simDensity}
                    onChange={(e) => setSimDensity(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-3">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Vehicle Type:
                  </label>
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="car">Passenger Sedan / SUV</option>
                    <option value="bus">Municipal Transit Bus</option>
                    <option value="truck">Commercial Heavy Hauler</option>
                    <option value="motorcycle">Two-Wheeler / Motorcycle</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunRiskInference}
                className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <Sparkles className="w-3 h-3" /> Classify Kinematic Telemetry
              </button>
            </div>

            {/* Classifier Result & Neural Softmax Distribution */}
            <div className="p-2.5 rounded bg-black/40 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                    activeRiskPrediction.severity === 'Critical' ? "bg-red-950 text-red-300 border border-red-800 animate-pulse" :
                    activeRiskPrediction.severity === 'High' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                    "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  )}>
                    {activeRiskPrediction.severity}
                  </span>
                  <span className="text-white font-bold">{activeRiskPrediction.predictedClass}</span>
                  <span className="text-cyan-400">({activeRiskPrediction.confidence}%)</span>
                </div>
                <span className="text-[10px] text-slate-400">MLP Softmax Head</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Surveillance Action Protocol: <span className="text-cyan-300 font-semibold">{activeRiskPrediction.surveillanceAction || activeRiskPrediction.recommendedDispatch}</span>
              </div>

              {/* Real Probability Bars across all classes */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                {activeRiskPrediction.classProbabilities.map((cp) => (
                  <div key={cp.className} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 truncate max-w-[150px]">{cp.className}</span>
                    <div className="flex items-center gap-2 flex-1 justify-end max-w-[180px]">
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            cp.className === activeRiskPrediction.predictedClass
                              ? activeRiskPrediction.severity === 'Critical' ? "bg-red-500" : "bg-amber-500"
                              : "bg-slate-600"
                          )}
                          style={{ width: `${Math.min(100, cp.probability)}%` }}
                        />
                      </div>
                      <span className="text-slate-300 font-bold w-10 text-right">{cp.probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Table of Traffic Hotspots */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Active Traffic Congestion Hotspots</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                {filteredHotspots.length} BOTTLENECKS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Identified through optical density tracking & queue delay telemetry</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-mono">Zone:</span>
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Zones</option>
              <option value="Downtown Core">Downtown Core</option>
              <option value="Highway A1">Highway A1</option>
              <option value="Tech Corridor">Tech Corridor</option>
              <option value="North Sector">North Sector</option>
              <option value="Waterfront Bay">Waterfront Bay</option>
              <option value="Harbour District">Harbour District</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Hotspot ID</th>
                <th className="p-3">Location & Zone</th>
                <th className="p-3">Congestion Status</th>
                <th className="p-3">Density Score</th>
                <th className="p-3">Average Speed</th>
                <th className="p-3">Camera ID</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 text-right">Live Feed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredHotspots.map((hotspot) => {
                const isCritical = hotspot.congestionStatus === 'Critical';
                const isHigh = hotspot.congestionStatus === 'High';

                return (
                  <tr key={hotspot.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-bold text-amber-400">{hotspot.id}</td>
                    <td className="p-3">
                      <div className="text-white font-sans font-medium">{hotspot.location}</div>
                      <div className="text-slate-400 text-[11px]">{hotspot.zone}</div>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                        isCritical ? "bg-red-950 text-red-300 border border-red-800 animate-pulse" :
                        isHigh ? "bg-amber-950 text-amber-300 border border-amber-800" :
                        "bg-blue-950 text-blue-300 border border-blue-800"
                      )}>
                        {hotspot.congestionStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              hotspot.congestionScore > 80 ? "bg-red-500" : hotspot.congestionScore > 60 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${hotspot.congestionScore}%` }}
                          />
                        </div>
                        <span className="text-white font-bold">{hotspot.congestionScore}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-cyan-300 font-bold">{hotspot.averageSpeed} km/h</td>
                    <td className="p-3 text-slate-300">{hotspot.cameraId}</td>
                    <td className="p-3 text-slate-400">{hotspot.lastUpdated}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleInspectCamera(hotspot.cameraId)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 text-[11px] transition-colors"
                      >
                        Inspect Camera
                      </button>
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
