import React, { useState } from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { NavigationTab } from '../../types';
import { 
  LayoutDashboard, 
  Video, 
  Activity, 
  ShieldAlert, 
  Camera, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Cpu
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, safetyAlerts, cameras, hotspots, kpis } = useCommandCenter();
  const [collapsed, setCollapsed] = useState(false);

  const criticalCount = safetyAlerts.filter((a) => a.severity === 'Critical' && !a.acknowledged).length;
  const avgLatency = cameras.length > 0 
    ? Math.round(cameras.reduce((sum, c) => sum + (c.latencyMs || 0), 0) / cameras.length) 
    : 38;

  const workingCount = cameras.filter((c) => c.status !== 'offline').length;

  const navigationItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'surveillance', label: 'Live Surveillance', icon: Video, badge: `${workingCount} LIVE`, badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    { id: 'traffic', label: 'Traffic Analytics', icon: Activity, badge: `${hotspots.length} HOTSPOTS`, badgeColor: 'bg-amber-950 text-amber-300 border-amber-800' },
    { 
      id: 'alerts', 
      label: 'Safety Alerts', 
      icon: ShieldAlert, 
      badge: criticalCount > 0 ? `${criticalCount} CRIT` : `${safetyAlerts.filter(a => !a.acknowledged).length} ACTIVE`, 
      badgeColor: criticalCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
    },
    { id: 'cameras', label: 'Cameras', icon: Camera, badge: `${workingCount}/${cameras.length}`, badgeColor: 'bg-slate-800 text-slate-300' },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col justify-between border-r border-slate-800 bg-[#090d17] transition-all duration-300 z-40 select-none shadow-xl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Section */}
      <div>
        {/* Sidebar Brand / Collapse Button */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-widest text-slate-300 uppercase">
                AETHER // CONTROL
              </span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors mx-auto"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1.5 mt-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all relative group",
                  isActive
                    ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-cyan-400" : "text-slate-400"
                )} />

                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border",
                        item.badgeColor || "bg-slate-800 text-slate-300"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Subtle active left bar indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-cyan-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: AI System Status Indicator */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        {!collapsed ? (
          <div className="space-y-2">
            {/* AI System Status: Operational indicator */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <div className="text-[11px] font-mono font-bold text-white leading-tight">
                    AI System Status
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400">
                    Operational (v4.8)
                  </div>
                </div>
              </div>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Inference pipeline telemetry */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>Avg Latency: <span className="text-cyan-400">{avgLatency}ms</span></span>
              <span>Uptime: <span className="text-slate-200">{kpis.operationalPercentage}%</span></span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2" title="AI System Status: Operational">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
