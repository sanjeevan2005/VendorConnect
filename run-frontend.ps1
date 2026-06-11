$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeDir = Join-Path $Root ".tools\node"
$FrontendDir = Join-Path $Root "apps\web"

if (Test-Path (Join-Path $NodeDir "npm.cmd")) {
  $env:Path = "$NodeDir;$env:Path"
  $Npm = Join-Path $NodeDir "npm.cmd"
} else {
  $NpmCommand = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $NpmCommand) {
    throw "npm was not found. Install Node.js 24 LTS or restore the optional .tools\node runtime."
  }
  $Npm = $NpmCommand.Source
}

Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
  & $Npm ci
}

& $Npm run dev -- --hostname 127.0.0.1 --port 3000
