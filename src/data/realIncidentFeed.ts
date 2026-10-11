// Real-Time Incident & Telemetry Stream Pool
// Backed by Sentinel Confirmed Accident DB, Vehicle Tracking Overspeed database, and T-GCN Speed Intervals

import type { AlertSeverity, IncidentCategory, ZoneId } from '../types/index.ts';

export interface RealStreamIncident {
  id: string;
  type: IncidentCategory;
  severity: AlertSeverity;
  location: string;
  zone: ZoneId;
  cameraId: string;
  cameraName: string;
  aiExplanation: string;
  confidence: number;
  vehiclesInvolved: string[];
  imageUrl?: string;
  videoUrl?: string;
  collisionType?: 'Vehicle-Vehicle' | 'Vehicle-Pedestrian' | 'Vehicle-Animal';
  proximityMeters?: number;
  relativeClosureSpeedKmH?: number;
  timeToCollisionSec?: number;
}

export interface RealTemporalSpeedInterval {
  intervalIndex: number;
  timeLabel: string;
  speeds: Record<ZoneId, number>;
  congestions: Record<ZoneId, number>;
}

export const REAL_SENTINEL_CONFIRMED_INCIDENTS: RealStreamIncident[] = [
  {
    id: "INC-034D0A",
    type: "Traffic Accident",
    severity: "Critical",
    location: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub) (Highway A1 - Postmile District 7 (MP 716939))",
    zone: "Highway A1",
    cameraId: "CAM-716939",
    cameraName: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub)",
    aiExplanation: "Confirmed in Z-06: severity 72.4/100, priority HIGH. Optical video telemetry verified by AI surveillance engine. Real-time YOLOv8 Computer Vision: Collision probability 91.0%. Detected classes: CAR (CAD-512), MOTORCYCLE (MTR-301).",
    confidence: 91.0,
    vehiclesInvolved: ["CAR (CAD-512)", "MOTORCYCLE (MTR-301)"],
    imageUrl: "/incidents/accident_detection.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 1.2,
    relativeClosureSpeedKmH: 55.0,
    timeToCollisionSec: 0.35
  },
  {
    id: "INC-9B2955",
    type: "Traffic Accident",
    severity: "Critical",
    location: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub) (Highway A1 - Postmile District 7 (MP 716939))",
    zone: "Highway A1",
    cameraId: "CAM-716939",
    cameraName: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub)",
    aiExplanation: "Confirmed in Z-06: severity 75.0/100, priority HIGH. Optical tracking stabilized. Real-time YOLOv8 Computer Vision: Collision probability 90.0%. Detected classes: COMMERCIAL TRUCK (TRK-904), SEDAN (SED-228).",
    confidence: 90.0,
    vehiclesInvolved: ["COMMERCIAL TRUCK (TRK-904)", "SEDAN (SED-228)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 1.9,
    relativeClosureSpeedKmH: 63.5,
    timeToCollisionSec: 0.65
  },
  {
    id: "INC-7FFDEC",
    type: "Traffic Accident",
    severity: "High",
    location: "Bay Bridge South Anchor Optical Tower (Waterfront Bay - Causeway Piers)",
    zone: "Waterfront Bay",
    cameraId: "CAM-773656",
    cameraName: "Bay Bridge South Anchor Optical Tower",
    aiExplanation: "Confirmed in Z-10: severity 41.7/100, priority MEDIUM. Multi-entity telemetry: Truck, Motorcycle and Bus sudden headway compression on causeway.",
    confidence: 79.0,
    vehiclesInvolved: ["TRUCK (TRK-383)", "MOTORCYCLE (MTR-107)", "BUS (BUS-612)"],
    imageUrl: "/incidents/accident_detection.jpg",
    videoUrl: "/videos/cam_simulation_accident.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 2.6,
    relativeClosureSpeedKmH: 72.0,
    timeToCollisionSec: 0.95
  },
  {
    id: "INC-3A5AA0",
    type: "Traffic Accident",
    severity: "Critical",
    location: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub) (Highway A1 - Postmile District 7 (MP 716939))",
    zone: "Highway A1",
    cameraId: "CAM-716939",
    cameraName: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub)",
    aiExplanation: "Confirmed in Z-06: severity 75.0/100, priority HIGH. Violent impact detected on travel lane with opposing closure vectors.",
    confidence: 90.0,
    vehiclesInvolved: ["COMMERCIAL TRUCK (TRK-904)", "COUPE (COU-115)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 1.2,
    relativeClosureSpeedKmH: 80.5,
    timeToCollisionSec: 0.35
  },
  {
    id: "INC-506E84",
    type: "Traffic Accident",
    severity: "Critical",
    location: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub) (Highway A1 - Postmile District 7 (MP 716939))",
    zone: "Highway A1",
    cameraId: "CAM-716939",
    cameraName: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub)",
    aiExplanation: "Confirmed in Z-06: severity 75.0/100, priority HIGH. Heavy transport brake failure kinetic collision sequence.",
    confidence: 90.0,
    vehiclesInvolved: ["TANKER TRUCK (TNK-841)", "SUV (SUV-602)"],
    imageUrl: "/incidents/accident_detection.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 1.9,
    relativeClosureSpeedKmH: 55.0,
    timeToCollisionSec: 0.65
  },
  {
    id: "INC-58CF36",
    type: "Traffic Accident",
    severity: "Critical",
    location: "Interstate 5 Express Corridor (Highway A1 - MP 718280)",
    zone: "Highway A1",
    cameraId: "CAM-718280",
    cameraName: "Interstate 5 Express Corridor",
    aiExplanation: "Confirmed in Z-06: severity 75.0/100, priority HIGH. Multi-vehicle highway pileup in inner express lanes.",
    confidence: 90.0,
    vehiclesInvolved: ["HEAVY HAULER (HAU-703)", "SEDAN (SED-419)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 1.2,
    relativeClosureSpeedKmH: 72.0,
    timeToCollisionSec: 0.35
  },
  {
    id: "INC-D1F1F9",
    type: "Traffic Accident",
    severity: "High",
    location: "Container Terminal Logistics Gate Hub (Harbour District - Terminal Way Gate 4)",
    zone: "Harbour District",
    cameraId: "CAM-717940",
    cameraName: "Container Terminal Logistics Gate Hub",
    aiExplanation: "Confirmed in Z-07: severity 41.2/100, priority MEDIUM. Terminal junction T-bone collision involving heavy container truck and logistics motorcycle.",
    confidence: 80.6,
    vehiclesInvolved: ["CONTAINER TRUCK (TRK-122)", "MOTORCYCLE (MTR-417)", "LOGISTICS VAN (VAN-345)"],
    imageUrl: "/incidents/accident_detection.jpg",
    videoUrl: "/videos/cam_simulation_accident.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 1.9,
    relativeClosureSpeedKmH: 80.5,
    timeToCollisionSec: 0.65
  },
  {
    id: "INC-EEAC4A",
    type: "Traffic Accident",
    severity: "High",
    location: "Grand Central Multi-Lane Optical Hub (Downtown Core - Fwy 10 Interchange)",
    zone: "Downtown Core",
    cameraId: "CAM-717435",
    cameraName: "Grand Central Multi-Lane Optical Hub",
    aiExplanation: "Confirmed in Z-02: severity 47.0/100, priority MEDIUM. Multi-entity intersection conflict: Commercial truck, 2 motorcycles and municipal bus collision hazard.",
    confidence: 84.8,
    vehiclesInvolved: ["COMMERCIAL TRUCK (TRK-513)", "MOTORCYCLE (MTR-188)", "TRANSIT BUS (BUS-435)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 2.6,
    relativeClosureSpeedKmH: 55.0,
    timeToCollisionSec: 0.95
  },
  {
    id: "INC-B701A8",
    type: "Traffic Accident",
    severity: "High",
    location: "Harbour District Arterial Pier 9 (Harbour District - Terminal Way)",
    zone: "Harbour District",
    cameraId: "CAM-760100",
    cameraName: "Harbour District Arterial Pier 9",
    aiExplanation: "Confirmed in Z-07: severity 46.6/100, priority MEDIUM. Multi-entity kinetic collision sequence flagged by Sentinel AI. Optical confidence 91.2%.",
    confidence: 91.2,
    vehiclesInvolved: ["COMMERCIAL TRUCK (TRK-208)", "MOTORCYCLE (MTR-156)", "AUTORICKSHAW (AUT-083)"],
    imageUrl: "/incidents/accident_detection.jpg",
    videoUrl: "/videos/cam_simulation_accident.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 1.2,
    relativeClosureSpeedKmH: 63.5,
    timeToCollisionSec: 0.35
  },
  {
    id: "INC-F4C60A",
    type: "Pedestrian in Restricted Area",
    severity: "High",
    location: "Harbour District Arterial Pier 9 (Harbour District - Terminal Way)",
    zone: "Harbour District",
    cameraId: "CAM-760100",
    cameraName: "Harbour District Arterial Pier 9",
    aiExplanation: "Confirmed in Z-07: severity 43.5/100, priority MEDIUM. Pedestrian conflict with approaching motorcycle and delivery truck outside designated walkway.",
    confidence: 91.7,
    vehiclesInvolved: ["DELIVERY TRUCK (TRK-344)", "MOTORCYCLE (MTR-269)", "PEDESTRIAN (PED-290)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Pedestrian",
    proximityMeters: 1.9,
    relativeClosureSpeedKmH: 72.0,
    timeToCollisionSec: 0.65
  },
  {
    id: "INC-A6C191",
    type: "Traffic Accident",
    severity: "High",
    location: "Grand Central Multi-Lane Optical Hub (Downtown Core - Fwy 10 Interchange)",
    zone: "Downtown Core",
    cameraId: "CAM-717435",
    cameraName: "Grand Central Multi-Lane Optical Hub",
    aiExplanation: "Confirmed in Z-02: severity 45.5/100, priority MEDIUM. Transit corridor crash sequence involving municipal bus and 3 passenger vehicles.",
    confidence: 82.0,
    vehiclesInvolved: ["COMMERCIAL TRUCK (TRK-191)", "TRANSIT BUS (BUS-160)", "MOTORCYCLE (MTR-165)"],
    imageUrl: "/incidents/accident_detection.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4",
    collisionType: "Vehicle-Vehicle",
    proximityMeters: 2.6,
    relativeClosureSpeedKmH: 80.5,
    timeToCollisionSec: 0.95
  },
  {
    id: "INC-8EE2CB",
    type: "Traffic Accident",
    severity: "High",
    location: "Innovation Blvd Smart Mobility Node (Tech Corridor - Fwy 60 Westbound)",
    zone: "Tech Corridor",
    cameraId: "CAM-759418",
    cameraName: "Innovation Blvd Smart Mobility Node",
    aiExplanation: "Confirmed in Z-03: severity 42.7/100, priority MEDIUM. Pedestrian crosswalk conflict with delivery truck in tech corridor intersection.",
    confidence: 72.7,
    vehiclesInvolved: ["DELIVERY TRUCK (TRK-299)", "SEDAN (SED-322)", "PEDESTRIAN (PED-358)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_simulation_accident.mp4",
    collisionType: "Vehicle-Pedestrian",
    proximityMeters: 1.2,
    relativeClosureSpeedKmH: 55.0,
    timeToCollisionSec: 0.35
  }
];

export const REAL_OVERSPEED_INCIDENTS: RealStreamIncident[] = [
  {
    id: "OVR-8401",
    type: "Overspeeding",
    severity: "Critical",
    location: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub) (Highway A1 - Postmile District 7 (MP 716939))",
    zone: "Highway A1",
    cameraId: "CAM-716939",
    cameraName: "Caltrans Fwy 5 Southbound Node (Autonomous 4K AI Hub)",
    aiExplanation: "YOLOv8 Speed Estimator & ByteTrack: Commercial Vehicle detected travelling at 133.8 km/h on 65 km/h posted freeway section.",
    confidence: 99.4,
    vehiclesInvolved: ["SEDAN (TRK-ID-03)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_downtown_cmc.mp4"
  },
  {
    id: "OVR-8402",
    type: "Overspeeding",
    severity: "Critical",
    location: "Innovation Blvd Smart Mobility Node (Tech Corridor - Fwy 60 Westbound)",
    zone: "Tech Corridor",
    cameraId: "CAM-759418",
    cameraName: "Innovation Blvd Smart Mobility Node",
    aiExplanation: "ByteTrack Optical Flow: Vehicle velocity clocked at 130.7 km/h with acute tailgating headway (distance 5.8m).",
    confidence: 98.7,
    vehiclesInvolved: ["CAR (TRK-ID-02)"],
    imageUrl: "/incidents/accident_detection.jpg",
    videoUrl: "/videos/cam_traffic_zone.mp4"
  },
  {
    id: "OVR-8403",
    type: "Overspeeding",
    severity: "High",
    location: "Northern Arterial Express Node (North Sector - Fwy 91 Express)",
    zone: "North Sector",
    cameraId: "CAM-764050",
    cameraName: "Northern Arterial Express Node",
    aiExplanation: "YOLOv8 Speed Radar: Commercial transport clocked at 89.4 km/h in restricted construction zone (limit 50 km/h).",
    confidence: 97.2,
    vehiclesInvolved: ["TRUCK (TRK-ID-01)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_highway_collision.mp4"
  },
  {
    id: "OVR-8404",
    type: "Wrong-Way Vehicle",
    severity: "Critical",
    location: "Interstate 5 Express Corridor (Highway A1 - MP 718280)",
    zone: "Highway A1",
    cameraId: "CAM-718280",
    cameraName: "Interstate 5 Express Corridor",
    aiExplanation: "Optical Flow Vector Inversion: Vehicle travelling southbound in designated northbound lane at 78.4 km/h.",
    confidence: 99.1,
    vehiclesInvolved: ["COUPE (CA-104-XX)"],
    imageUrl: "/incidents/testing1.jpg",
    videoUrl: "/videos/cam_traffic_zone.mp4"
  }
];

export const REAL_TGCN_TEMPORAL_INTERVALS: RealTemporalSpeedInterval[] = [
  {
    intervalIndex: 1,
    timeLabel: "00:00",
    speeds: { "Highway A1": 62.4, "Downtown Core": 48.2, "Tech Corridor": 58.1, "North Sector": 55.4, "Waterfront Bay": 59.2, "Harbour District": 44.8 },
    congestions: { "Highway A1": 18, "Downtown Core": 28, "Tech Corridor": 20, "North Sector": 22, "Waterfront Bay": 19, "Harbour District": 35 }
  },
  {
    intervalIndex: 16,
    timeLabel: "04:00",
    speeds: { "Highway A1": 64.8, "Downtown Core": 52.0, "Tech Corridor": 61.3, "North Sector": 58.9, "Waterfront Bay": 62.5, "Harbour District": 48.1 },
    congestions: { "Highway A1": 14, "Downtown Core": 22, "Tech Corridor": 16, "North Sector": 18, "Waterfront Bay": 15, "Harbour District": 28 }
  },
  {
    intervalIndex: 32,
    timeLabel: "08:00",
    speeds: { "Highway A1": 42.1, "Downtown Core": 24.5, "Tech Corridor": 36.8, "North Sector": 34.2, "Waterfront Bay": 41.0, "Harbour District": 28.4 },
    congestions: { "Highway A1": 74, "Downtown Core": 88, "Tech Corridor": 68, "North Sector": 72, "Waterfront Bay": 64, "Harbour District": 82 }
  },
  {
    intervalIndex: 48,
    timeLabel: "12:00",
    speeds: { "Highway A1": 48.5, "Downtown Core": 32.1, "Tech Corridor": 44.2, "North Sector": 42.0, "Waterfront Bay": 46.8, "Harbour District": 34.2 },
    congestions: { "Highway A1": 58, "Downtown Core": 72, "Tech Corridor": 54, "North Sector": 58, "Waterfront Bay": 52, "Harbour District": 70 }
  },
  {
    intervalIndex: 68,
    timeLabel: "17:00",
    speeds: { "Highway A1": 36.2, "Downtown Core": 21.0, "Tech Corridor": 31.5, "North Sector": 29.8, "Waterfront Bay": 35.4, "Harbour District": 24.1 },
    congestions: { "Highway A1": 84, "Downtown Core": 94, "Tech Corridor": 78, "North Sector": 81, "Waterfront Bay": 74, "Harbour District": 89 }
  },
  {
    intervalIndex: 84,
    timeLabel: "21:00",
    speeds: { "Highway A1": 56.4, "Downtown Core": 42.1, "Tech Corridor": 52.8, "North Sector": 50.1, "Waterfront Bay": 54.2, "Harbour District": 39.5 },
    congestions: { "Highway A1": 28, "Downtown Core": 42, "Tech Corridor": 32, "North Sector": 36, "Waterfront Bay": 30, "Harbour District": 48 }
  }
];
