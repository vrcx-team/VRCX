@echo off
set ZIP_BIN="C:\Program Files\7-Zip\7z.exe"
cd /d %~dp0
msbuild -t:restore -p:RestorePackagesConfig=true
msbuild VRCX.sln /p:Configuration=Release /p:Platform=x64 -m
cd html
call npm ci
call npm run production
cd ..
mklink /J "%~dp0\bin\x64\Release\html" "%~dp0\html\dist"
setlocal
set TODAY=%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using 7-Zip (https://www.7-zip.org)
cd "%~dp0\bin\x64\Release"
%ZIP_BIN% a -tzip %ZIP_NAME% * -mx=7 -xr0!cache -xr0!userdata -xr0!*.log -xr0!VRCX.json -xr0!VRCX.sqlite3
cd "%~dp0"
move "%~dp0\bin\x64\Release\%ZIP_NAME%" "%~dp0"
rd "%~dp0\bin\x64\Release\html"
pause
