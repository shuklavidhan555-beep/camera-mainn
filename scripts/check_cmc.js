import fs from 'fs';
import path from 'path';
import xlsxPkg from 'xlsx';
const XLSX = xlsxPkg.default || xlsxPkg;

const baseDatasets = 'd:/system/extracted_datasets';
const cmcPath = path.join(baseDatasets, 'vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/database/vehicle_data_cmc.xlsx');
if (fs.existsSync(cmcPath)) {
  const wb = XLSX.readFile(cmcPath);
  console.log('CMC sheet names:', wb.SheetNames);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log('CMC row count:', rows.length);
  if (rows.length > 0) {
    console.log('CMC first row:', rows[0]);
  }
}
