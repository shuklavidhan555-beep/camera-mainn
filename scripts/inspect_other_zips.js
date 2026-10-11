import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

const downloads = 'C:/Users/Vidhi/Downloads';
const files = fs.readdirSync(downloads);
console.log('Files in Downloads:', files.filter(f => f.endsWith('.zip')));
