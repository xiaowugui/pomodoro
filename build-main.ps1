$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\zhaoj\Documents\test_projects\Pomodoro"
Write-Host "Rebuilding main process..."
npm run build:main
Write-Host "Done!"
