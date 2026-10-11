import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  CameraFeed, 
  SafetyAlert, 
  TrafficHotspot, 
  ThemeMode, 
  NavigationTab,
  AlertSeverity,
  HourlyTrafficData,
  VehicleDistribution,
  ZoneSpeedData,
  WeeklyTrendPoint,
  KinematicInteraction
} from '../types';
import { 
  REAL_CAMERAS as INITIAL_CAMERAS, 
  REAL_SAFETY_ALERTS as INITIAL_SAFETY_ALERTS, 
  REAL_CONGESTION_HOTSPOTS as CONGESTION_HOTSPOTS, 
  REAL_HOURLY_TRAFFIC_DATA as HOURLY_TRAFFIC_DATA, 
  REAL_VEHICLE_DISTRIBUTION as VEHICLE_DISTRIBUTION, 
  REAL_ZONE_SPEED_DATA as ZONE_SPEED_DATA, 
  REAL_WEEKLY_CONGESTION_TREND as WEEKLY_CONGESTION_TREND, 
  REAL_TOTAL_VEHICLES_TODAY, 
  DATASET_METADATA 
} from '../data/realDataset';
import { dataService, DashboardKpis, DatasetMetadata } from '../services/dataService';
import { realTimeStreamEngine } from '../services/realTimeStreamEngine';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'critical';
}

interface CommandCenterContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  
  // Data backed by real datasets
  cameras: CameraFeed[];
  safetyAlerts: SafetyAlert[];
  hotspots: TrafficHotspot[];
  hourlyData: HourlyTrafficData[];
  vehicleDistribution: VehicleDistribution[];
  zoneSpeedData: ZoneSpeedData[];
  weeklyTrend: WeeklyTrendPoint[];
  metadata: DatasetMetadata;
  
  // Calculated KPIs
  kpis: DashboardKpis;
  
  // Modals & Selection
  selectedCamera: CameraFeed | null;
  setSelectedCamera: (camera: CameraFeed | null) => void;
  selectedAlertForModal: SafetyAlert | null;
  setSelectedAlertForModal: (alert: SafetyAlert | null) => void;

  // Actions
  acknowledgeAlert: (alertId: string) => void;
  dispatchEmergencyTeam: (alertId: string, unitType: string) => void;
  rebootCamera: (cameraId: string) => void;
  triggerSimulatedAlert: () => void;
  createDynamicSafetyAlert: (
    camera: CameraFeed,
    interaction: KinematicInteraction,
    snapshotImage?: string
  ) => SafetyAlert;
  triggerSimulatedCollisionAlert: (
    collisionType?: 'Vehicle-Vehicle' | 'Vehicle-Pedestrian' | 'Vehicle-Animal'
  ) => SafetyAlert;
  ingestRealTimeIncident: (targetCameraId?: string) => SafetyAlert;
  
  // Filters & Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  
  // UI State
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  emergencyBannerOpen: boolean;
  setEmergencyBannerOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;

  // Real-time streaming engine & metrics
  isStreamingActive: boolean;
  setIsStreamingActive: (active: boolean) => void;
  streamSpeed: 1 | 2 | 5;
  setStreamSpeed: (speed: 1 | 2 | 5) => void;
  streamTickCount: number;
  todayVehiclesCount: number;
  todayAccidentsCount: number;
  activeWorkingCamerasCount: number;
  streamBandwidthMbps: number;

  // Export functions
  generateTelemetryCsv: () => string;
  generateVehicleDetectionsCsv: () => string;
}

const CommandCenterContext = createContext<CommandCenterContextType | undefined>(undefined);

// Web Audio API beep synthesizer for realistic control room sound effects
const playControlRoomBeep = (freq = 880, type: OscillatorType = 'sine', duration = 0.12) => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio context autoplay restriction gracefully
  }
};

export const CommandCenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>(INITIAL_SAFETY_ALERTS);
  const [hotspots, setHotspots] = useState<TrafficHotspot[]>(CONGESTION_HOTSPOTS);
  const [hourlyData, setHourlyData] = useState<HourlyTrafficData[]>(HOURLY_TRAFFIC_DATA);
  const [vehicleDistribution, setVehicleDistribution] = useState<VehicleDistribution[]>(VEHICLE_DISTRIBUTION);
  const [zoneSpeedData, setZoneSpeedData] = useState<ZoneSpeedData[]>(ZONE_SPEED_DATA);
  const [weeklyTrend] = useState<WeeklyTrendPoint[]>(WEEKLY_CONGESTION_TREND);
  
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(null);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<SafetyAlert | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emergencyBannerOpen, setEmergencyBannerOpen] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Real-time streaming engine state
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeedState] = useState<1 | 2 | 5>(1);
  const [streamTickCount, setStreamTickCount] = useState<number>(0);
  const [todayVehiclesCount, setTodayVehiclesCount] = useState<number>(REAL_TOTAL_VEHICLES_TODAY || 23801);
  const [todayAccidentsCount, setTodayAccidentsCount] = useState<number>(14);
  const [streamBandwidthMbps, setStreamBandwidthMbps] = useState<number>(54.2);

  // Sync theme to document body
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    document.documentElement.classList.remove('dark', 'theme-monochrome', 'theme-light');
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'monochrome') {
      document.documentElement.classList.add('dark', 'theme-monochrome');
    } else {
      document.documentElement.classList.add('theme-light');
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const activeWorkingCamerasCount = useMemo(() => {
    return cameras.filter((c) => c.status === 'online' || c.status === 'warning').length;
  }, [cameras]);

  // Keep selectedCamera synchronized with live camera telemetry stream
  const liveSelectedCamera = useMemo(() => {
    if (!selectedCamera) return null;
    return cameras.find((c) => c.id === selectedCamera.id) || selectedCamera;
  }, [selectedCamera, cameras]);

  // Compute dynamic KPIs based on current real records
  const kpis = useMemo(() => {
    return dataService.calculateKpis(
      cameras, 
      safetyAlerts, 
      hotspots, 
      todayVehiclesCount, 
      todayAccidentsCount,
      zoneSpeedData,
      hourlyData
    );
  }, [cameras, safetyAlerts, hotspots, todayVehiclesCount, todayAccidentsCount, zoneSpeedData, hourlyData]);

  const setStreamSpeed = (speed: 1 | 2 | 5) => {
    setStreamSpeedState(speed);
    realTimeStreamEngine.setStreamSpeed(speed);
  };

  const handleSetIsStreamingActive = (active: boolean) => {
    setIsStreamingActive(active);
    realTimeStreamEngine.setRunning(active);
  };

  // State refs to prevent interval re-subscription tear-down
  const zoneSpeedDataRef = React.useRef(zoneSpeedData);
  const hourlyDataRef = React.useRef(hourlyData);
  const hotspotsRef = React.useRef(hotspots);

  useEffect(() => { zoneSpeedDataRef.current = zoneSpeedData; }, [zoneSpeedData]);
  useEffect(() => { hourlyDataRef.current = hourlyData; }, [hourlyData]);
  useEffect(() => { hotspotsRef.current = hotspots; }, [hotspots]);

  // Real-time continuous telemetry ticker effect
  useEffect(() => {
    if (!isStreamingActive) return;

    const intervalMs = Math.max(300, Math.round(1500 / streamSpeed));
    const timer = setInterval(() => {
      setStreamTickCount((prev) => {
        const nextTick = prev + 1;

        // 1. Advance vehicle detections (cars, trucks, buses, motorcycles)
        setVehicleDistribution((prevDist) => {
          const res = realTimeStreamEngine.advanceVehicleDetections(prevDist);
          setTodayVehiclesCount(realTimeStreamEngine.todayVehiclesCount);
          return res.updatedDistribution;
        });

        // 2. Advance camera hardware telemetry (ping/latency jitter, FPS, throughput, vehicle count, congestion score)
        setCameras((prevCams) => {
          const updated = realTimeStreamEngine.advanceCameraTelemetry(prevCams);
          setStreamBandwidthMbps(realTimeStreamEngine.aggregateBandwidthMbps);
          return updated;
        });

        // 3. Advance T-GCN temporal speed intervals every 6 ticks
        if (nextTick % 6 === 0) {
          const res = realTimeStreamEngine.advanceTemporalInterval(
            zoneSpeedDataRef.current,
            hourlyDataRef.current,
            hotspotsRef.current
          );
          setZoneSpeedData(res.updatedZoneSpeedData);
          setHourlyData(res.updatedHourlyData);
          setHotspots(res.updatedHotspots);
        }

        // 4. Ingest real accident every 24 ticks (~36s at 1x)
        if (nextTick % 24 === 0) {
          const newIncident = realTimeStreamEngine.getNextRealIncident();
          setSafetyAlerts((prevAlerts) => {
            const updated = [newIncident, ...prevAlerts];
            return updated.length > 80 ? updated.slice(0, 80) : updated;
          });
          setTodayAccidentsCount(realTimeStreamEngine.todayAccidentsCount);

          setCameras((prevCams) =>
            prevCams.map((c) =>
              c.id === newIncident.cameraId
                ? { ...c, status: 'warning', incidentType: newIncident.type }
                : c
            )
          );

          if (soundEnabled) {
            playControlRoomBeep(440, 'sawtooth', 0.25);
          }
        }

        return nextTick;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStreamingActive, streamSpeed, soundEnabled]);

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    if (soundEnabled) {
      if (type === 'critical') playControlRoomBeep(440, 'sawtooth', 0.25);
      else if (type === 'success') playControlRoomBeep(1040, 'sine', 0.15);
      else playControlRoomBeep(780, 'sine', 0.1);
    }
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const acknowledgeAlert = (alertId: string) => {
    setSafetyAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    showToast('Alert Acknowledged', `Incident ${alertId} logged as reviewed by Operator.`, 'success');
  };

  const dispatchEmergencyTeam = (alertId: string, unitType: string) => {
    const timeNow = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date());

    setSafetyAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === alertId) {
          const updated: SafetyAlert = {
            ...alert,
            acknowledged: true,
            dispatchedStatus: 'dispatched',
            dispatchedUnits: [unitType, 'Sentinel Unit PAT-01'],
            dispatchedAt: timeNow,
            etaMinutes: 3,
          };
          if (selectedAlertForModal?.id === alertId) {
            setSelectedAlertForModal(updated);
          }
          return updated;
        }
        return alert;
      })
    );
    showToast(
      '🚨 Emergency Dispatched',
      `${unitType} and Rapid Response team deployed to ${alertId}. Estimated arrival: 3 mins.`,
      'critical'
    );
  };

  const rebootCamera = (cameraId: string) => {
    showToast('Camera Reboot Sent', `Sending soft power cycle signal to ${cameraId}...`, 'info');
    setTimeout(() => {
      setCameras((prev) =>
        prev.map((cam) =>
          cam.id === cameraId
            ? { ...cam, status: 'online', latencyMs: 24, incidentType: 'Normal' }
            : cam
        )
      );
      showToast('Camera Online', `${cameraId} RTSP video feed recovered and streaming.`, 'success');
    }, 2000);
  };

  const ingestRealTimeIncident = (targetCameraId?: string): SafetyAlert => {
    const targetCam = targetCameraId ? cameras.find((c) => c.id === targetCameraId) : cameras[0];
    const newIncident = realTimeStreamEngine.getNextRealIncident(targetCam);
    setSafetyAlerts((prev) => [newIncident, ...prev]);
    setTodayAccidentsCount(realTimeStreamEngine.todayAccidentsCount);

    if (newIncident.cameraId) {
      setCameras((prev) =>
        prev.map((c) =>
          c.id === newIncident.cameraId
            ? { ...c, status: 'warning', incidentType: newIncident.type }
            : c
        )
      );
    }

    showToast(
      `🚨 REAL-TIME INCIDENT INFLUX`,
      `${newIncident.type} (${newIncident.id}) flagged on ${newIncident.cameraName}!`,
      newIncident.severity === 'Critical' ? 'critical' : 'warning'
    );

    return newIncident;
  };

  const triggerSimulatedAlert = () => {
    ingestRealTimeIncident();
  };

  const createDynamicSafetyAlert = (
    camera: CameraFeed,
    interaction: KinematicInteraction,
    snapshotImage?: string
  ): SafetyAlert => {
    const alertId = `ALT-KIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeNow = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date());

    const colType: SafetyAlert['collisionType'] =
      interaction.interactionType === 'vehicle-vehicle' ? 'Vehicle-Vehicle' :
      interaction.interactionType === 'vehicle-pedestrian' ? 'Vehicle-Pedestrian' :
      'Vehicle-Animal';

    const severity: AlertSeverity =
      interaction.status === 'Critical: Active Collision' ? 'Critical' :
      interaction.status === 'Warning: Accident-Prone Near-Miss' ? 'High' : 'Medium';

    const aiExplanation = `Kinematic Radar Vision AI: Detected acute ${interaction.scenario} conflict between ${interaction.entityAType} (${interaction.entityAId}) and ${interaction.entityBType} (${interaction.entityBId}). Spatial proximity: ${interaction.proximityMeters}m, closure velocity: ${interaction.relativeVelocityKmH} km/h${interaction.timeToCollisionSec !== null ? `, Time-To-Collision: ${interaction.timeToCollisionSec}s` : ''}. Autonomous trajectory conflict alert issued.`;

    const newAlert: SafetyAlert = {
      id: alertId,
      type: 'Traffic Accident',
      severity,
      location: camera.location,
      zone: camera.zone,
      cameraId: camera.id,
      cameraName: camera.name,
      timestamp: timeNow,
      timeAgo: 'Just now',
      aiExplanation,
      confidence: Number((Math.min(99.4, interaction.riskScore + (Math.random() * 3.5))).toFixed(1)),
      acknowledged: false,
      vehiclesInvolved: [
        `${interaction.entityAType.toUpperCase()} (${interaction.entityAId})`,
        `${interaction.entityBType.toUpperCase()} (${interaction.entityBId})`
      ],
      snapshotBg: 'accident',
      imageUrl: snapshotImage || camera.imageUrl || '/incidents/accident_detection.jpg',
      videoUrl: camera.videoUrl || '/videos/cam_highway_collision.mp4',
      dispatchedStatus: 'none',
      collisionType: colType,
      timeToCollisionSec: interaction.timeToCollisionSec ?? undefined,
      proximityMeters: interaction.proximityMeters,
      relativeClosureSpeedKmH: interaction.relativeVelocityKmH,
      hazardStatus: interaction.status,
      interactingObjectIds: [interaction.entityAId, interaction.entityBId]
    };

    setSafetyAlerts((prev) => [newAlert, ...prev]);
    showToast(
      `🚨 ${interaction.status.toUpperCase()}`,
      `${colType} (${interaction.scenario}) flagged on ${camera.name}. Proximity: ${interaction.proximityMeters}m.`,
      severity === 'Critical' ? 'critical' : 'warning'
    );

    return newAlert;
  };

  const triggerSimulatedCollisionAlert = (
    collisionType: 'Vehicle-Vehicle' | 'Vehicle-Pedestrian' | 'Vehicle-Animal' = 'Vehicle-Vehicle'
  ): SafetyAlert => {
    const alert = ingestRealTimeIncident();
    alert.collisionType = collisionType;
    return alert;
  };

  return (
    <CommandCenterContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        cameras,
        safetyAlerts,
        hotspots,
        hourlyData,
        vehicleDistribution,
        zoneSpeedData,
        weeklyTrend,
        metadata: DATASET_METADATA,
        kpis,
        selectedCamera: liveSelectedCamera,
        setSelectedCamera,
        selectedAlertForModal,
        setSelectedAlertForModal,
        acknowledgeAlert,
        dispatchEmergencyTeam,
        rebootCamera,
        triggerSimulatedAlert,
        createDynamicSafetyAlert,
        triggerSimulatedCollisionAlert,
        ingestRealTimeIncident,
        searchQuery,
        setSearchQuery,
        selectedZoneFilter,
        setSelectedZoneFilter,
        soundEnabled,
        setSoundEnabled,
        emergencyBannerOpen,
        setEmergencyBannerOpen,
        toasts,
        dismissToast,
        showToast,
        isStreamingActive,
        setIsStreamingActive: handleSetIsStreamingActive,
        streamSpeed,
        setStreamSpeed,
        streamTickCount,
        todayVehiclesCount,
        todayAccidentsCount,
        activeWorkingCamerasCount,
        streamBandwidthMbps,
        generateTelemetryCsv: () => dataService.generateTelemetryCsv(),
        generateVehicleDetectionsCsv: () => dataService.generateVehicleDetectionsCsv()
      }}
    >
      {children}
    </CommandCenterContext.Provider>
  );
};

export const useCommandCenter = () => {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error('useCommandCenter must be used within a CommandCenterProvider');
  }
  return context;
};
