#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

cd "$PSScriptRoot/.."

$root = Resolve-Path .

$Date = Get-Date -format yyyyMMdd
$ZipName = "VRCX_" + $Date + ".zip"
$SetupName = "VRCX_" + $Date + "_Setup.exe"

Write-Host "Building .Net..." -ForegroundColor Green

if ($IsWindows) {
    dotnet build Dotnet\VRCX-Cef.csproj -p:Configuration=Release -p:WarningLevel=0 -p:Platform=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m --self-contained
}

if ($IsLinux -or $IsMacOS) {
    dotnet build 'Dotnet/VRCX-Electron.csproj' -p:Configuration=Release -p:WarningLevel=0 -p:Platform=x64 -p:PlatformTarget=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m -a x64

    # dotnet build 'Dotnet/VRCX-Electron-arm64.csproj' -p:Configuration=Release -p:WarningLevel=0 -p:Platform=arm64 -p:PlatformTarget=arm64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m -a arm64
}

Write-Host "Building Node.js..." -ForegroundColor Green
Remove-Item -Path "node_modules" -Force -Recurse -ErrorAction SilentlyContinue
npm ci --loglevel=error
$ErrorActionPreference = "Continue"


if ($IsWindows) {
    npm run prod
}
if ($IsLinux) {
    npm run prod-linux
    # npm run prod-linux --arch=arm64

    npm run build-electron
    # npm run build-electron-arm64
} 
if ($IsMacOS) {
    npm run prod-linux --arch=x64
    # npm run prod-linux --arch=arm64

    npm run build-electron
    # npm run build-electron-arm64
}


if ($IsWindows) {
    $ErrorActionPreference = "Stop"
    Remove-Item -Path "build\Cef\html" -Force -Recurse -ErrorAction SilentlyContinue
    New-Item -ItemType Junction -Path "$root\build\Cef\html" -Target "$root\build\html"

    Write-Host "Creating Zip..." -ForegroundColor Green
    cd "build\Cef"
    7z a -tzip $ZipName * -mx=7 -xr0!"*.log" -xr0!"*.pdb"
    Move-Item $ZipName ..\..\$ZipName -Force
    cd ..\..\

    Write-Host "Creating Installer..." -ForegroundColor Green
    $version = Get-Content -Path "Version" -Raw
    cd "Installer"
    Out-File -FilePath "version_define.nsh" -Encoding UTF8 -InputObject "!define PRODUCT_VERSION_FROM_FILE `"$version.0`""
    $nsisPath = "C:\Program Files (x86)\NSIS\makensis.exe"
    &$nsisPath installer.nsi
    Start-Sleep -Seconds 1
    Move-Item VRCX_Setup.exe ..\$SetupName -Force
    cd ..

    Write-Host "Creating SHA256-hash..." -ForegroundColor Green
    $hash = Get-FileHash -Path $SetupName -Algorithm SHA256
    $hashLine = "$($hash.Hash)  $SetupName"
    $hashLine | Out-File -FilePath "SHA256SUMS.txt" -Encoding ASCII
}

Write-Host "Done!" -ForegroundColor Green
