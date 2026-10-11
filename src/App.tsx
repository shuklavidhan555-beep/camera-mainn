import React from 'react';
import { CommandCenterProvider, useCommandCenter } from './context/CommandCenterContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { EmergencyBanner } from './components/layout/EmergencyBanner';
import { ToastContainer } from './components/common/ToastContainer';
import { OverviewPage } from './components/overview/OverviewPage';
import { LiveSurveillancePage } from './components/surveillance/LiveSurveillancePage';
import { TrafficAnalyticsPage } from './components/traffic/TrafficAnalyticsPage';
import { SafetyAlertsPage } from './components/alerts/SafetyAlertsPage';
import { CamerasPage } from './components/cameras/CamerasPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { CameraDetailModal } from './components/surveillance/CameraDetailModal';
import { AccidentDetailModal } from './components/alerts/AccidentDetailModal';

const DashboardContent: React.FC = () => {
  const { 
    activeTab, 
    selectedCamera, 
    setSelectedCamera, 
    selectedAlertForModal, 
    setSelectedAlertForModal,
    cameras 
  } = useCommandCenter();

  const avgLatency = cameras.length > 0 
    ? Math.round(cameras.reduce((sum, c) => sum + (c.latencyMs || 0), 0) / cameras.length) 
    : 38;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070a12] text-slate-100">
      {/* Left Collapsible Sidebar */}
      <Sidebar />

      {/* Main Command Center Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Emergency Warning Banner */}
        <EmergencyBanner />

        {/* Top Navigation & Status Bar */}
        <TopBar />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-grid-pattern relative">
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'surveillance' && <LiveSurveillancePage />}
          {activeTab === 'traffic' && <TrafficAnalyticsPage />}
          {activeTab === 'alerts' && <SafetyAlertsPage />}
          {activeTab === 'cameras' && <CamerasPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}

          {/* Bottom command center watermark */}
          <footer className="mt-8 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
            <div>
              SmartCity Command Center v4.8 • AI Vision Engine Active • ISO 37120 Compliant
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Network Grid Synchronized
              </span>
              <span>Latency: {avgLatency}ms</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Modals */}
      {selectedCamera && (
        <CameraDetailModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}

      {selectedAlertForModal && (
        <AccidentDetailModal
          alert={selectedAlertForModal}
          onClose={() => setSelectedAlertForModal(null)}
        />
      )}

      {/* Operator Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <CommandCenterProvider>
      <DashboardContent />
    </CommandCenterProvider>
  );
}

export default App;
