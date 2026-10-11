import React from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { 
  Camera, 
  Car, 
  Flame, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight, 
  AlertTriangle,
  Radio
} from 'lucide-react';
import { formatNumber, cn } from '../../lib/utils';

export const KpiOverviewCards: React.FC = () => {
  const { 
    safetyAlerts, 
    kpis,
    setActiveTab,
    todayVehiclesCount,
    hourlyData
  } = useCommandCenter();

  const activeCameras = kpis.activeCameras;
  const totalCameras = kpis.totalCameras;
  const criticalAlerts = kpis.criticalAlertsCount;
  const totalHotspots = kpis.activeBottlenecks;

  const topCriticalAlert = safetyAlerts.find((a) => a.severity === 'Critical' && !a.acknowledged);

  const totalVolume = hourlyData.reduce((sum, h) => sum + h.volume, 0);
  const totalBaseline = hourlyData.reduce((sum, h) => sum + h.baseline, 0);
  const baselineDiffPercent = totalBaseline > 0 
    ? Number((((totalVolume - totalBaseline) / totalBaseline) * 100).toFixed(1)) 
    : 0;
  const isAboveBaseline = baselineDiffPercent >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Active Cameras */}
      <div 
        onClick={() => setActiveTab('cameras')}
        className="group relative p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-cyan-500/60 hover:bg-[#10192e] transition-all cursor-pointer shadow-md overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            Active Cameras
          </span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {activeCameras} <span className="text-lg text-slate-500 font-normal">/ {totalCameras} Working</span>
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{kpis.operationalPercentage}% Operational (Real-Time)</span>
          </div>
          <span className="text-slate-500 flex items-center gap-0.5 group-hover:text-cyan-400 transition-colors">
            Manage <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Ambient glow accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI 2: Vehicles Detected Today */}
      <div 
        onClick={() => setActiveTab('traffic')}
        className="group relative p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-blue-500/60 hover:bg-[#10192e] transition-all cursor-pointer shadow-md overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Vehicles Detected Today
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          </span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatNumber(todayVehiclesCount)}
          </span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 animate-pulse">
            {(todayVehiclesCount - 23801) > 0 ? `+${todayVehiclesCount - 23801} live` : 'streaming'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 font-mono">
          <div className={cn("flex items-center gap-1", isAboveBaseline ? "text-emerald-400" : "text-amber-400")}>
            {isAboveBaseline ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{isAboveBaseline ? `+${baselineDiffPercent}%` : `${baselineDiffPercent}%`} vs Baseline</span>
          </div>
          <span className="text-slate-500 flex items-center gap-0.5 group-hover:text-blue-400 transition-colors">
            Analytics <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI 3: Congestion Hotspots */}
      <div 
        onClick={() => setActiveTab('traffic')}
        className="group relative p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-amber-500/60 hover:bg-[#10192e] transition-all cursor-pointer shadow-md overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            Congestion Hotspots
          </span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
            {totalHotspots}
          </span>
          <span className="text-xs font-mono text-slate-400">active corridors ({kpis.averageNetworkSpeed} km/h)</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 font-mono">
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span>{kpis.severeBottlenecks} Severe Bottlenecks</span>
          </div>
          <span className="text-slate-500 flex items-center gap-0.5 group-hover:text-amber-400 transition-colors">
            View Map <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI 4: Accidents & Safety Alerts */}
      <div 
        onClick={() => setActiveTab('alerts')}
        className={cn(
          "group relative p-4 rounded-xl border transition-all cursor-pointer shadow-md overflow-hidden",
          criticalAlerts > 0
            ? "border-red-500/60 bg-red-950/20 hover:bg-red-950/30 glow-red"
            : "border-slate-800 bg-[#0d1424] hover:border-slate-700"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            Accidents & Safety Alerts
            {criticalAlerts > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            )}
          </span>
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            criticalAlerts > 0 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-slate-800 text-slate-400"
          )}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className={cn(
            "text-3xl font-extrabold font-mono tracking-tight",
            criticalAlerts > 0 ? "text-red-400" : "text-white"
          )}>
            {criticalAlerts}
          </span>
          <span className="text-xs font-mono text-red-300/80">
            unresolved ({kpis.totalAccidentsToday} today)
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 font-mono">
          <div className="flex items-center gap-1.5 text-red-400 font-bold truncate max-w-[200px]">
            <Radio className="w-3 h-3 animate-spin shrink-0" />
            <span className="truncate">{topCriticalAlert ? `${topCriticalAlert.type} (LIVE)` : 'All Sectors Monitored'}</span>
          </div>
          <span className="text-red-300 flex items-center gap-0.5 group-hover:underline shrink-0">
            Resolve <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Ambient glow */}
        {criticalAlerts > 0 && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        )}
      </div>
    </div>
  );
};
