import fs from 'fs';
import path from 'path';

const jsonPath = 'd:/system/public/data/integrated_dataset.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const tsContent = `// Real Integrated Dataset
// Sources:
// 1. Caltrans PeMS D7 Sensor Network (California Department of Transportation) - 228 sensor stations
// 2. T-GCN Shenzhen Urban Traffic Speed Matrix - 2,976 intervals across 156 sensor links
// 3. AI-Powered Vehicle Tracking (YOLOv8 + ByteTrack) - 23,801 vehicle detections
// 4. Minipro Urban Vehicle Bounding Box Dataset - 75 Pascal VOC XML annotations
// 5. Accident Detection & Sentinel Dispatch Engine

import type { 
  CameraFeed, 
  SafetyAlert, 
  TrafficHotspot, 
  HourlyTrafficData, 
  ZoneSpeedData, 
  VehicleDistribution,
  WeeklyTrendPoint 
} from '../types/index.ts';

export interface DatasetMetadata {
  generatedAt: string;
  totalDetectionsAggregated: number;
  totalPemsStations: number;
  totalTgcnIntervals: number;
  totalTgcnLinks: number;
  totalMiniproXmls: number;
  networkAvgSpeed: number;
}

export const DATASET_METADATA: DatasetMetadata = ${JSON.stringify(data.metadata, null, 2)};

export const REAL_CAMERAS: CameraFeed[] = ${JSON.stringify(data.cameras, null, 2)};

export const REAL_SAFETY_ALERTS: SafetyAlert[] = ${JSON.stringify(data.safetyAlerts, null, 2)};

export const REAL_CONGESTION_HOTSPOTS: TrafficHotspot[] = ${JSON.stringify(data.hotspots, null, 2)};

export const REAL_HOURLY_TRAFFIC_DATA: HourlyTrafficData[] = ${JSON.stringify(data.hourlyTrafficData, null, 2)};

export const REAL_VEHICLE_DISTRIBUTION: VehicleDistribution[] = ${JSON.stringify(data.vehicleDistribution, null, 2)};

export const REAL_ZONE_SPEED_DATA: ZoneSpeedData[] = ${JSON.stringify(data.zoneSpeedData, null, 2)};

export const REAL_WEEKLY_CONGESTION_TREND: WeeklyTrendPoint[] = ${JSON.stringify(data.weeklyCongestionTrend, null, 2)};

export const REAL_TOTAL_VEHICLES_TODAY: number = ${data.totalVehiclesToday};

export const REAL_CITY_SECTORS = [
  { id: 'sec-downtown', name: 'Downtown Core', status: 'critical', congestion: 82, activeIncidents: 1, cameras: 12 },
  { id: 'sec-highway', name: 'Highway A1', status: 'warning', congestion: 65, activeIncidents: 1, cameras: 14 },
  { id: 'sec-tech', name: 'Tech Corridor', status: 'normal', congestion: 42, activeIncidents: 1, cameras: 8 },
  { id: 'sec-north', name: 'North Sector', status: 'warning', congestion: 68, activeIncidents: 0, cameras: 8 },
  { id: 'sec-waterfront', name: 'Waterfront Bay', status: 'normal', congestion: 46, activeIncidents: 0, cameras: 6 },
  { id: 'sec-harbour', name: 'Harbour District', status: 'warning', congestion: 72, activeIncidents: 1, cameras: 4 },
];
`;

fs.writeFileSync('d:/system/src/data/realDataset.ts', tsContent, 'utf8');
console.log('Successfully generated src/data/realDataset.ts!');
