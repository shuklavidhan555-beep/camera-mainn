Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "C:\Users\Vidhi\Downloads\Minipro_dataset-20261010T113831Z-1-002.zip"
$destDir = "d:\system\extracted_datasets\minipro"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$countXml = 0
$countJpg = 0

foreach ($entry in $zip.Entries) {
    # Extract all XML annotations (they are small text files)
    if ($entry.FullName.Contains("Codes/") -and $entry.Name.EndsWith(".xml")) {
        $destPath = Join-Path $destDir $entry.FullName
        $parent = Split-Path $destPath
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
        $countXml++
    }
    # Extract first 30 images to keep size reasonable for web assets
    elseif ($entry.FullName.Contains("Images/") -and $entry.Name.EndsWith(".jpg") -and $countJpg -lt 30) {
        $destPath = Join-Path $destDir $entry.FullName
        $parent = Split-Path $destPath
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
        $countJpg++
    }
}
$zip.Dispose()
Write-Host "Extracted XML annotations: $countXml, Images: $countJpg"
