$ErrorActionPreference = "Stop"
Write-Host "Downloading OpenJDK 17..."
$url = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse"
$zipFile = "jdk17.zip"

if (-not (Test-Path $zipFile)) {
    Invoke-WebRequest -Uri $url -OutFile $zipFile
} else {
    Write-Host "JDK 17 zip already downloaded."
}

Write-Host "Extracting OpenJDK 17..."
if (-not (Test-Path "jdk17")) {
    New-Item -ItemType Directory -Path "jdk17"
    Expand-Archive -Path $zipFile -DestinationPath "jdk17" -Force
}

$jdkDir = Get-ChildItem -Path "jdk17" | Select-Object -First 1
$Env:JAVA_HOME = $jdkDir.FullName
$Env:PATH = "$Env:JAVA_HOME\bin;" + $Env:PATH
Write-Host "Using JAVA_HOME=$Env:JAVA_HOME"

cd android
Write-Host "Building APK..."
./gradlew assembleRelease

