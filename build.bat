@echo off
setlocal EnableDelayedExpansion
set "PATH=C:\Program Files\nodejs;!PATH!"
echo PATH set to: !PATH!
echo.
echo Building renderer...
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build:renderer
echo.
echo Building main...
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build:main
echo.
echo Builds complete!
pause
