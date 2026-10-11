import test from 'node:test';
import assert from 'node:assert/strict';
import { realTimeStreamEngine } from '../src/services/realTimeStreamEngine.ts';
import { dataService } from '../src/services/dataService.ts';
import { 
  REAL_CAMERAS, 
  REAL_VEHICLE_DISTRIBUTION, 
  REAL_ZONE_SPEED_DATA, 
  REAL_HOURLY_TRAFFIC_DATA, 
  REAL_CONGESTION_HOTSPOTS
} from '../src/data/realDataset.ts';
import { 
  REAL_SENTINEL_CONFIRMED_INCIDENTS,
  REAL_TGCN_TEMPORAL_INTERVALS 
} from '../src/data/realIncidentFeed.ts';

test('Real-Time Data Streaming Engine Architecture & Verification', async (t) => {
  await t.test('Engine initializes with baseline datasets', () => {
    assert.ok(realTimeStreamEngine, 'RealTimeStreamEngine singleton must exist');
    assert.equal(realTimeStreamEngine.isRunning, true, 'Engine must be running by default');
    assert.equal(realTimeStreamEngine.streamSpeed, 1, 'Stream speed starts at 1x');
    assert.equal(realTimeStreamEngine.todayVehiclesCount, 23801, 'Baseline vehicle count must match real dataset detections');
    assert.ok(realTimeStreamEngine.todayAccidentsCount >= 12, 'Base accidents count must reflect confirmed incidents');
    assert.ok(realTimeStreamEngine.aggregateBandwidthMbps > 40, 'Aggregate camera bandwidth must be > 40 Mbps');
  });

  await t.test('Sentinel confirmed incident pool integrity', () => {
    assert.ok(REAL_SENTINEL_CONFIRMED_INCIDENTS.length >= 10, 'Must have at least 10 confirmed Sentinel accidents');
    REAL_SENTINEL_CONFIRMED_INCIDENTS.forEach((inc) => {
      assert.ok(inc.id.startsWith('INC-'), `Incident ID ${inc.id} must start with INC-`);
      assert.ok(inc.confidence > 70, `Incident ${inc.id} must have high optical confidence (>70%)`);
      assert.ok(inc.vehiclesInvolved.length > 0, `Incident ${inc.id} must list vehicles involved`);
      assert.ok(inc.imageUrl, `Incident ${inc.id} must have an imageUrl`);
      assert.ok(inc.videoUrl, `Incident ${inc.id} must have a videoUrl`);
      assert.ok(['Critical', 'High', 'Medium'].includes(inc.severity), `Valid severity for ${inc.id}`);
    });
  });

  await t.test('T-GCN temporal speed intervals integrity', () => {
    assert.ok(REAL_TGCN_TEMPORAL_INTERVALS.length >= 6, 'Must have multiple temporal speed intervals');
    REAL_TGCN_TEMPORAL_INTERVALS.forEach((interval) => {
      assert.ok(interval.intervalIndex > 0, 'Interval index must be positive');
      assert.ok(interval.timeLabel.match(/^\d{2}:\d{2}$/), 'Time label must match HH:MM');
      const zones = ['Highway A1', 'Downtown Core', 'Tech Corridor', 'North Sector', 'Waterfront Bay', 'Harbour District'];
      zones.forEach((z) => {
        assert.ok(interval.speeds[z] > 10 && interval.speeds[z] < 120, `Realistic speed for zone ${z}`);
        assert.ok(interval.congestions[z] >= 0 && interval.congestions[z] <= 100, `Valid congestion index for ${z}`);
      });
    });
  });

  await t.test('Vehicle detections stream advancement and class distribution', () => {
    const initialCount = realTimeStreamEngine.todayVehiclesCount;
    const initialDist = JSON.parse(JSON.stringify(REAL_VEHICLE_DISTRIBUTION));

    const result = realTimeStreamEngine.advanceVehicleDetections(initialDist);

    assert.ok(result.addedCount >= 3 && result.addedCount <= 8, `Added count between 3 and 8 at 1x (got ${result.addedCount})`);
    assert.equal(realTimeStreamEngine.todayVehiclesCount, initialCount + result.addedCount);

    // Distribution percentages sum to 100%
    const sumPct = Math.round(result.updatedDistribution.reduce((acc, v) => acc + v.percentage, 0));
    assert.equal(sumPct, 100, 'Updated vehicle percentages must sum to 100%');

    // Individual vehicle counts increased
    result.updatedDistribution.forEach((v, i) => {
      assert.ok(v.count >= initialDist[i].count, `Vehicle category ${v.name} count must not decrease`);
    });
  });

  await t.test('Speed multiplier (2x, 5x) accelerates vehicle streaming rate', () => {
    realTimeStreamEngine.setStreamSpeed(5);
    assert.equal(realTimeStreamEngine.streamSpeed, 5);

    const initialDist = JSON.parse(JSON.stringify(REAL_VEHICLE_DISTRIBUTION));
    const result = realTimeStreamEngine.advanceVehicleDetections(initialDist);

    // At 5x, base increment (3..8)*5 = 15..40
    assert.ok(result.addedCount >= 15, `At 5x speed, added count should be >= 15 (got ${result.addedCount})`);

    // Reset back to 1x
    realTimeStreamEngine.setStreamSpeed(1);
    assert.equal(realTimeStreamEngine.streamSpeed, 1);
  });

  await t.test('Camera telemetry advancement (jitter, FPS, vehicle counts, congestionScore)', () => {
    const sampleCameras = JSON.parse(JSON.stringify(REAL_CAMERAS));
    const updated = realTimeStreamEngine.advanceCameraTelemetry(sampleCameras);

    assert.equal(updated.length, sampleCameras.length);

    updated.forEach((cam) => {
      if (cam.status === 'offline') {
        assert.equal(cam.latencyMs, 0);
        assert.equal(cam.fps, 0);
      } else {
        assert.ok(cam.latencyMs >= 16 && cam.latencyMs <= 120, `Latency within realistic bounds (got ${cam.latencyMs}ms for ${cam.id})`);
        assert.ok(cam.fps > 25, `FPS must remain stable (got ${cam.fps} for ${cam.id})`);
        assert.ok(cam.vehicleCount > 0, `Vehicle count must be positive for active camera ${cam.id}`);
        assert.ok(cam.congestionScore >= 15 && cam.congestionScore <= 100, `Congestion score dynamic in range (got ${cam.congestionScore} for ${cam.id})`);
      }
    });

    assert.ok(realTimeStreamEngine.aggregateBandwidthMbps > 40, 'Total aggregate throughput must be realistic');
  });

  await t.test('T-GCN temporal speed interval advancement', () => {
    const sampleZones = JSON.parse(JSON.stringify(REAL_ZONE_SPEED_DATA));
    const sampleHourly = JSON.parse(JSON.stringify(REAL_HOURLY_TRAFFIC_DATA));
    const sampleHotspots = JSON.parse(JSON.stringify(REAL_CONGESTION_HOTSPOTS));

    const result = realTimeStreamEngine.advanceTemporalInterval(sampleZones, sampleHourly, sampleHotspots);

    assert.equal(result.updatedZoneSpeedData.length, sampleZones.length);
    assert.equal(result.updatedHourlyData.length, sampleHourly.length);
    assert.equal(result.updatedHotspots.length, sampleHotspots.length);

    result.updatedZoneSpeedData.forEach((z) => {
      assert.ok(z.avgSpeed > 10 && z.avgSpeed < 100, `Zone ${z.zone} speed realistic`);
      assert.ok(z.congestionScore >= 0 && z.congestionScore <= 100, `Zone ${z.zone} congestion score in range`);
    });
  });

  await t.test('Real incident influx pulls confirmed Sentinel accident', () => {
    const initialAccidentCount = realTimeStreamEngine.todayAccidentsCount;
    const alert = realTimeStreamEngine.getNextRealIncident();

    assert.ok(alert.id.startsWith('INC-') || alert.id.startsWith('OVR-'), 'Incident must originate from real dataset pool');
    assert.ok(alert.timestamp.length > 0, 'Alert must have valid timestamp');
    assert.equal(alert.timeAgo, 'Just now');
    assert.ok(alert.confidence >= 70, 'Incident must have valid confidence');
    assert.equal(alert.acknowledged, false, 'New incident must start unacknowledged');
    assert.equal(realTimeStreamEngine.todayAccidentsCount, initialAccidentCount + 1, 'Today accidents count must increment');
  });

  await t.test('DataService calculateKpis includes totalAccidentsToday & activeWorkingCamerasCount', () => {
    const kpis = dataService.calculateKpis(
      dataService.cameras,
      dataService.alerts,
      dataService.hotspots,
      realTimeStreamEngine.todayVehiclesCount,
      realTimeStreamEngine.todayAccidentsCount
    );

    assert.equal(kpis.totalCameras, 52);
    assert.ok(kpis.activeCameras >= 45, 'Majority of cameras should be working');
    assert.equal(kpis.activeWorkingCamerasCount, kpis.activeCameras);
    assert.equal(kpis.totalAccidentsToday, realTimeStreamEngine.todayAccidentsCount);
    assert.ok(kpis.todayVehiclesCount >= 23801);
  });

  await t.test('DataService calculateKpis updates dynamically with streaming zones and hourly flow', () => {
    const customZones = [
      { zone: 'Highway A1', avgSpeed: 75.0, congestionScore: 30, vehicleCount: 1500 },
      { zone: 'Downtown Core', avgSpeed: 65.0, congestionScore: 40, vehicleCount: 2000 }
    ];
    const customHourly = [
      { hour: '12:00', volume: 4000, baseline: 3500, averageSpeed: 60 }
    ];

    const dynamicKpis = dataService.calculateKpis(
      dataService.cameras,
      dataService.alerts,
      dataService.hotspots,
      30000,
      18,
      customZones,
      customHourly
    );

    assert.equal(dynamicKpis.averageNetworkSpeed, 70.0, 'Average speed must be computed from dynamic zone speeds: (75 + 65) / 2 = 70.0');
    assert.equal(dynamicKpis.vehicleFlowRate, 2800, 'Flow rate must be 4000 * 0.7 = 2800');
    assert.equal(dynamicKpis.todayVehiclesCount, 30000);
    assert.equal(dynamicKpis.totalAccidentsToday, 18);
  });
});
