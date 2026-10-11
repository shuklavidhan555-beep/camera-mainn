import fs from 'fs';
import path from 'path';

const xmlDir = 'd:/system/extracted_datasets/minipro/Minipro_dataset/Codes';
const files = fs.readdirSync(xmlDir).filter(f => f.endsWith('.xml'));

const classStats = {};
const samples = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(xmlDir, file), 'utf8');
  const wMatch = content.match(/<width>(\d+)<\/width>/);
  const hMatch = content.match(/<height>(\d+)<\/height>/);
  const width = wMatch ? parseInt(wMatch[1]) : 1920;
  const height = hMatch ? parseInt(hMatch[1]) : 1080;

  const objRegex = /<object>([\s\S]*?)<\/object>/g;
  let m;
  const objs = [];
  while ((m = objRegex.exec(content)) !== null) {
    const objBlock = m[1];
    const nameMatch = objBlock.match(/<name>(.*?)<\/name>/);
    const xmin = objBlock.match(/<xmin>([0-9.]+)<\/xmin>/);
    const ymin = objBlock.match(/<ymin>([0-9.]+)<\/ymin>/);
    const xmax = objBlock.match(/<xmax>([0-9.]+)<\/xmax>/);
    const ymax = objBlock.match(/<ymax>([0-9.]+)<\/ymax>/);
    if (nameMatch && xmin && ymin && xmax && ymax) {
      const cls = nameMatch[1].trim();
      classStats[cls] = (classStats[cls] || 0) + 1;
      const x1 = parseFloat(xmin[1]);
      const y1 = parseFloat(ymin[1]);
      const x2 = parseFloat(xmax[1]);
      const y2 = parseFloat(ymax[1]);
      objs.push({
        type: cls,
        box: {
          x: Math.round((x1 / width) * 100),
          y: Math.round((y1 / height) * 100),
          w: Math.round(((x2 - x1) / width) * 100),
          h: Math.round(((y2 - y1) / height) * 100),
        }
      });
    }
  }
  if (objs.length > 0) {
    samples.push({ file, count: objs.length, objs: objs.slice(0, 5) });
  }
}

console.log('Class counts in XMLs:', classStats);
console.log('Sample parsed XMLs count:', samples.length);
if (samples.length > 0) {
  console.log('Sample 1:', JSON.stringify(samples[0], null, 2));
}
