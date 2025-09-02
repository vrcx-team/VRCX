@echo off
cd ../../
dotnet build Dotnet\VRCX-Cef.csproj -p:Configuration=Release -p:WarningLevel=0 -p:Platform=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m --self-contained
pause
