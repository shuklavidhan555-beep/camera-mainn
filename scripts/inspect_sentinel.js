import sqlite from 'node:sqlite';

const dbPath = 'd:/system/extracted_datasets/sentinel/Sentinel-main/data/sentinel.db';
const db = new sqlite.DatabaseSync(dbPath);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

for (const t of tables) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
  console.log(`Table ${t.name} has ${count.c} rows`);
  const rows = db.prepare(`SELECT * FROM ${t.name} LIMIT 3`).all();
  console.log(`Sample rows for ${t.name}:`, rows);
}
