import fs from 'fs';

const filePath = 'd:/system/extracted_datasets/ai_video/input-001-001.MOV';
const fileSize = fs.statSync(filePath).size;
const fd = fs.openSync(filePath, 'r');
const bufSize = 512 * 1024;
const buf = Buffer.alloc(bufSize);
fs.readSync(fd, buf, 0, bufSize, fileSize - bufSize);

console.log('Searching for moov atom in last 512KB...');
for (let i = 0; i < bufSize - 8; i++) {
  if (buf.toString('ascii', i, i + 4) === 'moov') {
    console.log('Found moov at offset from end:', bufSize - i);
    // Print around moov
    const chunk = buf.subarray(i - 4, i + 1024);
    // Find codecs like avc1, hvc1, apcn, etc.
    const text = chunk.toString('ascii');
    console.log('ASCII snippet near moov:');
    const printable = text.replace(/[^a-zA-Z0-9_\- /.:]/g, ' ');
    console.log(printable.slice(0, 300));
    break;
  }
}

// Search for video codec fourcc
const codecMatches = ['avc1', 'hvc1', 'hev1', 'mp4v', 'apcn', 'apch', 'apcs', 'apco', 'jpeg', 'mjpg'];
for (const c of codecMatches) {
  const idx = buf.indexOf(c);
  if (idx !== -1) {
    console.log(`Found codec marker: ${c} at index ${idx}`);
  }
}

fs.closeSync(fd);
