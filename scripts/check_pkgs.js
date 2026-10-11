import fs from 'fs';
const pkgs = fs.readdirSync('d:/system/node_modules');
console.log('Zip related pkgs:', pkgs.filter(p => p.includes('zip') || p.includes('tar') || p.includes('compress')));
