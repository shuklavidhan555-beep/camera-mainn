$archiveDir = "d:\system\_calenzo_archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
}

$calenzoItems = @("server.ps1", "start-calenzo.bat", "data", "public", "README.md")
foreach ($item in $calenzoItems) {
    $src = Join-Path "d:\system" $item
    if (Test-Path $src) {
        $dest = Join-Path $archiveDir $item
        Move-Item -Path $src -Destination $dest -Force
        Write-Host "Archived $item -> _calenzo_archive"
    }
}

# Copy contents of camera_extracted\camera-main-main to d:\system
$camSrc = "d:\system\camera_extracted\camera-main-main"
Get-ChildItem -Path $camSrc -Force | ForEach-Object {
    $target = Join-Path "d:\system" $_.Name
    Move-Item -Path $_.FullName -Destination $target -Force
    Write-Host "Moved $($_.Name) to d:\system"
}

Remove-Item -Path "d:\system\camera_extracted" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Done setting up project root in d:\system"
