Add-Type -AssemblyName System.IO.Compression.FileSystem

$zips = @(
    'Minipro_dataset-20261010T113831Z-1-002.zip',
    'NSVAD-main.zip',
    'STGCN_IJCAI-18-master.zip',
    'T-GCN-master.zip',
    'Sentinel-main.zip',
    'A-Large-scale-benchmark-for-traffic-accidents-detection-from-video-surveillance-main.zip',
    'AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main.zip',
    'DCRNN-master.zip',
    'CrashSenseAI-main.zip',
    'Accident-Detection-main.zip',
    'edo_sz.zip'
)

foreach ($z in $zips) {
    Write-Host "================== $z =================="
    $path = Join-Path "C:\Users\Vidhi\Downloads" $z
    if (Test-Path $path) {
        try {
            $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
            $entries = $zip.Entries | Select-Object -ExpandProperty FullName
            Write-Host "Total entries: $($entries.Count)"
            $entries | Select-Object -First 25 | ForEach-Object { Write-Host "  $_" }
            $zip.Dispose()
        } catch {
            Write-Host "Error: $_"
        }
    } else {
        Write-Host "File not found: $path"
    }
}
