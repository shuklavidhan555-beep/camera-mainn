import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar
} from 'recharts';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { Activity, PieChart as PieIcon, BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono backdrop-blur">
        <p className="text-white font-bold mb-1 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span style={{ color: entry.color }} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const OverviewCharts: React.FC = () => {
  const { hourlyData, vehicleDistribution, zoneSpeedData } = useCommandCenter();

  // Find dynamic peak hour
  const peakPoint = hourlyData.reduce((max, h) => h.volume > max.volume ? h : max, hourlyData[0]) || { hour: '12:00' };

  // Format zone data for horizontal bar chart
  const zoneChartData = zoneSpeedData.map((z) => ({
    name: z.zone.replace(' District', '').replace(' Sector', ''),
    congestion: z.congestionScore,
    speed: z.avgSpeed,
  }));

  const maxCongestionZone = zoneSpeedData.reduce(
    (max, z) => z.congestionScore > max.congestionScore ? z : max,
    zoneSpeedData[0] || { zone: 'Downtown Core', congestionScore: 84 }
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart 1: Traffic Volume by Hour */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 flex flex-col shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Traffic Volume by Hour</h4>
              <p className="text-[10px] text-slate-400">Vehicles per hour vs baseline expectation</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            PEAK: {peakPoint.hour}
          </span>
        </div>

        <div className="h-[210px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="volume" 
                name="Live Volume" 
                stroke="#06b6d4" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#volumeGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="baseline" 
                name="Historical Avg" 
                stroke="#64748b" 
                strokeWidth={1.5} 
                strokeDasharray="3 3" 
                fillOpacity={1} 
                fill="url(#baselineGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Vehicle Type Distribution */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 flex flex-col shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Vehicle Classification</h4>
              <p className="text-[10px] text-slate-400">YOLOv8 & ByteTrack object distribution</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            {(vehicleDistribution.reduce((sum, v) => sum + v.count, 0) / 1000).toFixed(1)}k TAGGED
          </span>
        </div>

        <div className="h-[210px] w-full flex items-center justify-between">
          <div className="w-[55%] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={vehicleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {vehicleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0d1424" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Side Legend */}
          <div className="w-[45%] flex flex-col gap-1.5 pr-2">
            {vehicleDistribution.map((item) => (
              <div key={item.name} className="flex flex-col text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 truncate max-w-[90px]">{item.name.split('/')[0]}</span>
                  </div>
                  <span className="text-white font-bold">{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-0.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Congestion by Zone */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 flex flex-col shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Congestion Index by Zone</h4>
              <p className="text-[10px] text-slate-400">Corridor density score (0 - 100 max)</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40 uppercase">
            {maxCongestionZone.zone.replace(' District', '').replace(' Sector', '')} {maxCongestionZone.congestionScore}%
          </span>
        </div>

        <div className="h-[210px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={zoneChartData} 
              layout="vertical" 
              margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={75} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="congestion" 
                name="Congestion Score" 
                radius={[0, 4, 4, 0]}
              >
                {zoneChartData.map((entry, index) => {
                  const color = entry.congestion >= 80 ? '#ef4444' : entry.congestion >= 60 ? '#f59e0b' : '#10b981';
                  return <Cell key={`bar-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
