@echo off
msbuild VRCX.sln -p:Configuration=Release -p:Platform=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m
mklink /J "%~dp0\bin\x64\Release\html" "%~dp0\html\dist"
pause
