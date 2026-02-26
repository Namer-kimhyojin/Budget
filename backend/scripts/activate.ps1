Param(
  [string]$VenvPath = ".venv"
)

# Get the backend directory (parent of scripts directory)
$BackendDir = Split-Path -Parent $PSScriptRoot
$venvFullPath = Join-Path $BackendDir $VenvPath

if (-not (Test-Path $venvFullPath)) {
  Write-Host "Venv not found at $venvFullPath. Creating..."
  py -3 -m venv $venvFullPath
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create venv"
    exit 1
  }
}

if (-not (Test-Path "$venvFullPath\Scripts\Activate.ps1")) {
  Write-Error "Activate.ps1 not found in venv"
  exit 1
}

Write-Host "Activating venv at $venvFullPath"
& "$venvFullPath\Scripts\Activate.ps1"
