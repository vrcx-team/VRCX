@echo off
setlocal
cd /d %~dp0
msbuild VRCX.sln -p:Configuration=Release -p:Platform=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m
cd html
call npm ci
call npm run production
cd ..
mklink /J "%~dp0\bin\x64\Release\html" "%~dp0\html\dist"
for /f %%a in ('powershell -Command "Get-Date -format yyyyMMdd"') do set TODAY=%%a
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using bandizip (https://www.bandisoft.com/bandizip)
cd "%~dp0\bin\x64\Release"
bz c -l:9 -r -storeroot:yes -ex:"cache;userdata;*.log;*.json;*.sqlite3;*.pdb;*.config" -cmt:"https://github.com/pypy-vrc/VRCX" %ZIP_NAME% *
cd "%~dp0"
move "%~dp0\bin\x64\Release\%ZIP_NAME%" "%~dp0"
rd "%~dp0\bin\x64\Release\html"
pause
