Param(
  [string]$VenvPath = ".venv",
  [switch]$Upgrade
)

# Get the backend directory (parent of scripts directory)
$BackendDir = Split-Path -Parent $PSScriptRoot
$venvFullPath = Join-Path $BackendDir $VenvPath
$requirementsTxt = Join-Path $BackendDir "requirements.txt"

if (-not (Test-Path $venvFullPath)) {
  Write-Host "Creating venv at $venvFullPath"
  py -3 -m venv $venvFullPath
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create venv"
    exit 1
  }
}

Write-Host "Installing backend dependencies from $requirementsTxt"
$pipArgs = @('-m', 'pip', 'install', '-r', $requirementsTxt)
if ($Upgrade) {
  $pipArgs += '--upgrade'
}
& "$venvFullPath\Scripts\python.exe" @pipArgs
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to install dependencies"
  exit 1
}
Write-Host "Dependencies installation completed successfully"
