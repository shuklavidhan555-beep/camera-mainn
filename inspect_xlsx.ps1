Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-Xlsx-Sample($xlsxPath) {
    Write-Host "=== Inspecting $xlsxPath ==="
    $zip = [System.IO.Compression.ZipFile]::OpenRead($xlsxPath)
    
    # Read shared strings
    $sharedStrings = @()
    $ssEntry = $zip.GetEntry("xl/sharedStrings.xml")
    if ($ssEntry) {
        $stream = $ssEntry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = [xml]$reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        foreach ($si in $xml.sst.si) {
            if ($si.t) { $sharedStrings += $si.t }
            elseif ($si.r) { 
                $txt = ($si.r | ForEach-Object { $_.t }) -join ""
                $sharedStrings += $txt
            } else {
                $sharedStrings += ""
            }
        }
    }
    
    # Read sheet1
    $sEntry = $zip.GetEntry("xl/worksheets/sheet1.xml")
    if ($sEntry) {
        $stream = $sEntry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = [xml]$reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        $rows = $xml.worksheet.sheetData.row
        Write-Host "Total rows: $($rows.Count)"
        for ($i = 0; $i -lt [Math]::Min(10, $rows.Count); $i++) {
            $row = $rows[$i]
            $vals = @()
            foreach ($c in $row.c) {
                $v = $c.v
                if ($c.t -eq "s") {
                    $v = $sharedStrings[[int]$v]
                }
                $vals += "$($c.r):$v"
            }
            Write-Host "  Row $($i+1): $($vals -join ' | ')"
        }
    }
    $zip.Dispose()
}

$dbDir = "d:\system\extracted_datasets\vehicle_tracking\AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main\sample\database"
Read-Xlsx-Sample (Join-Path $dbDir "traffic_data.xlsx")
Read-Xlsx-Sample (Join-Path $dbDir "vehicle_data.xlsx")
Read-Xlsx-Sample (Join-Path $dbDir "vehicle_data_cmc.xlsx")
