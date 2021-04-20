@echo off
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
rem using bandizip (https://www.bandisoft.com/bandizip)
cd "%~dp0\bin\x64\Release"
bz c -l:9 -r -storeroot:yes -ex:"cache;userdata;*.log;VRCX.json;VRCX.sqlite3" -cmt:"https://github.com/pypy-vrc/VRCX" %ZIP_NAME% *
cd "%~dp0"
move "%~dp0\bin\x64\Release\%ZIP_NAME%" "%~dp0"
rd "%~dp0\bin\x64\Release\html"
pause
