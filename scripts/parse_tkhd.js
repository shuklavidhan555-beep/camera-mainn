import fs from 'fs';

const filePath = 'd:/system/extracted_datasets/ai_video/input-001-001.MOV';
const fileSize = fs.statSync(filePath).size;
const fd = fs.openSync(filePath, 'r');
const bufSize = 512 * 1024;
const buf = Buffer.alloc(bufSize);
fs.readSync(fd, buf, 0, bufSize, fileSize - bufSize);

const tkhdIdx = buf.indexOf('tkhd');
if (tkhdIdx !== -1) {
  // tkhd width and height are at offset 76 and 80 from tkhd fourcc for version 0, or 88 and 92 for version 1
  const version = buf[tkhdIdx + 4];
  const offset = version === 1 ? tkhdIdx + 4 + 88 : tkhdIdx + 4 + 76;
  const width = buf.readUInt32BE(offset) / 65536;
  const height = buf.readUInt32BE(offset + 4) / 65536;
  console.log(`Resolution from tkhd: ${width} x ${height}, version: ${version}`);
}

const mdhdIdx = buf.indexOf('mdhd');
if (mdhdIdx !== -1) {
  const version = buf[mdhdIdx + 4];
  const timescale = version === 1 ? buf.readUInt32BE(mdhdIdx + 4 + 20) : buf.readUInt32BE(mdhdIdx + 4 + 12);
  const duration = version === 1 ? buf.readBigUInt64BE(mdhdIdx + 4 + 24) : buf.readUInt32BE(mdhdIdx + 4 + 16);
  console.log(`Timescale: ${timescale}, Duration: ${duration} (${Number(duration) / timescale} seconds)`);
}

fs.closeSync(fd);
