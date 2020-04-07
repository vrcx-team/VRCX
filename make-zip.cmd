@echo off
setlocal
set TODAY=%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using bandizip (https://www.bandisoft.com/bandizip)
bandizip c -l:9 -cmt:"https://github.com/pypy-vrc/VRCX" -ex:"cache;node_modules;src;*.log;*.zip;package.json;package-lock.json;.eslintrc.js;webpack.config.js;VRCX.json;VRCX.sqlite;VRCX_ZIP.cmd" -r %ZIP_NAME% bin/x64/Release/*
pause
