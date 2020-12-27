@echo off
for /f %%a in ('wmic os get LocalDateTime ^| find "."') do set DTS=%%a
set TODAY=%DTS:~0,4%%DTS:~4,2%%DTS:~6,2%
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using 7-Zip (https://www.7-zip.org)
cd "%~dp0\bin\x64\Release"
"C:\Program Files\7-Zip\7z.exe" a -tzip %ZIP_NAME% * -mx=7 -xr0!cache -xr0!userdata -xr0!*.log -xr0!VRCX.json -xr0!VRCX.sqlite3
cd "%~dp0"
move "%~dp0\bin\x64\Release\%ZIP_NAME%" "%~dp0"
pause
