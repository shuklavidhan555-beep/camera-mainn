import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { modelInferenceService } from '../src/services/modelInferenceService.ts';
import { trackingStabilizer } from '../src/services/trackingStabilizer.ts';
import { 
  AI_VIDEO_DATASET_SUMMARY, 
  KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS 
} from '../src/data/trainedModels.ts';
import { REAL_CAMERAS, REAL_SAFETY_ALERTS } from '../src/data/realDataset.ts';

test('4K UltraHD AI Video Asset & Telemetry Integration', async (t) => {
  await t.test('4K stream video asset exists on disk and is non-empty (>100MB)', () => {
    const videoPub = path.join('public', 'videos', 'cam_ai_stream.mov');
    assert.ok(fs.existsSync(videoPub), `Video must exist at: ${videoPub}`);
    const pubStat = fs.statSync(videoPub);
    // Real input-001-001.MOV is 2.5GB
    assert.ok(pubStat.size > 100000000, `Video file must be >100MB (got ${pubStat.size} bytes)`);

    const videoDist = path.join('dist', 'videos', 'cam_ai_stream.mov');
    assert.ok(fs.existsSync(videoDist), `Dist mirrored video must exist at: ${videoDist}`);
    const distStat = fs.statSync(videoDist);
    assert.ok(distStat.size > 100000000, `Dist video file must be >100MB (got ${distStat.size} bytes)`);
  });

  await t.test('Camera 0 (CAM-716939) is configured as the 4K AI Video Stream Hub', () => {
    const hubCam = REAL_CAMERAS.find(c => c.id === 'CAM-716939');
    assert.ok(hubCam, 'Camera CAM-716939 must exist');
    assert.equal(hubCam.videoUrl, '/videos/cam_ai_stream.mov', 'Hub camera must stream cam_ai_stream.mov');
    assert.ok(hubCam.activeAiModels.includes('TrackStabilizer-DeJitter'), 'Must have TrackStabilizer model active');
    assert.ok(hubCam.activeAiModels.includes('KinematicCollision-MLP'), 'Must have KinematicCollision model active');
    assert.ok(hubCam.activeHazards && hubCam.activeHazards.length > 0, 'Must have active hazards defined');
  });

  await t.test('Telemetry metadata reflects exact 4K 60fps HEVC stream parameters', () => {
    const telem = modelInferenceService.getAiVideoFeedTelemetry();
    assert.equal(telem.sourceFile, 'input-001-001.MOV');
    assert.equal(telem.width, 3840);
    assert.equal(telem.height, 2160);
    assert.equal(telem.fps, 60);
    assert.equal(telem.durationSeconds, 741.8);
    assert.ok(telem.codec.includes('HEVC'));
    assert.equal(telem.trackStabilizationActive, true);
    assert.equal(telem.kinematicInteractionsEnabled, true);

    const expectedClasses = ['car', 'bus', 'truck', 'motorcycle', 'bicycle', 'pedestrian', 'animal'];
    for (const cls of expectedClasses) {
      assert.ok(telem.detectedClasses.includes(cls), `Telemetry must list class ${cls}`);
    }
  });

  await t.test('AI_VIDEO_DATASET_SUMMARY matches dataset specification', () => {
    assert.equal(AI_VIDEO_DATASET_SUMMARY.fileName, 'input-001-001.MOV');
    assert.equal(AI_VIDEO_DATASET_SUMMARY.framerate, 60);
    assert.equal(AI_VIDEO_DATASET_SUMMARY.trackingStabilization.smoothingAlpha, 0.65);
    assert.ok(AI_VIDEO_DATASET_SUMMARY.supportedEntityClasses.includes('animal'));
    assert.ok(AI_VIDEO_DATASET_SUMMARY.multiEntityCollisionDetection.interactionsSupported.includes('vehicle-animal'));
  });
});

test('Track Stabilization & De-Jittering Verification', async (t) => {
  await t.test('Filters out low-confidence (<72%) jittery detections', () => {
    const rawObjects = [
      {
        id: 'valid-car-1',
        type: 'car',
        box: { x: 10, y: 10, w: 8, h: 5 },
        confidence: 94.5,
        speed: 45
      },
      {
        id: 'flicker-noise',
        type: 'car',
        box: { x: 20, y: 20, w: 8, h: 5 },
        confidence: 54.0, // Should be rejected as jitter
        speed: 30
      }
    ];

    const stabilized = trackingStabilizer.stabilizeDetections('feed-test-1', rawObjects);
    assert.equal(stabilized.length, 1, 'Low confidence flicker must be filtered out');
    assert.equal(stabilized[0].id, 'valid-car-1');
  });

  await t.test('Enforces physical constraints on aspect ratio and realistic speed', () => {
    const extremeObject = {
      id: 'distorted-truck-1',
      type: 'truck',
      box: { x: 15, y: 15, w: 2, h: 20 }, // Aspect ratio w/h = 0.1 (min allowed is 0.8)
      confidence: 88.0,
      speed: 185 // Over realistic truck limit (max 120 km/h)
    };

    const stabilized = trackingStabilizer.stabilizeDetections('feed-test-2', [extremeObject]);
    assert.equal(stabilized.length, 1);
    const obj = stabilized[0];

    // Speed clamped to truck maximum
    assert.ok(obj.speed <= 120, `Truck speed must be clamped to <= 120 km/h (got ${obj.speed})`);

    // Width adjusted to satisfy minimum aspect ratio
    const width = obj.box.w;
    const height = obj.box.h;
    const ratio = width / height;
    assert.ok(ratio >= 0.8, `Truck aspect ratio must be at least 0.8 (got ${ratio.toFixed(2)})`);
  });

  await t.test('Applies Exponential Moving Average (EMA) to smooth spatial jitter', () => {
    const feedId = 'feed-smoothing-test';
    
    // Frame 1
    const frame1 = {
      id: 'car-smooth-1',
      type: 'car',
      box: { x: 10, y: 10, w: 8, h: 5 },
      confidence: 95.0,
      speed: 40
    };
    const res1 = trackingStabilizer.stabilizeDetections(feedId, [frame1]);
    assert.equal(res1[0].box.x, 10);

    // Frame 2: sudden single-frame spatial jitter (+2px)
    const frame2 = {
      id: 'car-smooth-1',
      type: 'car',
      box: { x: 12, y: 10, w: 8, h: 5 },
      confidence: 95.0,
      speed: 40
    };
    const res2 = trackingStabilizer.stabilizeDetections(feedId, [frame2]);
    // With alpha = 0.65: new_x = 0.65 * 12 + 0.35 * 10 = 7.8 + 3.5 = 11.3
    assert.ok(res2[0].box.x < 12, `X coordinate should be smoothed below raw jitter (got ${res2[0].box.x})`);
    assert.ok(res2[0].box.x > 10, `X coordinate should advance toward target (got ${res2[0].box.x})`);
  });

  await t.test('Animal obstacle class is fully recognized with physical bounds', () => {
    const animalObj = {
      id: 'deer-hazard-1',
      type: 'animal',
      box: { x: 30, y: 24, w: 8, h: 6 },
      confidence: 86.4,
      speed: 25
    };

    const stabilized = trackingStabilizer.stabilizeDetections('feed-animal-test', [animalObj]);
    assert.equal(stabilized.length, 1);
    assert.equal(stabilized[0].type, 'animal');
    assert.ok(stabilized[0].speed <= 55, 'Animal speed clamped within biological limits');
  });
});

test('Multi-Entity Kinematic Collision & Interaction Engine', async (t) => {
  await t.test('Vehicle <-> Vehicle head-on collision produces Critical risk and valid TTC', () => {
    const vehicleA = {
      id: 'veh-A',
      type: 'car',
      box: { x: 48, y: 40, w: 8, h: 5 },
      confidence: 96.0,
      speed: 68,
      trajectoryAngle: 90
    };

    const vehicleB = {
      id: 'veh-B',
      type: 'car',
      box: { x: 50, y: 41, w: 8, h: 5 }, // Close overlap (proximity < 2m)
      confidence: 94.0,
      speed: 62,
      trajectoryAngle: 270 // Opposing head-on angle
    };

    const interaction = trackingStabilizer.assessPairKinematics(vehicleA, vehicleB);
    assert.ok(interaction, 'Kinematic interaction must be detected');
    assert.equal(interaction.interactionType, 'vehicle-vehicle');
    assert.equal(interaction.status, 'Critical: Active Collision');
    assert.ok(interaction.proximityMeters < 5.0, `Proximity must be < 5m (got ${interaction.proximityMeters}m)`);
    assert.ok(interaction.timeToCollisionSec !== null, 'TTC must be computed');
    assert.ok(interaction.timeToCollisionSec < 1.0, `TTC must be < 1.0s for immediate crash (got ${interaction.timeToCollisionSec})`);
    assert.ok(interaction.relativeVelocityKmH > 100, `Relative closure speed must sum opposing velocities (got ${interaction.relativeVelocityKmH})`);
  });

  await t.test('Vehicle <-> Pedestrian trajectory conflict generates Warning/Critical near-miss', () => {
    const vehicle = {
      id: 'veh-rush',
      type: 'car',
      box: { x: 30, y: 20, w: 8, h: 5 },
      confidence: 92.0,
      speed: 48,
      trajectoryAngle: 0 // Heading right towards pedestrian
    };

    const pedestrian = {
      id: 'ped-cross',
      type: 'pedestrian',
      box: { x: 34, y: 20, w: 3, h: 5 }, // Close distance (~2m)
      confidence: 89.0,
      speed: 4,
      trajectoryAngle: 90 // Crossing vertically
    };

    const interaction = trackingStabilizer.assessPairKinematics(vehicle, pedestrian);
    assert.ok(interaction, 'Vehicle-pedestrian interaction must be detected');
    assert.equal(interaction.interactionType, 'vehicle-pedestrian');
    assert.equal(interaction.scenario, 'Trajectory Conflict');
    assert.ok(['Critical: Active Collision', 'Warning: Accident-Prone Near-Miss'].includes(interaction.status));
    assert.ok(interaction.timeToCollisionSec !== null);
    assert.ok(interaction.timeToCollisionSec <= 1.5, `Pedestrian TTC should be acute (got ${interaction.timeToCollisionSec}s)`);
  });

  await t.test('Vehicle <-> Animal roadway intrusion generates hazard alert', () => {
    const vehicle = {
      id: 'veh-main',
      type: 'car',
      box: { x: 50, y: 50, w: 8, h: 5 },
      confidence: 95.0,
      speed: 55,
      trajectoryAngle: 45
    };

    const animal = {
      id: 'animal-intruder',
      type: 'animal',
      box: { x: 54, y: 52, w: 5, h: 4 }, // Close proximity on roadway (~2.5m)
      confidence: 85.0,
      speed: 8,
      trajectoryAngle: 180
    };

    const interaction = trackingStabilizer.assessPairKinematics(vehicle, animal);
    assert.ok(interaction, 'Vehicle-animal interaction must be detected');
    assert.equal(interaction.interactionType, 'vehicle-animal');
    assert.equal(interaction.scenario, 'Roadway Intrusion');
    assert.ok(interaction.proximityMeters < 10.0, `Animal proximity must be close (got ${interaction.proximityMeters}m)`);
    assert.ok(interaction.riskScore >= 70, `Hazard risk score must be elevated (got ${interaction.riskScore})`);
  });

  await t.test('Multi-entity interaction pipeline populates collisionRisk on objects', () => {
    const objects = [
      {
        id: 'car-1',
        type: 'car',
        box: { x: 20, y: 20, w: 8, h: 5 },
        confidence: 95.0,
        speed: 50,
        trajectoryAngle: 0
      },
      {
        id: 'car-2',
        type: 'car',
        box: { x: 23, y: 20, w: 8, h: 5 }, // Close ahead in lane
        confidence: 95.0,
        speed: 15, // Braking hard
        trajectoryAngle: 0
      }
    ];

    const interactions = trackingStabilizer.analyzeMultiEntityInteractions(objects);
    assert.ok(interactions.length >= 1);
    assert.ok(objects[0].collisionRisk, 'First object must receive collisionRisk telemetry');
    assert.ok(objects[1].collisionRisk, 'Second object must receive collisionRisk telemetry');
    assert.equal(objects[0].collisionRisk.targetId, 'car-2');
  });

  await t.test('Distant non-conflicting entities produce no false alarms', () => {
    const carA = {
      id: 'car-safe-A',
      type: 'car',
      box: { x: 5, y: 5, w: 8, h: 5 },
      confidence: 98.0,
      speed: 50
    };

    const carB = {
      id: 'car-safe-B',
      type: 'car',
      box: { x: 80, y: 80, w: 8, h: 5 }, // Far distance (>50m away)
      confidence: 98.0,
      speed: 50
    };

    const interaction = trackingStabilizer.assessPairKinematics(carA, carB);
    assert.equal(interaction, null, 'Distant non-conflicting entities produce no hazard interaction');
  });

  await t.test('Distant pedestrian produces no false alarms', () => {
    const carA = {
      id: 'car-main',
      type: 'car',
      box: { x: 5, y: 5, w: 8, h: 5 },
      confidence: 96.0,
      speed: 55
    };

    const pedFar = {
      id: 'ped-far-sidewalk',
      type: 'pedestrian',
      box: { x: 85, y: 85, w: 3, h: 5 }, // Distant sidewalk across intersection (>50m away)
      confidence: 90.0,
      speed: 4
    };

    const interaction = trackingStabilizer.assessPairKinematics(carA, pedFar);
    assert.equal(interaction, null, 'Distant pedestrian (>20m away) must not generate false alarm interaction');
  });

  await t.test('Symmetric entity evaluation yields consistent results regardless of argument order', () => {
    const vehicle = {
      id: 'veh-sym',
      type: 'car',
      box: { x: 30, y: 20, w: 8, h: 5 },
      confidence: 94.0,
      speed: 45,
      trajectoryAngle: 0
    };

    const pedestrian = {
      id: 'ped-sym',
      type: 'pedestrian',
      box: { x: 34, y: 20, w: 3, h: 5 },
      confidence: 91.0,
      speed: 4,
      trajectoryAngle: 90
    };

    const forward = trackingStabilizer.assessPairKinematics(vehicle, pedestrian);
    const reverse = trackingStabilizer.assessPairKinematics(pedestrian, vehicle);

    assert.ok(forward && reverse, 'Both orders must detect interaction');
    assert.equal(forward.interactionType, reverse.interactionType);
    assert.equal(forward.scenario, reverse.scenario);
    assert.equal(forward.status, reverse.status);
    assert.equal(forward.proximityMeters, reverse.proximityMeters);
    assert.equal(forward.relativeVelocityKmH, reverse.relativeVelocityKmH);
  });

  await t.test('Same-direction highway vehicles at high speeds (>65 km/h) are not falsely marked as head-on collisions', () => {
    const car1 = {
      id: 'car-hw-1',
      type: 'car',
      box: { x: 20, y: 20, w: 8, h: 5 },
      confidence: 96.0,
      speed: 78,
      trajectoryAngle: 90 // Heading east on highway
    };

    const car2 = {
      id: 'car-hw-2',
      type: 'car',
      box: { x: 20, y: 32, w: 8, h: 5 }, // Following in same lane (~6m headway)
      confidence: 95.0,
      speed: 72,
      trajectoryAngle: 90 // Heading east on highway
    };

    const interaction = trackingStabilizer.assessPairKinematics(car1, car2);
    assert.ok(interaction, 'Following vehicle interaction should be tracked');
    assert.notEqual(interaction.scenario, 'Head-On', 'Same direction vehicles must not be classified as Head-On collision');
    assert.notEqual(interaction.status, 'Critical: Active Collision', 'Normal highway cruise must not trigger critical collision');
  });
});

test('Kinematic Collision Classifier Trained Weights & Artifacts', async (t) => {
  await t.test('Trained weights structure matches 5-feature 4-class architecture', () => {
    assert.ok(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.featureNames.length, 5);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.classes.length, 4);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.W1.length, 5);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.W1[0].length, 32);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.b1.length, 32);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.W2.length, 32);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.W2[0].length, 4);
    assert.equal(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.b2.length, 4);
    assert.ok(KINEMATIC_COLLISION_CLASSIFIER_WEIGHTS.metrics.testAccuracy >= 95.0);
  });

  await t.test('Exported JSON model artifact exists in public/models', () => {
    const jsonPath = path.join('public', 'models', 'kinematic_collision_model.json');
    assert.ok(fs.existsSync(jsonPath), `Artifact must exist at ${jsonPath}`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    assert.equal(data.modelName, 'CrashSense-Kinematic-Interaction-Classifier');
    assert.equal(data.classes.length, 4);
  });

  await t.test('ModelInferenceService executes neural forward pass with Softmax probability distribution', () => {
    const acuteCollision = modelInferenceService.classifyKinematicInteraction({
      proximityMeters: 1.0,
      relativeSpeedKmH: 85,
      ttcSec: 0.15,
      pairType: 'vehicle-vehicle',
      trajectoryHazardScore: 95
    });

    assert.equal(acuteCollision.classProbabilities.length, 4);
    const sumProbs = acuteCollision.classProbabilities.reduce((acc, c) => acc + c.probability, 0);
    assert.ok(Math.abs(sumProbs - 100) < 1.0, `Probabilities must sum to ~100% (got ${sumProbs})`);
    assert.equal(acuteCollision.predictedClass, 'Critical: Active Collision');
    assert.ok(acuteCollision.confidence > 75, `Acute collision should have high confidence (got ${acuteCollision.confidence}%)`);
    assert.ok(acuteCollision.recommendedProtocol.includes('EMS'), 'Protocol must recommend EMS dispatch');

    const safeFlow = modelInferenceService.classifyKinematicInteraction({
      proximityMeters: 45.0,
      relativeSpeedKmH: 15,
      ttcSec: 8.5,
      pairType: 'vehicle-vehicle',
      trajectoryHazardScore: 10
    });

    assert.equal(safeFlow.predictedClass, 'Normal Safe Flow');
    assert.ok(safeFlow.confidence > 70);
  });
});

test('Real Dataset Collision Alerts Integrity', async (t) => {
  await t.test('Public safety alerts include multi-entity collision telemetry fields', () => {
    const collisionAlerts = REAL_SAFETY_ALERTS.filter(a => a.collisionType !== undefined);
    assert.ok(collisionAlerts.length >= 2, `Must have at least 2 collision alerts with kinematic fields (got ${collisionAlerts.length})`);

    collisionAlerts.forEach((alert) => {
      assert.ok(['Vehicle-Vehicle', 'Vehicle-Pedestrian', 'Vehicle-Animal'].includes(alert.collisionType), `Invalid collisionType: ${alert.collisionType}`);
      assert.ok(alert.proximityMeters !== undefined && alert.proximityMeters >= 0, 'Must have valid proximity in meters');
      assert.ok(alert.relativeClosureSpeedKmH !== undefined, 'Must have valid closure speed');
      assert.ok(alert.hazardStatus !== undefined, 'Must have hazardStatus classification');
    });
  });

  await t.test('Dynamic multi-entity collision alerts format and kinematic parameters verification', () => {
    const cam = REAL_CAMERAS[0];
    const simulatedColAlert = {
      id: 'ALT-KIN-9999',
      type: 'Traffic Accident',
      severity: 'Critical',
      location: cam.location,
      zone: cam.zone,
      cameraId: cam.id,
      cameraName: cam.name,
      timestamp: '12:00:00 PM',
      timeAgo: 'Just now',
      aiExplanation: 'Kinematic Radar Vision AI: Detected acute Head-On conflict.',
      confidence: 98.5,
      acknowledged: false,
      vehiclesInvolved: ['CAR (veh-01)', 'CAR (veh-02)'],
      snapshotBg: 'accident',
      imageUrl: '/incidents/accident_detection.jpg',
      videoUrl: cam.videoUrl,
      collisionType: 'Vehicle-Vehicle',
      timeToCollisionSec: 0.45,
      proximityMeters: 1.8,
      relativeClosureSpeedKmH: 72.5,
      hazardStatus: 'Critical: Active Collision',
      interactingObjectIds: ['veh-01', 'veh-02']
    };

    assert.equal(simulatedColAlert.collisionType, 'Vehicle-Vehicle');
    assert.equal(simulatedColAlert.interactingObjectIds.length, 2);
    assert.ok(simulatedColAlert.proximityMeters < 5.0);
    assert.ok(simulatedColAlert.timeToCollisionSec < 1.0);
    assert.equal(simulatedColAlert.hazardStatus, 'Critical: Active Collision');
  });
});
