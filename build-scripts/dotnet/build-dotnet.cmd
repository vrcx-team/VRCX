@echo off
cd ../../
dotnet build Dotnet\VRCX-Cef.csproj -p:Configuration=Release -p:WarningLevel=0 -p:Platform=x64 -p:PlatformTarget=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m -a x64 --self-contained
pause
