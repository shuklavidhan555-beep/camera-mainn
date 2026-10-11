import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { modelInferenceService } from '../src/services/modelInferenceService.ts';
import { REAL_CAMERAS } from '../src/data/realDataset.ts';
import { INCIDENT_CLASSIFIER_WEIGHTS, TGCN_MODEL_PARAMETERS } from '../src/data/trainedModels.ts';

test('Camera Feeds Reliability & Asset Availability', async (t) => {
  await t.test('All 52 registered cameras have valid video and image assets', () => {
    assert.equal(REAL_CAMERAS.length, 52, 'Must have 52 registered cameras');

    REAL_CAMERAS.forEach((cam) => {
      // Check video URL
      assert.ok(cam.videoUrl, `Camera ${cam.id} must have a videoUrl assigned`);
      assert.ok(cam.videoUrl.startsWith('/videos/'), `Camera ${cam.id} videoUrl must start with /videos/`);
      
      const videoDiskPath = path.join('public', cam.videoUrl);
      assert.ok(fs.existsSync(videoDiskPath), `Video file must exist on disk: ${videoDiskPath}`);
      const vStats = fs.statSync(videoDiskPath);
      assert.ok(vStats.size > 100000, `Video file ${videoDiskPath} must be non-empty (>100KB, got ${vStats.size})`);

      // Check image URL
      assert.ok(cam.imageUrl, `Camera ${cam.id} must have an imageUrl assigned`);
      assert.ok(cam.imageUrl.startsWith('/incidents/'), `Camera ${cam.id} imageUrl must start with /incidents/`);
      const imgDiskPath = path.join('public', cam.imageUrl);
      assert.ok(fs.existsSync(imgDiskPath), `Image file must exist on disk: ${imgDiskPath}`);
      const iStats = fs.statSync(imgDiskPath);
      assert.ok(iStats.size > 5000, `Image file ${imgDiskPath} must be non-empty (>5KB, got ${iStats.size})`);

      // Check coordinates
      assert.ok(cam.coordinates.x >= 0 && cam.coordinates.x <= 100, `Camera ${cam.id} coord x in 0-100%`);
      assert.ok(cam.coordinates.y >= 0 && cam.coordinates.y <= 100, `Camera ${cam.id} coord y in 0-100%`);

      // Check themes are valid
      assert.ok(
        ['highway', 'intersection', 'tunnel', 'bridge', 'roundabout', 'crosswalk'].includes(cam.videoTheme || 'highway'),
        `Camera ${cam.id} videoTheme must be one of supported themes`
      );
    });
  });

  await t.test('Multiple unique video streams are distributed across zones', () => {
    const uniqueVideos = new Set(REAL_CAMERAS.map(c => c.videoUrl));
    assert.ok(uniqueVideos.size >= 6, `Must utilize at least 6 distinct CCTV video streams across the city (got ${uniqueVideos.size})`);
    
    const zones = new Set(REAL_CAMERAS.map(c => c.zone));
    assert.ok(zones.size >= 5, `Cameras must cover multiple city zones (got ${zones.size})`);
  });

  await t.test('Dist folder contains mirrored video and image assets for production', () => {
    const pubVideos = fs.readdirSync('public/videos').filter(f => f.endsWith('.mp4'));
    assert.ok(pubVideos.length >= 8, 'public/videos must contain at least 8 video files');
    
    pubVideos.forEach(vid => {
      const distPath = path.join('dist/videos', vid);
      assert.ok(fs.existsSync(distPath), `dist/videos must mirror public video: ${vid}`);
      assert.ok(fs.statSync(distPath).size > 100000, `dist video ${vid} must be valid size`);
    });
  });
});

test('T-GCN Trained Model Artifacts Verification', async (t) => {
  const tgcnPath = path.resolve('public/models/tgcn_traffic_model.json');
  assert.ok(fs.existsSync(tgcnPath), 'T-GCN model artifact must exist in public/models/');
  
  const tgcn = JSON.parse(fs.readFileSync(tgcnPath, 'utf8'));

  await t.test('T-GCN metadata & topology', () => {
    assert.equal(tgcn.modelName, 'T-GCN-Shenzhen-UrbanFlow');
    assert.equal(tgcn.dataset.totalNodes, 156, 'Must have 156 road sensor nodes');
    assert.equal(tgcn.dataset.totalIntervals, 2976, 'Must have 2976 time intervals');
    assert.equal(tgcn.hyperparameters.hiddenDim, 64, 'Hidden dimension must be 64');
    assert.equal(tgcn.sensorIds.length, 156, 'Must list 156 sensor IDs');
  });

  await t.test('T-GCN Graph Laplacian & Weights integrity', () => {
    const lap = tgcn.weights.laplacian;
    assert.equal(lap.length, 156, 'Laplacian must have 156 rows');
    assert.equal(lap[0].length, 156, 'Laplacian must have 156 columns');
    
    assert.ok(!isNaN(lap[0][0]), 'Laplacian values must be finite numbers');
    assert.ok(!isNaN(tgcn.weights.W1[0][0]), 'W1 weights must be finite numbers');
    assert.ok(!isNaN(tgcn.weights.W2[0][0]), 'W2 weights must be finite numbers');
    assert.equal(tgcn.weights.b1.length, 64, 'b1 bias dimension must match hiddenDim 64');
    assert.equal(tgcn.weights.b2.length, 156, 'b2 bias dimension must match numNodes 156');
  });

  await t.test('T-GCN Training Loss Convergence & Metrics', () => {
    assert.ok(tgcn.metrics.epochsTrained >= 30, 'Must have trained for >= 30 epochs');
    assert.ok(tgcn.metrics.finalValRmseKmH < 6.0, `Final RMSE should be reasonable (< 6.0 km/h, got ${tgcn.metrics.finalValRmseKmH})`);
    assert.ok(tgcn.metrics.finalValMaeKmH < 4.0, `Final MAE should be reasonable (< 4.0 km/h, got ${tgcn.metrics.finalValMaeKmH})`);
    assert.ok(tgcn.metrics.lossConvergence.length >= 30, 'Must record loss convergence across epochs');
  });
});

test('CrashSense Risk Classifier Model Artifacts Verification', async (t) => {
  const clfPath = path.resolve('public/models/accident_risk_model.json');
  assert.ok(fs.existsSync(clfPath), 'Classifier artifact must exist in public/models/');
  
  const clf = JSON.parse(fs.readFileSync(clfPath, 'utf8'));

  await t.test('Classifier architecture & classes', () => {
    assert.equal(clf.modelName, 'CrashSense-Sentinel-RiskClassifier');
    assert.ok(clf.classes.includes('Collision Risk'), 'Must include Collision Risk class');
    assert.ok(clf.classes.includes('Overspeeding'), 'Must include Overspeeding class');
    assert.ok(clf.classes.includes('High Congestion'), 'Must include High Congestion class');
    assert.ok(clf.classes.includes('Normal'), 'Must include Normal class');
    assert.ok(clf.metrics.trainedSamples >= 5000, 'Must be trained on >= 5,000 samples');
  });

  await t.test('Trained weights exported in TypeScript module match artifact dimensions', () => {
    assert.equal(INCIDENT_CLASSIFIER_WEIGHTS.W1.length, 5, 'W1 must have 5 input features');
    assert.equal(INCIDENT_CLASSIFIER_WEIGHTS.W1[0].length, 32, 'W1 must have 32 hidden units');
    assert.equal(INCIDENT_CLASSIFIER_WEIGHTS.b1.length, 32, 'b1 must have 32 biases');
    assert.equal(INCIDENT_CLASSIFIER_WEIGHTS.W2.length, 32, 'W2 must have 32 hidden inputs');
    assert.equal(INCIDENT_CLASSIFIER_WEIGHTS.W2[0].length, 5, 'W2 must have 5 output classes');
    assert.equal(INCIDENT_CLASSIFIER_WEIGHTS.b2.length, 5, 'b2 must have 5 biases');
  });
});

test('ModelInferenceService Live Inference & Real Forward Pass', async (t) => {
  await t.test('Happy path speed prediction across 4 horizons', () => {
    const res = modelInferenceService.predictTrafficSpeed('CAM-716939', 45);
    assert.equal(res.length, 4, 'Must return 4 time horizons');
    assert.equal(res[0].horizon, '+15 min');
    assert.equal(res[1].horizon, '+30 min');
    assert.equal(res[2].horizon, '+45 min');
    assert.equal(res[3].horizon, '+60 min');

    res.forEach(item => {
      assert.ok(item.predictedSpeed > 0 && item.predictedSpeed < 130, `Realistic speed: ${item.predictedSpeed}`);
      assert.ok(item.confidence > 80 && item.confidence <= 100, `Valid confidence: ${item.confidence}`);
      assert.ok(['Free Flow', 'Moderate', 'Heavy Congestion', 'Severe Bottleneck'].includes(item.congestionGrade));
    });
  });

  await t.test('Edge case: extremely low speed (severe congestion)', () => {
    const res = modelInferenceService.predictTrafficSpeed('CAM-UNKNOWN', 8);
    assert.ok(res[0].predictedSpeed < 25, 'Should forecast very low speed');
    assert.ok(['Severe Bottleneck', 'Heavy Congestion'].includes(res[0].congestionGrade));
  });

  await t.test('Edge case: high speed free flow', () => {
    const res = modelInferenceService.predictTrafficSpeed('CAM-UNKNOWN', 95);
    assert.ok(res[0].predictedSpeed > 60, 'Should forecast high speed');
    assert.equal(res[0].congestionGrade, 'Free Flow');
  });

  await t.test('Incident classification: Violent kinetic deceleration (Accident) via true Softmax forward pass', () => {
    const res = modelInferenceService.classifyIncidentRisk({
      speed: 35,
      acceleration: -9.5,
      density: 70,
      vehicleType: 'car',
      proximityHazard: 92
    });
    assert.equal(res.predictedClass, 'Kinetic Collision Risk');
    assert.equal(res.severity, 'Critical');
    assert.ok(res.confidence > 80, `Expected high confidence, got ${res.confidence}`);
    assert.ok(res.recommendedDispatch.includes('Ambulance'));

    // Check softmax probabilities sum to 100%
    const sumProbs = res.classProbabilities.reduce((acc, c) => acc + c.probability, 0);
    assert.ok(Math.abs(sumProbs - 100) < 1.0, `Softmax distribution must sum to ~100%, got ${sumProbs}`);
  });

  await t.test('Incident classification: Overspeeding violation via true Softmax forward pass', () => {
    const res = modelInferenceService.classifyIncidentRisk({
      speed: 105,
      acceleration: 0.5,
      density: 20,
      vehicleType: 'car'
    });
    assert.equal(res.predictedClass, 'Overspeeding Violation');
    assert.equal(res.severity, 'High');
    assert.ok(res.confidence > 75);
  });

  await t.test('Incident classification: Wrong-way vehicle via true Softmax forward pass', () => {
    const res = modelInferenceService.classifyIncidentRisk({
      speed: -25,
      acceleration: 0,
      density: 30,
      vehicleType: 'car'
    });
    assert.equal(res.predictedClass, 'Wrong-Way Anomaly');
    assert.equal(res.severity, 'Critical');
    assert.ok(res.recommendedDispatch.includes('Interceptor'));
  });

  await t.test('Incident classification: Normal cruise flow via true Softmax forward pass', () => {
    const res = modelInferenceService.classifyIncidentRisk({
      speed: 55,
      acceleration: 0.2,
      density: 35,
      vehicleType: 'car'
    });
    assert.equal(res.predictedClass, 'Normal Flow');
    assert.equal(res.severity, 'Low');
  });

  await t.test('Graph Convolution forward pass kernel executes cleanly', () => {
    // 2-node toy test of executeFullTgcnForwardPass
    const lap = [[1, 0.5], [0.5, 1]];
    const W1 = [
      [0.1, 0.2], [0.2, 0.3], // time 0
      [0.1, 0.2], [0.2, 0.3]  // time 1
    ];
    const b1 = [0.01, 0.01];
    const W2 = [[0.5, 0.5], [0.5, 0.5]];
    const b2 = [0.05, 0.05];
    const xHist = [[0.5, 0.6], [0.55, 0.65]];

    const y = modelInferenceService.executeFullTgcnForwardPass(lap, W1, b1, W2, b2, xHist);
    assert.equal(y.length, 2, 'Must output prediction for 2 nodes');
    assert.ok(!isNaN(y[0]) && !isNaN(y[1]), 'Output must be non-NaN numbers');
  });
});
