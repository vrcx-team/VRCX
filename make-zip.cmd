@echo off
setlocal
set TODAY=%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using bandizip (https://www.bandisoft.com/bandizip)
cd "%~dp0\bin\x64\Release"
bz c -l:9 -r -storeroot:yes -ex:"cache;userdata;*.log;VRCX.json;VRCX.sqlite3" -cmt:"https://github.com/pypy-vrc/VRCX" %ZIP_NAME% *
cd "%~dp0"
move "%~dp0\bin\x64\Release\%ZIP_NAME%" "%~dp0"
pause
