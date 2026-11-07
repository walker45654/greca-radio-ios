$src = 'c:\Users\user\.gemini\antigravity-ide\scratch\greca-radio-app'
$desktop = 'C:\Users\user\Desktop\greca app'
$zipPath = 'C:\Users\user\Desktop\greca-app.zip'

Write-Host "Copying files to www..."
Copy-Item -Path "$src\index.html", "$src\style.css", "$src\app.js", "$src\stations-data.js", "$src\top30_data.json", "$src\server_station_history.json", "$src\manifest.json", "$src\sw.js" -Destination "$src\www" -Force
if (Test-Path "$src\assets") { Copy-Item -Path "$src\assets" -Destination "$src\www" -Recurse -Force }

Write-Host "Copying files to Android assets..."
Copy-Item -Path "$src\index.html", "$src\style.css", "$src\app.js", "$src\stations-data.js", "$src\top30_data.json", "$src\server_station_history.json", "$src\manifest.json", "$src\sw.js" -Destination "$src\android\app\src\main\assets\public" -Force
if (Test-Path "$src\assets") { Copy-Item -Path "$src\assets" -Destination "$src\android\app\src\main\assets\public" -Recurse -Force }
Copy-Item -Path "$src\capacitor.config.json" -Destination "$src\android\app\src\main\assets\capacitor.config.json" -Force

Write-Host "Copying files to iOS public..."
if (Test-Path "$src\ios\App\App\public") {
    Copy-Item -Path "$src\index.html", "$src\style.css", "$src\app.js", "$src\stations-data.js", "$src\top30_data.json", "$src\server_station_history.json", "$src\manifest.json", "$src\sw.js" -Destination "$src\ios\App\App\public" -Force
    if (Test-Path "$src\assets") { Copy-Item -Path "$src\assets" -Destination "$src\ios\App\App\public" -Recurse -Force }
    Copy-Item -Path "$src\capacitor.config.json" -Destination "$src\ios\App\App\capacitor.config.json" -Force
}

Write-Host "Copying files to Desktop folder..."
if (-not (Test-Path $desktop)) { New-Item -ItemType Directory -Path $desktop -Force }
Copy-Item -Path "$src\index.html", "$src\style.css", "$src\app.js", "$src\stations-data.js", "$src\top30_data.json", "$src\server_station_history.json", "$src\manifest.json", "$src\sw.js" -Destination $desktop -Force
if (Test-Path "$src\assets") { Copy-Item -Path "$src\assets" -Destination $desktop -Recurse -Force }

Write-Host "Creating zip package for FASTPANEL..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$desktop\*" -DestinationPath $zipPath -Force

Write-Host "Done!"
Get-Item $zipPath | Select-Object Name, Length, LastWriteTime
