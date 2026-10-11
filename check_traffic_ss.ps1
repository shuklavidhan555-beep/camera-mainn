Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead("d:\system\extracted_datasets\vehicle_tracking\AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main\sample\database\traffic_data.xlsx")
$ssEntry = $zip.GetEntry("xl/sharedStrings.xml")
if ($ssEntry) {
    $stream = $ssEntry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = [xml]$reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    Write-Host "traffic_data shared strings count: $($xml.sst.si.Count)"
    $xml.sst.si | Select-Object -First 20 | ForEach-Object { Write-Host "  $($_.t)" }
}
$zip.Dispose()
