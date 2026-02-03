# Start Pomodoro App in hidden mode
$scriptPath = Join-Path $PSScriptRoot "scripts" "dev.js"

# Start node process without window
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node"
$psi.Arguments = $scriptPath
$psi.WorkingDirectory = $PSScriptRoot
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$psi.CreateNoWindow = $true
$psi.UseShellExecute = $false

$process = [System.Diagnostics.Process]::Start($psi)

# Don't wait, let it run in background
# The app will show its own window
