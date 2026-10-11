import fs from 'fs';

const filePath = 'd:/system/extracted_datasets/ai_video/input-001-001.MOV';
const fd = fs.openSync(filePath, 'r');
const buf = Buffer.alloc(4096);
fs.readSync(fd, buf, 0, 4096, 0);

console.log('File size:', fs.statSync(filePath).size, 'bytes');

// Check ftyp atom
let offset = 0;
while (offset < 4000) {
  const size = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  console.log(`Atom: ${type}, size: ${size} at offset ${offset}`);
  if (type === 'ftyp') {
    const majorBrand = buf.toString('ascii', offset + 8, offset + 12);
    console.log('Major brand:', majorBrand);
    offset += size;
  } else if (type === 'moov' || type === 'mdat' || type === 'free' || type === 'wide') {
    if (size === 1) {
      // 64-bit size
      offset += 16;
    } else if (size === 0) {
      break;
    } else {
      offset += size;
    }
  } else {
    break;
  }
}

fs.closeSync(fd);
