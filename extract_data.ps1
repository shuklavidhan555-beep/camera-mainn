Add-Type -AssemblyName System.IO.Compression.FileSystem

$outDir = "d:\system\extracted_datasets"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

function Extract-Zip-Subdir($zipName, $destFolder) {
    $zipPath = "C:\Users\Vidhi\Downloads\$zipName"
    if (-not (Test-Path $zipPath)) {
        Write-Host "Missing: $zipPath"
        return
    }
    $target = Join-Path $outDir $destFolder
    if (-not (Test-Path $target)) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
    }
    Write-Host "Extracting $zipName -> $destFolder ..."
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    foreach ($entry in $zip.Entries) {
        # Skip very large model weights (> 50MB) if any
        if ($entry.Length -gt 50MB -and ($entry.Name.EndsWith('.pt') -or $entry.Name.EndsWith('.index') -or $entry.Name.EndsWith('.data-00000-of-00001'))) {
            Write-Host "Skipping large model file: $($entry.FullName)"
            continue
        }
        $destPath = Join-Path $target $entry.FullName
        $parent = Split-Path $destPath
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        if (-not $entry.FullName.EndsWith('/')) {
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
        }
    }
    $zip.Dispose()
    Write-Host "Done $zipName"
}

# Extract the key datasets
Extract-Zip-Subdir "STGCN_IJCAI-18-master.zip" "stgcn"
Extract-Zip-Subdir "T-GCN-master.zip" "tgcn"
Extract-Zip-Subdir "DCRNN-master.zip" "dcrnn"
Extract-Zip-Subdir "Accident-Detection-main.zip" "accident_detection"
Extract-Zip-Subdir "Sentinel-main.zip" "sentinel"
Extract-Zip-Subdir "CrashSenseAI-main.zip" "crash_sense"
Extract-Zip-Subdir "AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main.zip" "vehicle_tracking"
