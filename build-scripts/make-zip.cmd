@echo off
cd ..
setlocal
where /q 7z
IF ERRORLEVEL 1 (
    set ZIP_BIN="C:\Program Files\7-Zip\7z.exe"
) ELSE (
    set ZIP_BIN=7z
)
for /f %%a in ('powershell -Command "Get-Date -format yyyyMMdd"') do set TODAY=%%a
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using 7-Zip (https://www.7-zip.org)
cd "%~dp0\..\build\Cef\Release"
%ZIP_BIN% a -tzip %ZIP_NAME% * -mx=7 -xr0!*.log -xr0!*.pdb
cd "%~dp0"
move "%~dp0\..\build\Cef\Release\%ZIP_NAME%" "%~dp0"
pause
