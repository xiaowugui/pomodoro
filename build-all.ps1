$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\zhaoj\Documents\test_projects\Pomodoro"
Write-Host "Building renderer..."
npm run build:renderer
Write-Host "Building main..."
npm run build:main
Write-Host "Done!"
