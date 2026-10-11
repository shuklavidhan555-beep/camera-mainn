import { execSync } from 'child_process';

const zips = [
  'NSVAD-main.zip',
  'A-Large-scale-benchmark-for-traffic-accidents-detection-from-video-surveillance-main.zip',
  'edo_sz.zip'
];

for (const z of zips) {
  console.log(`\n=== Checking ${z} ===`);
  const cmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('C:/Users/Vidhi/Downloads/${z}'); $zip.Entries | Select-Object -First 30 -ExpandProperty FullName; $zip.Dispose()"`;
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    console.log(out);
  } catch (err) {
    console.error(`Error reading ${z}:`, err.message);
  }
}
