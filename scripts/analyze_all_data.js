import fs from 'fs';
import path from 'path';
import xlsxPkg from 'xlsx';
const XLSX = xlsxPkg.default || xlsxPkg;

const baseDatasets = 'd:/system/extracted_datasets';

console.log('--- 1. Analyzing vehicle_data.xlsx ---');
const vehicleDataPath = path.join(baseDatasets, 'vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/database/vehicle_data.xlsx');
if (fs.existsSync(vehicleDataPath)) {
  const wb = XLSX.readFile(vehicleDataPath);
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  console.log('Vehicle data row count:', rows.length);
  console.log('First 3 rows:', rows.slice(0, 3));
  
  // Count by vehicle_name
  const counts = {};
  let totalSpeed = 0;
  let speedCount = 0;
  let maxSpeed = 0;
  let overspeedCount = 0;

  for (const r of rows) {
    const vName = (r.vehicle_name || 'unknown').toLowerCase();
    counts[vName] = (counts[vName] || 0) + 1;
    if (r.speed) {
      const spdNum = parseFloat(String(r.speed).replace(/[^0-9.]/g, ''));
      if (!isNaN(spdNum) && spdNum > 0) {
        totalSpeed += spdNum;
        speedCount++;
        if (spdNum > maxSpeed) maxSpeed = spdNum;
        if (spdNum > 75) overspeedCount++;
      }
    }
  }
  console.log('Vehicle types breakdown:', counts);
  console.log('Average speed:', (totalSpeed / speedCount).toFixed(2), 'km/h');
  console.log('Max speed:', maxSpeed, 'km/h');
  console.log('Overspeeding (>75 km/h) occurrences:', overspeedCount);
}

console.log('\n--- 2. Analyzing PeMSD7 Sensor Station Info ---');
const pemsPath = path.join(baseDatasets, 'stgcn/STGCN_IJCAI-18-master/dataset/PeMSD7_M_Station_Info_228.csv');
if (fs.existsSync(pemsPath)) {
  const content = fs.readFileSync(pemsPath, 'utf8');
  const lines = content.trim().split('\n');
  console.log('PeMS stations count:', lines.length - 1);
  const header = lines[0];
  console.log('Header:', header);
  const fwyCounts = {};
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    // ID, Fwy, Dir, District, Lat, Lng
    const fwy = parts[2];
    fwyCounts[fwy] = (fwyCounts[fwy] || 0) + 1;
  }
  console.log('Freeways in PeMS:', fwyCounts);
}

console.log('\n--- 3. Analyzing sz_speed.csv ---');
const szSpeedPath = path.join(baseDatasets, 'tgcn/T-GCN-master/AST-GCN/data/sz_speed.csv');
if (fs.existsSync(szSpeedPath)) {
  const content = fs.readFileSync(szSpeedPath, 'utf8');
  const lines = content.trim().split('\n');
  console.log('sz_speed time intervals (rows):', lines.length - 1);
  const sensorIds = lines[0].split(',');
  console.log('Number of road sensor links:', sensorIds.length);
  // Calculate average network speed for hour intervals (every 4 rows = 1 hour, since 15-min intervals)
  console.log('First 5 sensor IDs:', sensorIds.slice(0, 5));
}

console.log('\n--- 4. Analyzing Minipro Pascal VOC XMLs ---');
const miniproCodes = path.join(baseDatasets, 'minipro/Minipro_dataset/Codes');
if (fs.existsSync(miniproCodes)) {
  const xmls = fs.readdirSync(miniproCodes).filter(f => f.endsWith('.xml'));
  console.log('Minipro XML count:', xmls.length);
}
