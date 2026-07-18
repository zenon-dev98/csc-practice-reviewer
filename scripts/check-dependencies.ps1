$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$localDeps = Join-Path $env:LOCALAPPDATA "csc-reviewer\node-deps"
$workspaceNodeModules = Join-Path $projectRoot "node_modules"

Write-Host "Project: $projectRoot"
Write-Host "Local dependency folder: $localDeps"

if (Test-Path $workspaceNodeModules) {
  Write-Host "Problem: node_modules exists inside the project folder." -ForegroundColor Red
  Write-Host "Remove it before running setup. Dependencies must stay outside Google Drive."
  exit 1
}

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if (-not $node) {
  Write-Host "Node.js is not installed or not on PATH." -ForegroundColor Red
  exit 1
}

if (-not $npm) {
  Write-Host "npm is not installed or not on PATH." -ForegroundColor Red
  exit 1
}

Write-Host "Node: $((node --version))"
Write-Host "npm: $((npm --version))"

$serverBin = Join-Path $localDeps "node_modules\http-server\bin\http-server"
if (Test-Path $serverBin) {
  Write-Host "Local static server dependency is installed."
} else {
  Write-Host "Local static server dependency is not installed. Run npm run setup."
}

Write-Host "Dependency check complete."
