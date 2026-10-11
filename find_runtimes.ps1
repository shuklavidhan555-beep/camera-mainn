$candidates = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "C:\Users\Vidhi\AppData\Local\Programs\node\node.exe",
    "C:\Users\Vidhi\AppData\Roaming\nvm\v*\node.exe",
    "C:\Users\Vidhi\AppData\Local\nvm\v*\node.exe",
    "C:\Users\Vidhi\.nvm\*\node.exe",
    "C:\Users\Vidhi\AppData\Local\Programs\*\node.exe",
    "C:\tools\*\node.exe",
    "C:\nvm\*\node.exe"
)

foreach ($c in $candidates) {
    $found = Get-Item $c -ErrorAction SilentlyContinue
    if ($found) {
        Write-Host "Found node: $($found.FullName)"
    }
}

# Also search Program Files for node or python
Get-ChildItem "C:\Program Files" -Filter "*node*" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "Dir: $($_.FullName)" }
Get-ChildItem "C:\Users\Vidhi\AppData\Local\Programs" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "User Prog: $($_.FullName)" }
Get-ChildItem "C:\Users\Vidhi\AppData\Roaming" -Filter "*npm*" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "Roaming: $($_.FullName)" }
