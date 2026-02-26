Param(
  [string]$VenvPath = ".venv",
  [string]$HostAddr = "0.0.0.0",
  [int]$Port = 8000,
  [switch]$SkipMigrations
)

# Get the backend directory (parent of scripts directory)
$BackendDir = Split-Path -Parent $PSScriptRoot
$venvFullPath = Join-Path $BackendDir $VenvPath
$requirementsTxt = Join-Path $BackendDir "requirements.txt"
$managePy = Join-Path $BackendDir "manage.py"

if (-not (Test-Path $venvFullPath)) {
  Write-Host "Venv not found. Creating at $venvFullPath..."
  py -3 -m venv $venvFullPath
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create venv"
    exit 1
  }
}

Write-Host "Installing backend dependencies"
& "$venvFullPath\Scripts\python.exe" -m pip install -r $requirementsTxt
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to install dependencies"
  exit 1
}

if (-not $SkipMigrations) {
  Write-Host "Applying migrations"
  & "$venvFullPath\Scripts\python.exe" $managePy migrate
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply migrations"
    exit 1
  }
}

Write-Host "Starting Django development server at http://$HostAddr:$Port"
Write-Host "Press Ctrl+C to stop the server"
& "$venvFullPath\Scripts\python.exe" $managePy runserver "$HostAddr:$Port"
