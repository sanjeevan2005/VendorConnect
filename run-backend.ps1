$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "apps\api"
$Python = Join-Path $BackendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
  $PythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if (-not $PythonCommand) {
    throw "Python was not found. Install Python 3.12 or create apps\api\.venv manually."
  }

  Set-Location $BackendDir
  & $PythonCommand.Source -m venv .venv
  & $Python -m pip install --upgrade pip
  & $Python -m pip install -r requirements.txt
}

Set-Location $BackendDir

if (-not (Test-Path ".env")) {
  Write-Host "No .env file found. The health endpoint will run, but API-backed workflows need keys from .env.example." -ForegroundColor Yellow
}

& $Python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
