@echo off
setlocal enabledelayedexpansion

if not exist "%~dp0\..\build\Cef\html" (
	mklink /J "%~dp0\..\build\Cef\html" "%~dp0\..\build\html"
)