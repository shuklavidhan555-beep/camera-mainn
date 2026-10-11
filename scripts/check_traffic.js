import fs from 'fs';
import path from 'path';
import xlsxPkg from 'xlsx';
const XLSX = xlsxPkg.default || xlsxPkg;

const baseDatasets = 'd:/system/extracted_datasets';
const tPath = path.join(baseDatasets, 'vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/database/traffic_data.xlsx');
if (fs.existsSync(tPath)) {
  const wb = XLSX.readFile(tPath);
  console.log('traffic_data sheet names:', wb.SheetNames);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log('traffic_data row count:', rows.length);
  if (rows.length > 0) {
    console.log('traffic_data first row:', rows[0]);
  }
}
