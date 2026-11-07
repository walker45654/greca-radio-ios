$ErrorActionPreference = "Stop"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host "Java version:"
& "$env:JAVA_HOME\bin\java.exe" -version

$androidDir = "C:\Users\user\.gemini\antigravity-ide\scratch\greca-radio-app\android"
Set-Location $androidDir

Write-Host "Running gradlew bundleRelease..."
& ".\gradlew.bat" bundleRelease

$builtAab = "$androidDir\app\build\outputs\bundle\release\app-release.aab"
$desktopAab = "C:\Users\user\Desktop\greca-release.aab"

if (Test-Path $builtAab) {
    Write-Host "Copying AAB to Desktop ($desktopAab)..."
    Copy-Item -Path $builtAab -Destination $desktopAab -Force
    $fileInfo = Get-Item $desktopAab
    Write-Host "Successfully built and copied signed AAB!"
    Write-Host "File: $($fileInfo.FullName) ($([math]::Round($fileInfo.Length / 1MB, 2)) MB), Last modified: $($fileInfo.LastWriteTime)"
} else {
    Write-Error "Built AAB not found at $builtAab"
}
