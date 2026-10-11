import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const targetDir = 'd:/system/extracted_datasets/ai_video';
fs.mkdirSync(targetDir, { recursive: true });

console.log('Extracting c:/Users/Vidhi/Downloads/ai video.zip to', targetDir);

const psScript = `
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zipPath = 'C:/Users/Vidhi/Downloads/ai video.zip'
  $destFolder = 'd:/system/extracted_datasets/ai_video'
  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  foreach ($entry in $zip.Entries) {
      $destPath = Join-Path $destFolder $entry.FullName
      $parent = Split-Path $destPath
      if (-not (Test-Path $parent)) {
          New-Item -ItemType Directory -Path $parent -Force | Out-Null
      }
      if (-not $entry.FullName.EndsWith('/')) {
          Write-Host "Extracting $($entry.FullName) ($($entry.Length) bytes)..."
          [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
      }
  }
  $zip.Dispose()
  Write-Host "Extraction complete!"
`;

fs.writeFileSync('temp_extract_ai_video.ps1', psScript);
try {
  const out = execSync('powershell -ExecutionPolicy Bypass -File temp_extract_ai_video.ps1', { encoding: 'utf8', stdio: 'inherit' });
} finally {
  if (fs.existsSync('temp_extract_ai_video.ps1')) {
    fs.unlinkSync('temp_extract_ai_video.ps1');
  }
}
