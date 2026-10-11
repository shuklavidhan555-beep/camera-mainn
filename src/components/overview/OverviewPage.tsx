import React from 'react';
import { RealTimeStreamControlBar } from '../common/RealTimeStreamControlBar';
import { KpiOverviewCards } from './KpiOverviewCards';
import { CityMapPanel } from './CityMapPanel';
import { PriorityAlertsPanel } from './PriorityAlertsPanel';
import { LiveCameraFeedsGrid } from './LiveCameraFeedsGrid';
import { OverviewCharts } from './OverviewCharts';

export const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Live Real-Time Telemetry Stream Controls & HUD */}
      <RealTimeStreamControlBar />

      {/* 4 KPI Cards */}
      <KpiOverviewCards />

      {/* Main Section: Map (Left/Center) + Priority Alerts (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <CityMapPanel />
        </div>
        <div className="xl:col-span-1">
          <PriorityAlertsPanel />
        </div>
      </div>

      {/* Live Camera Feeds Section (2x2 Grid) */}
      <LiveCameraFeedsGrid />

      {/* Bottom Charts Section */}
      <OverviewCharts />
    </div>
  );
};
