@echo off
cd ..
dotnet build VRCX-Cef.csproj -p:Configuration=Release -p:Platform=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m --self-contained
mklink /J "%~dp0\..\build\Cef\Release\html" "%~dp0\..\build\html"
pause
