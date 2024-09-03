@echo off
cd ..
setlocal
for /f %%a in ('powershell -Command "Get-Date -format yyyyMMdd"') do set TODAY=%%a
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using bandizip (https://www.bandisoft.com/bandizip)
cd "%~dp0\..\bin\x64\Release"
bz c -l:9 -r -storeroot:yes -ex:"*.log;*.pdb" -cmt:"https://github.com/vrcx-team/VRCX" %ZIP_NAME% *
cd "%~dp0"
move "%~dp0\..\bin\x64\Release\%ZIP_NAME%" "%~dp0"
pause
