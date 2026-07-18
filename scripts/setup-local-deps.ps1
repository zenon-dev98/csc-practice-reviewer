$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$workspaceNodeModules = Join-Path $projectRoot "node_modules"
$localDeps = Join-Path $env:LOCALAPPDATA "csc-reviewer\node-deps"
$localPackageJson = Join-Path $localDeps "package.json"

if (Test-Path $workspaceNodeModules) {
  Write-Host "Refusing to continue because node_modules exists in the project folder:" -ForegroundColor Red
  Write-Host $workspaceNodeModules
  Write-Host "Delete that folder first. Dependencies must stay outside Google Drive."
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is required to run the local static server." -ForegroundColor Red
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm is required to install the local static server." -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Force -Path $localDeps | Out-Null

@"
{
  "name": "csc-reviewer-local-deps",
  "private": true,
  "version": "0.1.0",
  "dependencies": {
    "http-server": "^14.1.1"
  }
}
"@ | Set-Content -LiteralPath $localPackageJson -Encoding UTF8

Write-Host "Installing local-only dependencies to $localDeps"
npm install --prefix $localDeps --no-audit --no-fund

Write-Host "Local dependency setup complete."
