$ErrorActionPreference = "Stop"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host "Java version:"
& "$env:JAVA_HOME\bin\java.exe" -version

$androidDir = "C:\Users\user\.gemini\antigravity-ide\scratch\greca-radio-app\android"
Set-Location $androidDir

Write-Host "Running gradlew assembleDebug..."
& ".\gradlew.bat" assembleDebug

$builtApk = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
$desktopApk = "C:\Users\user\Desktop\greca-radio.apk"

if (Test-Path $builtApk) {
    Write-Host "Copying APK to Desktop ($desktopApk)..."
    Copy-Item -Path $builtApk -Destination $desktopApk -Force
    $fileInfo = Get-Item $desktopApk
    Write-Host "Successfully built and copied APK!"
    Write-Host "File: $($fileInfo.FullName) ($([math]::Round($fileInfo.Length / 1MB, 2)) MB), Last modified: $($fileInfo.LastWriteTime)"
} else {
    Write-Error "Built APK not found at $builtApk"
}
