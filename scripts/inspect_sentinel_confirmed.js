import sqlite from 'node:sqlite';

const dbPath = 'd:/system/extracted_datasets/sentinel/Sentinel-main/data/sentinel.db';
const db = new sqlite.DatabaseSync(dbPath);
const confirmed = db.prepare("SELECT * FROM incidents WHERE verdict='CONFIRMED'").all();
console.log('Confirmed incidents count:', confirmed.length);
console.log('Sample confirmed incidents:');
console.log(JSON.stringify(confirmed.slice(0, 5), null, 2));

const priorities = db.prepare("SELECT priority, COUNT(*) as c FROM incidents GROUP BY priority").all();
console.log('Priorities in sentinel:', priorities);

const verdicts = db.prepare("SELECT verdict, COUNT(*) as c FROM incidents GROUP BY verdict").all();
console.log('Verdicts in sentinel:', verdicts);
