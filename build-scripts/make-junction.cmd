@echo off
setlocal enabledelayedexpansion

if not exist "%~dp0\..\build\Cef" (
	mkdir "%~dp0\..\build\Cef"
)
if not exist "%~dp0\..\build\html" (
	mkdir "%~dp0\..\build\html"
)
if not exist "%~dp0\..\build\Cef\html" (
	mklink /J "%~dp0\..\build\Cef\html" "%~dp0\..\build\html"
)