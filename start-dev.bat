@echo off
if "%1"=="hide" goto main
start /min cmd /c "%~f0" hide %*
exit

:main
cd /d "%~dp0"
node scripts/dev.js
