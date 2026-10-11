import { execSync } from 'child_process';
import fs from 'fs';

const psScript = `
  $shell = New-Object -ComObject Shell.Application
  $folder = $shell.Namespace('d:\\system\\extracted_datasets\\ai_video')
  $file = $folder.ParseName('input-001-001.MOV')
  
  for ($i = 0; $i -lt 320; $i++) {
      $propName = $folder.GetDetailsOf($null, $i)
      $propVal = $folder.GetDetailsOf($file, $i)
      if ($propVal -and $propName) {
          Write-Host "$propName ($i): $propVal"
      }
  }
`;

fs.writeFileSync('temp_props.ps1', psScript);
const out = execSync('powershell -ExecutionPolicy Bypass -File temp_props.ps1', { encoding: 'utf8' });
console.log(out);
fs.unlinkSync('temp_props.ps1');
