import { execSync } from 'child_process';
import fs from 'fs';

console.log('Inspecting c:/Users/Vidhi/Downloads/ai video.zip');
try {
  const files = fs.readdirSync('C:/Users/Vidhi/Downloads');
  console.log('Files in Downloads:', files);
  
  const bName = 'A-Large-scale-benchmark-for-traffic-accidents-detection-from-video-surveillance-main.zip';
  console.log(`\n--- Inspecting ${bName} ---`);
  const psScript = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead('C:/Users/Vidhi/Downloads/${bName}')
    Write-Host "Total entries: " $zip.Entries.Count
    $zip.Entries | Select-Object -First 40 | ForEach-Object {
        Write-Host "$($_.FullName) | $($_.Length) bytes"
    }
    $zip.Dispose()
  `;
  fs.writeFileSync('temp_inspect.ps1', psScript);
  const out = execSync('powershell -ExecutionPolicy Bypass -File temp_inspect.ps1', { encoding: 'utf8' });
  console.log(out);
  fs.unlinkSync('temp_inspect.ps1');
} catch (err) {
  console.error(err);
}
