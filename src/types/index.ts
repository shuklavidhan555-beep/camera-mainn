export type ZoneId = 'Downtown Core' | 'North Sector' | 'Waterfront Bay' | 'Highway A1' | 'Tech Corridor' | 'Harbour District';

export type CameraStatus = 'online' | 'warning' | 'offline';

export type IncidentCategory = 
  | 'Traffic Accident' 
  | 'Wrong-Way Vehicle' 
  | 'Overspeeding' 
  | 'Pedestrian in Restricted Area' 
  | 'Illegal Parking'
  | 'Traffic Congestion';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface DetectedObject {
  id: string;
  type: 'car' | 'bus' | 'truck' | 'pedestrian' | 'bicycle' | 'motorcycle' | 'animal';
  confidence: number;
  box: { x: number; y: number; w: number; h: number }; // percentages 0-100
  speed?: number; // km/h
  acceleration?: number; // m/s^2
  trajectoryAngle?: number; // degrees 0-360
  licensePlate?: string;
  isViolation?: boolean;
  collisionRisk?: {
    targetId: string;
    interactionType: 'vehicle-vehicle' | 'vehicle-pedestrian' | 'vehicle-animal';
    scenario: string;
    status: 'Critical: Active Collision' | 'Warning: Accident-Prone Near-Miss' | 'Caution: Hazard Ahead';
    ttc: number | null;
    distanceMeters: number;
    relativeSpeed: number;
  };
}

export interface KinematicInteraction {
  id: string;
  entityAId: string;
  entityBId: string;
  entityAType: DetectedObject['type'];
  entityBType: DetectedObject['type'];
  interactionType: 'vehicle-vehicle' | 'vehicle-pedestrian' | 'vehicle-animal';
  scenario: 'Head-On' | 'Rear-End' | 'T-Bone' | 'Sudden Braking' | 'Jaywalking' | 'Roadway Intrusion' | 'Unsafe Headway' | 'Trajectory Conflict' | 'Sudden Swerving';
  status: 'Critical: Active Collision' | 'Warning: Accident-Prone Near-Miss' | 'Caution: Hazard Ahead';
  timeToCollisionSec: number | null;
  proximityMeters: number;
  relativeVelocityKmH: number;
  riskScore: number;
  pointA: { x: number; y: number };
  pointB: { x: number; y: number };
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  zone: ZoneId;
  status: CameraStatus;
  resolution: '4K UltraHD' | '1080p FHD';
  fps: number;
  ip: string;
  vehicleCount: number;
  pedestrianCount: number;
  congestionScore: number; // 0-100
  incidentType: IncidentCategory | 'Normal';
  latencyMs: number;
  activeAiModels: string[];
  objects: DetectedObject[];
  coordinates: { x: number; y: number }; // Map coordinates (0-100%)
  videoTheme: 'highway' | 'intersection' | 'bridge' | 'crosswalk' | 'tunnel' | 'roundabout';
  recentEvents: { time: string; text: string; severity: AlertSeverity }[];
  imageUrl?: string;
  videoUrl?: string;
  activeHazards?: KinematicInteraction[];
}

export interface SafetyAlert {
  id: string;
  type: IncidentCategory;
  severity: AlertSeverity;
  location: string;
  zone: ZoneId;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  timeAgo: string;
  aiExplanation: string;
  confidence: number;
  acknowledged: boolean;
  vehiclesInvolved: string[];
  snapshotBg: string;
  imageUrl?: string;
  videoUrl?: string;
  dispatchedStatus?: 'none' | 'dispatching' | 'dispatched';
  dispatchedUnits?: string[];
  dispatchedAt?: string;
  etaMinutes?: number;
  collisionType?: 'Vehicle-Vehicle' | 'Vehicle-Pedestrian' | 'Vehicle-Animal';
  timeToCollisionSec?: number;
  proximityMeters?: number;
  relativeClosureSpeedKmH?: number;
  hazardStatus?: 'Critical: Active Collision' | 'Warning: Accident-Prone Near-Miss' | 'Caution: Hazard Ahead';
  interactingObjectIds?: string[];
}

export interface TrafficHotspot {
  id: string;
  location: string;
  zone: ZoneId;
  congestionStatus: 'Critical' | 'High' | 'Moderate' | 'Normal';
  congestionScore: number; // 0 - 100
  averageSpeed: number; // km/h
  cameraId: string;
  cameraName: string;
  lastUpdated: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  historicalVolume: number[];
}

export interface HourlyTrafficData {
  hour: string;
  volume: number;
  baseline: number;
  averageSpeed: number;
}

export interface ZoneSpeedData {
  zone: ZoneId;
  avgSpeed: number;
  congestionScore: number;
  vehicleCount: number;
}

export interface VehicleDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface WeeklyTrendPoint {
  day: string;
  peakCongestion: number;
  avgCongestion: number;
  incidents: number;
}

export type ThemeMode = 'dark' | 'monochrome' | 'light';
export type NavigationTab = 'overview' | 'surveillance' | 'traffic' | 'alerts' | 'cameras' | 'reports' | 'settings';
