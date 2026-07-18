$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$appDir = Join-Path $projectRoot "app"
$localDeps = Join-Path $env:LOCALAPPDATA "csc-reviewer\node-deps"
$serverBin = Join-Path $localDeps "node_modules\http-server\bin\http-server"

if (-not (Test-Path $appDir)) {
  Write-Host "App folder does not exist: $appDir" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $serverBin)) {
  & (Join-Path $PSScriptRoot "setup-local-deps.ps1")
}

Write-Host "Starting CSC Reviewer at http://127.0.0.1:4173"
node $serverBin $appDir -a 127.0.0.1 -p 4173 -c-1 -o
