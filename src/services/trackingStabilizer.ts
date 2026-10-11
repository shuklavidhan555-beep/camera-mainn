import type { DetectedObject, KinematicInteraction } from '../types/index.ts';

export interface PhysicalClassConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minAspectRatio: number; // w / h
  maxAspectRatio: number;
  maxRealisticSpeed: number; // km/h
}

export const PHYSICAL_CONSTRAINTS: Record<DetectedObject['type'], PhysicalClassConstraints> = {
  car: {
    minWidth: 8,
    maxWidth: 34,
    minHeight: 8,
    maxHeight: 28,
    minAspectRatio: 0.85,
    maxAspectRatio: 2.6,
    maxRealisticSpeed: 160
  },
  bus: {
    minWidth: 12,
    maxWidth: 42,
    minHeight: 10,
    maxHeight: 36,
    minAspectRatio: 1.1,
    maxAspectRatio: 3.8,
    maxRealisticSpeed: 100
  },
  truck: {
    minWidth: 12,
    maxWidth: 45,
    minHeight: 12,
    maxHeight: 38,
    minAspectRatio: 1.0,
    maxAspectRatio: 3.5,
    maxRealisticSpeed: 110
  },
  motorcycle: {
    minWidth: 3,
    maxWidth: 16,
    minHeight: 5,
    maxHeight: 20,
    minAspectRatio: 0.45,
    maxAspectRatio: 1.4,
    maxRealisticSpeed: 150
  },
  bicycle: {
    minWidth: 3,
    maxWidth: 14,
    minHeight: 5,
    maxHeight: 18,
    minAspectRatio: 0.4,
    maxAspectRatio: 1.2,
    maxRealisticSpeed: 50
  },
  pedestrian: {
    minWidth: 2.5,
    maxWidth: 12,
    minHeight: 6,
    maxHeight: 24,
    minAspectRatio: 0.25,
    maxAspectRatio: 0.8,
    maxRealisticSpeed: 15
  },
  animal: {
    minWidth: 4,
    maxWidth: 22,
    minHeight: 4,
    maxHeight: 22,
    minAspectRatio: 0.5,
    maxAspectRatio: 2.0,
    maxRealisticSpeed: 55
  }
};

interface TrackHistory {
  lastSeenTime: number;
  hits: number;
  smoothBox: { x: number; y: number; w: number; h: number };
  smoothSpeed: number;
  velocityVector: { vx: number; vy: number };
}

function normalizeBox(raw: any): { x: number; y: number; w: number; h: number } {
  if (raw.box && typeof raw.box.x === 'number') {
    return {
      x: raw.box.x,
      y: raw.box.y,
      w: raw.box.w,
      h: raw.box.h
    };
  }
  if (Array.isArray(raw.bbox) && raw.bbox.length >= 4) {
    return {
      x: raw.bbox[0],
      y: raw.bbox[1],
      w: raw.bbox[2],
      h: raw.bbox[3]
    };
  }
  if (Array.isArray(raw.box) && raw.box.length >= 4) {
    return {
      x: raw.box[0],
      y: raw.box[1],
      w: raw.box[2],
      h: raw.box[3]
    };
  }
  return { x: 0, y: 0, w: 10, h: 10 };
}

export class TrackingStabilizerService {
  private static instance: TrackingStabilizerService;
  private trackStore: Map<string, TrackHistory> = new Map();
  private readonly alpha = 0.65; // EMA smoothing factor (0 = infinite inertia, 1 = raw jitter)
  private readonly minConfidenceThreshold = 72; // Discard transient noisy detections

  public static getInstance(): TrackingStabilizerService {
    if (!TrackingStabilizerService.instance) {
      TrackingStabilizerService.instance = new TrackingStabilizerService();
    }
    return TrackingStabilizerService.instance;
  }

  /**
   * Refine and track-stabilize raw bounding boxes to eliminate random flickering,
   * phantom boxes, and coordinate jitter. Enforces physical aspect ratios and realistic bounds.
   */
  public stabilizeDetections(
    feedId: string,
    rawObjects: DetectedObject[]
  ): DetectedObject[] {
    const now = Date.now();
    const stabilized: DetectedObject[] = [];

    for (const raw of rawObjects) {
      // 1. Filter out low-confidence random noise
      if (raw.confidence < this.minConfidenceThreshold) {
        continue;
      }

      const constraints = PHYSICAL_CONSTRAINTS[raw.type] || PHYSICAL_CONSTRAINTS.car;
      const rawBox = normalizeBox(raw);

      // 2. Validate and clamp physical dimensions
      let clampedW = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, rawBox.w));
      let clampedH = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, rawBox.h));

      // Enforce physical aspect ratio (w / h)
      const currentAspect = clampedW / (clampedH || 1);
      if (currentAspect < constraints.minAspectRatio) {
        clampedW = clampedH * constraints.minAspectRatio;
      } else if (currentAspect > constraints.maxAspectRatio) {
        clampedH = clampedW / constraints.maxAspectRatio;
      }

      // Re-clamp bounds to frame boundaries (0-100%)
      const clampedX = Math.max(0, Math.min(100 - clampedW, rawBox.x));
      const clampedY = Math.max(0, Math.min(100 - clampedH, rawBox.y));

      // 3. Temporal smoothing via Exponential Moving Average (EMA)
      const trackKey = `${feedId}_${raw.id}`;
      const prevTrack = this.trackStore.get(trackKey);

      let smoothX = clampedX;
      let smoothY = clampedY;
      let smoothW = clampedW;
      let smoothH = clampedH;
      let smoothSpeed = Math.min(constraints.maxRealisticSpeed, Math.max(0, raw.speed ?? 0));
      let hits = 1;

      if (prevTrack && (now - prevTrack.lastSeenTime) < 1800) {
        hits = prevTrack.hits + 1;
        // EMA filter on bounding box
        smoothX = this.alpha * clampedX + (1 - this.alpha) * prevTrack.smoothBox.x;
        smoothY = this.alpha * clampedY + (1 - this.alpha) * prevTrack.smoothBox.y;
        smoothW = this.alpha * clampedW + (1 - this.alpha) * prevTrack.smoothBox.w;
        smoothH = this.alpha * clampedH + (1 - this.alpha) * prevTrack.smoothBox.h;
        smoothSpeed = this.alpha * smoothSpeed + (1 - this.alpha) * prevTrack.smoothSpeed;
      }

      const updatedTrack: TrackHistory = {
        lastSeenTime: now,
        hits,
        smoothBox: {
          x: Number(smoothX.toFixed(2)),
          y: Number(smoothY.toFixed(2)),
          w: Number(smoothW.toFixed(2)),
          h: Number(smoothH.toFixed(2))
        },
        smoothSpeed: Number(smoothSpeed.toFixed(1)),
        velocityVector: {
          vx: prevTrack ? (smoothX - prevTrack.smoothBox.x) : 0,
          vy: prevTrack ? (smoothY - prevTrack.smoothBox.y) : 0
        }
      };
      this.trackStore.set(trackKey, updatedTrack);

      stabilized.push({
        ...raw,
        box: updatedTrack.smoothBox,
        speed: updatedTrack.smoothSpeed,
        confidence: Number(raw.confidence.toFixed(1))
      });
    }

    return stabilized;
  }

  /**
   * Multi-Entity Kinematic Interaction Engine:
   * Analyzes pairwise interactions between vehicles, pedestrians, and animals.
   * Computes real-time Time-To-Collision (TTC), Spatial Proximity (meters),
   * and Relative Closure Velocity.
   */
  public analyzeMultiEntityInteractions(objects: DetectedObject[]): KinematicInteraction[] {
    const interactions: KinematicInteraction[] = [];
    if (!objects || objects.length < 2) return interactions;

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const objA = objects[i];
        const objB = objects[j];

        const interaction = this.assessPairKinematics(objA, objB);
        if (interaction) {
          interactions.push(interaction);

          // Attach hazard annotation to entities
          const hazardMeta = {
            targetId: objB.id,
            interactionType: interaction.interactionType,
            scenario: interaction.scenario,
            status: interaction.status,
            ttc: interaction.timeToCollisionSec,
            distanceMeters: interaction.proximityMeters,
            relativeSpeed: interaction.relativeVelocityKmH
          };

          objA.collisionRisk = hazardMeta;
          objB.collisionRisk = {
            ...hazardMeta,
            targetId: objA.id
          };

          if (interaction.status === 'Critical: Active Collision') {
            objA.isViolation = true;
            objB.isViolation = true;
          }
        }
      }
    }

    return interactions;
  }

  /**
   * Kinematic evaluation between two specific detected objects.
   * Analyzes pairwise interactions between vehicles, pedestrians, and animals in real time.
   * Symmetrically extracts entity roles, evaluates trajectory angles and closure velocity,
   * and calculates real-time Time-To-Collision (TTC) and spatial proximity.
   */
  public assessPairKinematics(
    objA: DetectedObject, 
    objB: DetectedObject
  ): KinematicInteraction | null {
    const isVehA = ['car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(objA.type);
    const isVehB = ['car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(objB.type);
    const isPedA = objA.type === 'pedestrian';
    const isPedB = objB.type === 'pedestrian';
    const isAnimA = objA.type === 'animal';
    const isAnimB = objB.type === 'animal';

    // Determine interaction category
    let interactionType: KinematicInteraction['interactionType'] = 'vehicle-vehicle';
    if ((isVehA && isPedB) || (isPedA && isVehB)) {
      interactionType = 'vehicle-pedestrian';
    } else if ((isVehA && isAnimB) || (isAnimA && isVehB)) {
      interactionType = 'vehicle-animal';
    } else if (isVehA && isVehB) {
      interactionType = 'vehicle-vehicle';
    } else {
      // Pedestrian-pedestrian or animal-animal interactions are non-traffic hazards
      return null;
    }

    const boxA = normalizeBox(objA);
    const boxB = normalizeBox(objB);

    // Centers in percentage coordinates (0-100)
    const centerAX = boxA.x + boxA.w / 2;
    const centerAY = boxA.y + boxA.h / 2;
    const centerBX = boxB.x + boxB.w / 2;
    const centerBY = boxB.y + boxB.h / 2;

    const dx = centerBX - centerAX;
    const dy = centerBY - centerAY;
    const distancePercent = Math.sqrt(dx * dx + dy * dy);

    // Spatial conversion: 1% frame space ~ 0.50 meters on typical 4K surveillance lens (50m FOV)
    const proximityMeters = Math.max(0.3, Number((distancePercent * 0.5).toFixed(1)));

    // Bounding box overlap / touch check
    const boxesOverlap = (
      boxA.x < boxB.x + boxB.w &&
      boxA.x + boxA.w > boxB.x &&
      boxA.y < boxB.y + boxB.h &&
      boxA.y + boxA.h > boxB.y
    );

    // Distant non-conflicting entities (>= 20 meters away and not overlapping) produce no interaction hazard
    if (proximityMeters >= 20.0 && !boxesOverlap) {
      return null;
    }

    // Accelerations
    const accelA = objA.acceleration ?? 0;
    const accelB = objB.acceleration ?? 0;

    // Relative closure velocity calculation & Scenario identification
    let relativeSpeed = 0;
    let scenario: KinematicInteraction['scenario'] = 'Unsafe Headway';

    if (interactionType === 'vehicle-vehicle') {
      const speedA = objA.speed ?? 40;
      const speedB = objB.speed ?? 35;

      const hasAngles = typeof objA.trajectoryAngle === 'number' && typeof objB.trajectoryAngle === 'number';
      let angleDiff = 0;
      if (hasAngles) {
        angleDiff = Math.abs((objA.trajectoryAngle! - objB.trajectoryAngle!) % 360);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
      }

      const isVerticalAlignment = Math.abs(dx) < Math.max(boxA.w, boxB.w) * 1.5;

      if (hasAngles && angleDiff > 135) {
        // Opposing trajectory vectors -> Head-On Collision
        scenario = 'Head-On';
        relativeSpeed = speedA + speedB;
      } else if (accelA < -4.0 || accelB < -4.0) {
        scenario = 'Sudden Braking';
        relativeSpeed = Math.abs(speedA - speedB) + 15;
      } else if ((hasAngles && angleDiff >= 45 && angleDiff <= 135) || (Math.abs(dx) > 8 && Math.abs(dy) > 8 && Math.abs(dx) < 25 && Math.abs(dy) < 25)) {
        scenario = 'T-Bone';
        relativeSpeed = Math.sqrt(speedA * speedA + speedB * speedB) * 0.75;
      } else if (isVerticalAlignment || (hasAngles && angleDiff < 45)) {
        // Same corridor / direction -> Rear-End or Unsafe Headway
        scenario = 'Rear-End';
        relativeSpeed = Math.abs(speedA - speedB);
        if (relativeSpeed < 10 && proximityMeters < 10) {
          scenario = 'Unsafe Headway';
          relativeSpeed = Math.max(relativeSpeed, 20);
        }
      } else {
        scenario = 'Unsafe Headway';
        relativeSpeed = Math.abs(speedA - speedB);
      }
    } else if (interactionType === 'vehicle-pedestrian') {
      // Symmetrically identify vehicle and pedestrian regardless of entity argument order
      const veh = isVehA ? objA : objB;
      const ped = isPedA ? objA : objB;
      const pedBox = isPedA ? boxA : boxB;
      const vehSpeed = veh.speed ?? 40;
      const pedSpeed = ped.speed ?? 4;
      const pedCenterY = pedBox.y + pedBox.h / 2;

      if (proximityMeters < 8.0 && vehSpeed > 20) {
        scenario = 'Trajectory Conflict';
        relativeSpeed = vehSpeed + pedSpeed;
      } else if (pedCenterY > 25 && pedCenterY < 75) {
        scenario = 'Jaywalking';
        relativeSpeed = vehSpeed;
      } else {
        scenario = 'Sudden Braking';
        relativeSpeed = vehSpeed * 0.8;
      }
    } else if (interactionType === 'vehicle-animal') {
      // Symmetrically identify vehicle and animal regardless of entity argument order
      const veh = isVehA ? objA : objB;
      const anim = isAnimA ? objA : objB;
      const vehSpeed = veh.speed ?? 40;
      const animSpeed = anim.speed ?? 12;

      if (proximityMeters < 12.0) {
        scenario = 'Roadway Intrusion';
        relativeSpeed = vehSpeed + (animSpeed * 0.5);
      } else {
        scenario = 'Sudden Swerving';
        relativeSpeed = vehSpeed;
      }
    }

    // Time-To-Collision (TTC) in seconds: TTC = distanceMeters / (relativeSpeed in m/s)
    const relSpeedMs = (relativeSpeed * 1000) / 3600;
    let ttcSec: number | null = null;
    if (relSpeedMs > 0.5) {
      ttcSec = Number((proximityMeters / relSpeedMs).toFixed(2));
    }

    // Hazard Status Categorization
    const isViolentDecel = accelA < -6.0 || accelB < -6.0;
    let status: KinematicInteraction['status'] = 'Caution: Hazard Ahead';
    let riskScore = 30;

    if (boxesOverlap || proximityMeters <= 3.2 || isViolentDecel || (ttcSec !== null && ttcSec < 0.6)) {
      status = 'Critical: Active Collision';
      riskScore = 95;
    } else if ((ttcSec !== null && ttcSec < 1.5) || (proximityMeters < 9.0 && relativeSpeed > 25)) {
      status = 'Warning: Accident-Prone Near-Miss';
      riskScore = 78;
    } else if (proximityMeters < 18.0) {
      status = 'Caution: Hazard Ahead';
      riskScore = interactionType === 'vehicle-animal' ? 72 : 52;
    } else {
      // Safe distance without significant risk
      return null;
    }

    return {
      id: `HAZ-${objA.id}-${objB.id}`,
      entityAId: objA.id,
      entityBId: objB.id,
      entityAType: objA.type,
      entityBType: objB.type,
      interactionType,
      scenario,
      status,
      timeToCollisionSec: ttcSec,
      proximityMeters,
      relativeVelocityKmH: Number(relativeSpeed.toFixed(1)),
      riskScore,
      pointA: { x: Number(centerAX.toFixed(1)), y: Number(centerAY.toFixed(1)) },
      pointB: { x: Number(centerBX.toFixed(1)), y: Number(centerBY.toFixed(1)) }
    };
  }
}

export const trackingStabilizer = TrackingStabilizerService.getInstance();
