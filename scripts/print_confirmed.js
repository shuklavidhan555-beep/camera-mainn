import sqlite from 'node:sqlite';

const dbPath = 'd:/system/extracted_datasets/sentinel/Sentinel-main/data/sentinel.db';
const db = new sqlite.DatabaseSync(dbPath);
const confirmed = db.prepare("SELECT * FROM incidents WHERE verdict='CONFIRMED'").all();

for (const inc of confirmed) {
  console.log(`ID: ${inc.id}, Zone: ${inc.zone}, Severity: ${inc.severity}, Priority: ${inc.priority}, Unit: ${inc.dispatched_unit}`);
  console.log(`  Narrative: ${inc.narrative}`);
  console.log(`  Detections: ${inc.detections}`);
}
