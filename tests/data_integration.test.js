import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { dataService } from '../src/services/dataService.ts';

// Load dataset JSON
const datasetPath = path.resolve('public/data/integrated_dataset.json');
assert.ok(fs.existsSync(datasetPath), 'Integrated dataset JSON must exist');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

test('Integrated Dataset Schema & Volume Verification', async (t) => {
  await t.test('Metadata verification', () => {
    assert.ok(dataset.metadata, 'Metadata must be present');
    assert.ok(dataset.metadata.totalDetectionsAggregated >= 8000, 'Must have >= 8,000 aggregated vehicle detections');
    assert.ok(dataset.metadata.totalPemsStations >= 200, 'Must have >= 200 PeMS sensor stations');
    assert.ok(dataset.metadata.totalTgcnIntervals >= 2000, 'Must have >= 2,000 T-GCN speed intervals');
  });

  await t.test('Camera sensor network validation', () => {
    assert.equal(dataset.cameras.length, 52, 'Must have 52 registered camera feeds');
    dataset.cameras.forEach((cam) => {
      assert.ok(cam.id.startsWith('CAM-'), `Camera ID ${cam.id} must start with CAM-`);
      assert.ok(cam.name.length > 5, 'Camera name must be informative');
      assert.ok(['Downtown Core', 'Highway A1', 'Tech Corridor', 'North Sector', 'Waterfront Bay', 'Harbour District'].includes(cam.zone), `Valid zone for ${cam.id}`);
      assert.ok(['online', 'warning', 'offline'].includes(cam.status), `Valid status for ${cam.id}`);
      assert.ok(cam.coordinates.x >= 0 && cam.coordinates.x <= 100, `X coordinate in 0-100% bounds: ${cam.coordinates.x}`);
      assert.ok(cam.coordinates.y >= 0 && cam.coordinates.y <= 100, `Y coordinate in 0-100% bounds: ${cam.coordinates.y}`);
      
      // Bounding box checks for detected objects
      cam.objects.forEach((obj) => {
        assert.ok(['car', 'bus', 'truck', 'pedestrian', 'bicycle', 'motorcycle'].includes(obj.type), `Valid object type: ${obj.type}`);
        assert.ok(obj.box.x >= 0 && obj.box.x <= 100, 'Bounding box x must be within 0-100%');
        assert.ok(obj.box.y >= 0 && obj.box.y <= 100, 'Bounding box y must be within 0-100%');
        assert.ok(obj.box.w > 0 && obj.box.w <= 100, 'Bounding box w must be positive');
        assert.ok(obj.box.h > 0 && obj.box.h <= 100, 'Bounding box h must be positive');
      });
    });
  });

  await t.test('Vehicle classification distribution validation', () => {
    assert.ok(dataset.vehicleDistribution.length >= 4, 'Must have at least 4 vehicle categories');
    const totalPct = dataset.vehicleDistribution.reduce((acc, v) => acc + v.percentage, 0);
    assert.equal(totalPct, 100, 'Vehicle percentages must sum to 100%');
    const totalCount = dataset.vehicleDistribution.reduce((acc, v) => acc + v.count, 0);
    assert.ok(totalCount >= 20000, `Vehicle counts must reflect real aggregated records (got ${totalCount})`);
  });

  await t.test('Hourly traffic profiles from T-GCN speed matrix', () => {
    assert.equal(dataset.hourlyTrafficData.length, 12, 'Must have 12 two-hour time intervals');
    dataset.hourlyTrafficData.forEach((h) => {
      assert.match(h.hour, /^\d{2}:00$/, `Hour format must match HH:00 (got ${h.hour})`);
      assert.ok(h.volume > 0, 'Volume must be positive');
      assert.ok(h.baseline > 0, 'Baseline must be positive');
      assert.ok(h.averageSpeed > 0 && h.averageSpeed < 120, 'Average speed must be realistic');
    });
  });

  await t.test('Public safety alerts and accident detection verification', () => {
    assert.ok(dataset.safetyAlerts.length >= 6, 'Must have real safety alerts across categories');
    const accidentAlert = dataset.safetyAlerts.find(a => a.type === 'Traffic Accident');
    assert.ok(accidentAlert, 'Must contain a Traffic Accident alert backed by accident detection dataset');
    assert.ok(accidentAlert.imageUrl, 'Accident alert must link to an actual image frame');
    assert.ok(fs.existsSync(path.join('public', accidentAlert.imageUrl)), `Image asset must exist on disk: ${accidentAlert.imageUrl}`);
  });

  await t.test('Real media assets verification in public folder', () => {
    const expectedVideos = [
      'cam_downtown_cmc.mp4',
      'cam_traffic_zone.mp4',
      'cam_harbour_logistics.mp4'
    ];
    expectedVideos.forEach((vid) => {
      const p = path.join('public/videos', vid);
      assert.ok(fs.existsSync(p), `Real video asset must exist: ${p}`);
      const stats = fs.statSync(p);
      assert.ok(stats.size > 1000000, `Video file ${vid} must be non-empty (>1MB, got ${stats.size})`);
    });
  });
});

test('DataService KPI Calculation Edge Cases & Methods', async (t) => {
  await t.test('Happy path with real dataset', () => {
    const kpis = dataService.calculateKpis(dataService.cameras, dataService.alerts, dataService.hotspots, dataService.totalVehiclesCount);
    assert.equal(kpis.totalCameras, 52);
    assert.ok(kpis.activeCameras > 40, 'Majority of cameras should be active');
    assert.ok(kpis.operationalPercentage > 80, 'Operational percentage should be realistic');
    assert.equal(kpis.todayVehiclesCount, 23801);
    assert.ok(kpis.averageNetworkSpeed > 30, 'Average network speed should be reasonable');
  });

  await t.test('Edge case: empty cameras array', () => {
    const kpis = dataService.calculateKpis([], dataService.alerts, dataService.hotspots, 0);
    assert.equal(kpis.activeCameras, 0);
    assert.equal(kpis.totalCameras, 0);
    assert.equal(kpis.operationalPercentage, 0);
  });

  await t.test('Edge case: 100% offline cameras', () => {
    const offlineCams = dataService.cameras.map(c => ({ ...c, status: 'offline' }));
    const kpis = dataService.calculateKpis(offlineCams, dataService.alerts, dataService.hotspots, 1000);
    assert.equal(kpis.activeCameras, 0);
    assert.equal(kpis.operationalPercentage, 0);
  });

  await t.test('Edge case: all alerts acknowledged', () => {
    const ackAlerts = dataService.alerts.map(a => ({ ...a, acknowledged: true }));
    const kpis = dataService.calculateKpis(dataService.cameras, ackAlerts, dataService.hotspots, 1000);
    assert.equal(kpis.criticalAlertsCount, 0);
  });
});

test('DataService Reporting & Telemetry CSV Export', async (t) => {
  await t.test('Real DataService getReportData("today") matches active alerts', () => {
    const reportToday = dataService.getReportData('today');
    assert.equal(reportToday.points.length, 6, 'Today report should have 6 time slots');
    assert.equal(reportToday.totalIncidents, dataService.alerts.length, 'Total incidents in today report must match total alerts');
    assert.ok(reportToday.avgFlowEfficiency > 0, 'Average flow efficiency must be positive');
    assert.ok(reportToday.complianceScore > 0, 'Compliance score must be positive');
  });

  await t.test('Real DataService getReportData("7days") matches weekly trend', () => {
    const report7Days = dataService.getReportData('7days');
    assert.equal(report7Days.points.length, 7, '7days report should have 7 daily points');
    assert.ok(report7Days.totalIncidents > 0, 'Total weekly incidents should be positive');
  });

  await t.test('Real DataService generateTelemetryCsv output verification', () => {
    const csvContent = dataService.generateTelemetryCsv();
    assert.ok(typeof csvContent === 'string', 'CSV content must be string');
    const lines = csvContent.split('\r\n');
    assert.equal(lines.length, dataService.cameras.length + 1, 'CSV must have 1 header line + 1 line per camera');
    assert.ok(lines[0].startsWith('Record_ID,Camera_ID,Location,Zone,Status'), 'Header must match schema');
    assert.ok(lines[1].includes(dataService.cameras[0].id), 'First row must contain first camera ID');
  });

  await t.test('Real DataService generateVehicleDetectionsCsv output verification', () => {
    const csvContent = dataService.generateVehicleDetectionsCsv();
    assert.ok(typeof csvContent === 'string', 'CSV content must be string');
    const lines = csvContent.split('\r\n');
    assert.equal(lines.length, dataService.vehicleDistribution.length + 1, 'CSV must have 1 header line + vehicle distribution rows');
    assert.ok(lines[0].startsWith('Vehicle_Class,Count,Percentage_Share,Avg_Speed_kmh'), 'Header must match schema');
  });
});
