cd ..

$ErrorActionPreference = "Stop"

$installPath = &"C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe" -version 16.0 -property installationpath
Import-Module (Join-Path $installPath "Common7\Tools\Microsoft.VisualStudio.DevShell.dll")
Enter-VsDevShell -VsInstallPath $installPath -SkipAutomaticLocation

$Date = Get-Date -format yyyyMMdd
$ZipName = "VRCX_" + $Date + ".zip"
$SetupName = "VRCX_" + $Date + "_Setup.exe"

Write-Host "Building .Net..." -ForegroundColor Green
dotnet build Dotnet\VRCX-Cef.csproj -p:Configuration=Release -p:Platform=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m --self-contained

Write-Host "Building Node.js..." -ForegroundColor Green
Remove-Item -Path "node_modules" -Force -Recurse -ErrorAction SilentlyContinue
npm ci --loglevel=error
npm run prod
Remove-Item -Path "build\Cef\html" -Force -Recurse -ErrorAction SilentlyContinue
New-Item -ItemType Junction -Path "build\Cef\html" -Target "html"

Write-Host "Creating Zip..." -ForegroundColor Green
cd "build\Cef"
7z a -tzip $ZipName * -mx=7 -xr0!"*.log" -xr0!"*.pdb"
Move-Item $ZipName ..\..\$ZipName -Force
cd ..\..\

Write-Host "Creating Installer..." -ForegroundColor Green
cd "Installer"
$nsisPath = "C:\Program Files (x86)\NSIS\makensis.exe"
&$nsisPath installer.nsi
Start-Sleep -Seconds 1
Move-Item VRCX_Setup.exe ..\$SetupName -Force
cd ..

Write-Host "Creating SHA256-hash..." -ForegroundColor Green
$hash = Get-FileHash -Path $SetupName -Algorithm SHA256
$hashLine = "$($hash.Hash)  $SetupName"
$hashLine | Out-File -FilePath "SHA256SUMS.txt" -Encoding ASCII

Write-Host "Done!" -ForegroundColor Green