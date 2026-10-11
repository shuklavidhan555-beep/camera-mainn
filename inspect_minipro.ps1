Add-Type -AssemblyName System.IO.Compression.FileSystem

$z = 'Minipro_dataset-20261010T113831Z-1-002.zip'
$path = Join-Path "C:\Users\Vidhi\Downloads" $z
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
Write-Host "Total entries in $z : $($zip.Entries.Count)"
$zip.Entries | Select-Object -First 100 | ForEach-Object { Write-Host "  $($_.FullName) ($($_.Length) bytes)" }
$zip.Dispose()
