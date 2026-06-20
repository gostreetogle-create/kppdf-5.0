#Requires -Version 5.1
param(
    [string]$ProjectPath = (Get-Location).Path
)

$ErrorActionPreference = 'Continue'
$OLLAMA_DEFAULT_URL = 'http://localhost:11434'
$WEBUI_PORT = 3000
$WEBUI_CONTAINER_NAME = 'open-webui'
$MODEL_NAME = 'qwen2.5-coder:32b'

function Write-Step { param([string]$msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$msg) Write-Host "  [ERR] $msg" -ForegroundColor Red }
function Write-Info { param([string]$msg) Write-Host "  [i] $msg" -ForegroundColor Gray }

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host "  DEPLOY-AGENT: Local AI Agent Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Info "Project: $ProjectPath"

# --- Execution Policy ---
$currentPolicy = Get-ExecutionPolicy
if ($currentPolicy -eq 'Restricted') {
    Write-Warn "ExecutionPolicy=Restricted. Setting Bypass for this session..."
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
    Write-OK "ExecutionPolicy set to Bypass (process scope)"
}

# --- Phase 1: Ollama ---
Write-Step "1/7 Checking Ollama"

$ollamaPath = $null
$candidates = @(
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "$env:LOCALAPPDATA\Ollama\ollama.exe",
    "C:\Program Files\Ollama\ollama.exe",
    "$env:ProgramFiles\Ollama\ollama.exe"
)
foreach ($p in $candidates) {
    if (Test-Path $p) { $ollamaPath = $p; break }
}
if (-not $ollamaPath) {
    $cmd = Get-Command ollama -ErrorAction SilentlyContinue
    if ($cmd) { $ollamaPath = $cmd.Source }
}

if (-not $ollamaPath) {
    Write-Warn "Ollama not found. Downloading installer..."
    $url = 'https://ollama.com/download/OllamaSetup.exe'
    $dest = "$env:TEMP\OllamaSetup.exe"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
        Write-OK "Installer downloaded. Installing silently..."
        Start-Process -FilePath $dest -ArgumentList '/VERYSILENT','/NORESTART' -Wait -NoNewWindow
        Write-OK "Ollama installed"
        foreach ($p in $candidates) { if (Test-Path $p) { $ollamaPath = $p; break } }
        if (-not $ollamaPath) { $cmd = Get-Command ollama -ErrorAction SilentlyContinue; if ($cmd) { $ollamaPath = $cmd.Source } }
    } catch {
        Write-Err "Failed to install Ollama: $($_.Exception.Message)"
        Write-Info "Download manually: https://ollama.com/download"
        exit 1
    }
}
Write-OK "Ollama found: $ollamaPath"

# Check if running
$ollamaRunning = $false
try {
    $r = Invoke-WebRequest -Uri "$OLLAMA_DEFAULT_URL/api/tags" -UseBasicParsing -TimeoutSec 3
    $ollamaRunning = $true
    Write-OK "Ollama is already running"
} catch {}

if (-not $ollamaRunning) {
    Write-Warn "Ollama not responding. Starting..."
    $svc = Get-Service -Name 'Ollama' -ErrorAction SilentlyContinue
    if ($svc) {
        if ($svc.Status -ne 'Running') { Start-Service 'Ollama' -ErrorAction SilentlyContinue }
        Write-OK "Ollama service started"
    } else {
        Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WindowStyle Hidden
        Write-OK "Ollama process started"
    }
    Start-Sleep -Seconds 5
    $retries = 0
    while ($retries -lt 10) {
        try {
            Invoke-WebRequest -Uri "$OLLAMA_DEFAULT_URL/api/tags" -UseBasicParsing -TimeoutSec 3 | Out-Null
            $ollamaRunning = $true; break
        } catch { $retries++; Start-Sleep -Seconds 2 }
    }
    if (-not $ollamaRunning) { Write-Err "Ollama failed to start after 20s"; exit 1 }
    Write-OK "Ollama is running at $OLLAMA_DEFAULT_URL"
}

# --- Phase 2: Model ---
Write-Step "2/7 Downloading model $MODEL_NAME"

$existingModels = & $ollamaPath list 2>$null
$modelReady = $false
foreach ($line in $existingModels) { if ($line -match $MODEL_NAME) { $modelReady = $true; break } }

if ($modelReady) {
    Write-OK "Model $MODEL_NAME already downloaded"
} else {
    Write-Info "Downloading model (may take 5-15 min)..."
    $pullProc = Start-Process -FilePath $ollamaPath -ArgumentList "pull",$MODEL_NAME -NoNewWindow -PassThru -Wait
    if ($pullProc.ExitCode -ne 0) {
        Write-Warn "32B model failed. Trying 14B..."
        $script:MODEL_NAME = 'qwen2.5-coder:14b'
        & $ollamaPath pull $script:MODEL_NAME
    }
    Write-OK "Model ready: $MODEL_NAME"
}

# --- Phase 3: Docker ---
Write-Step "3/7 Checking Docker"

$dockerAvailable = $false
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    try {
        & docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $dockerAvailable = $true }
    } catch {}
}

if (-not $dockerAvailable) {
    Write-Warn "Docker not found. Installing Docker Desktop..."
    $dUrl = 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'
    $dDest = "$env:TEMP\DockerDesktopInstaller.exe"
    try {
        Write-Info "Downloading Docker Desktop..."
        Invoke-WebRequest -Uri $dUrl -OutFile $dDest -UseBasicParsing
        Write-OK "Installer downloaded. Installing..."
        Start-Process -FilePath $dDest -ArgumentList 'install','--quiet','--accept-license','--backend=wsl-2' -Wait -NoNewWindow
        Write-Warn "Docker installed. A reboot may be required."
        Write-Info "After reboot, run this script again."
        Start-Process 'com.docker.backend' -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 10
    } catch {
        Write-Err "Docker install failed: $($_.Exception.Message)"
        Write-Info "Install Docker Desktop manually: https://docker.com/products/docker-desktop"
        $cfg = @{ ProjectPath=$ProjectPath; ModelName=$MODEL_NAME; OllamaUrl=$OLLAMA_DEFAULT_URL; WebuiPort=$WEBUI_PORT; NeedsDocker=$true }
        $cfg | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'agent-config.json') -Encoding UTF8
        exit 0
    }
}
Write-OK "Docker is available"

# --- Phase 4: Open WebUI ---
Write-Step "4/7 Setting up Open WebUI"

$existing = & docker ps -a --filter "name=$WEBUI_CONTAINER_NAME" --format '{{.Names}}' 2>$null
if ($existing -eq $WEBUI_CONTAINER_NAME) {
    $status = & docker ps --filter "name=$WEBUI_CONTAINER_NAME" --format '{{.Status}}' 2>$null
    if ($status -match 'Up') {
        Write-OK "Open WebUI already running on port $WEBUI_PORT"
    } else {
        & docker start $WEBUI_CONTAINER_NAME
        Write-OK "Existing container started"
    }
} else {
    Write-Info "Creating Open WebUI container..."
    & docker run -d `
        --name $WEBUI_CONTAINER_NAME `
        --restart always `
        -p "${WEBUI_PORT}:8080" `
        -e "OLLAMA_BASE_URL=http://host.docker.internal:11434" `
        -e "WEBUI_SECRET_KEY=$(New-Guid)" `
        -v "open-webui:/app/backend/data" `
        -v "${ProjectPath}:/project" `
        ghcr.io/open-webui/open-webui:main

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to create container!"
        exit 1
    }
    Write-OK "Container created and started"
    Write-Info "Waiting for Open WebUI initialization (15s)..."
    Start-Sleep -Seconds 15
}

# --- Phase 5: Autostart ---
Write-Step "5/7 Configuring autostart"

$taskName = 'Ollama-AutoStart'
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existingTask) {
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-WindowStyle Hidden -Command `"Start-Process '$ollamaPath' -ArgumentList 'serve' -WindowStyle Hidden`""
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 0)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Ollama autostart' -Force | Out-Null
    Write-OK "Ollama autostart configured (Scheduled Task)"
} else {
    Write-OK "Ollama autostart already configured"
}

# --- Phase 6: Desktop Shortcut ---
Write-Step "6/7 Creating desktop shortcut"

$desktopPath = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath 'AI Agent.lnk'
$shell = New-Object -ComObject WScript.Shell
$sc = $shell.CreateShortcut($shortcutPath)
$sc.TargetPath = "http://localhost:$WEBUI_PORT"
$sc.Description = 'Local AI Agent (Open WebUI)'
$sc.WorkingDirectory = $desktopPath
$edge = Get-Command msedge -ErrorAction SilentlyContinue
if (-not $edge) { $edge = Get-Command chrome -ErrorAction SilentlyContinue }
if ($edge) { $sc.IconLocation = "$($edge.Source),0" }
$sc.Save()
Write-OK "Shortcut created: $shortcutPath"

# --- Phase 7: Config ---
Write-Step "7/7 Saving configuration"

$cfgPath = Join-Path $PSScriptRoot 'agent-config.json'
@{
    ProjectPath = $ProjectPath
    ModelName = $MODEL_NAME
    OllamaUrl = $OLLAMA_DEFAULT_URL
    WebuiPort = $WEBUI_PORT
    InstalledAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
} | ConvertTo-Json | Set-Content $cfgPath -Encoding UTF8
Write-OK "Config saved: $cfgPath"

# --- Final ---
Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host "  AGENT READY!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Open WebUI:  http://localhost:$WEBUI_PORT" -ForegroundColor Green
Write-Host "  Ollama API:  $OLLAMA_DEFAULT_URL" -ForegroundColor Green
Write-Host "  Model:       $MODEL_NAME" -ForegroundColor Green
Write-Host "  Project:     $ProjectPath" -ForegroundColor Green
Write-Host "  Shortcut:    $shortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "  How to use:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:$WEBUI_PORT in browser" -ForegroundColor Gray
Write-Host "  2. Create account (first visit = registration)" -ForegroundColor Gray
Write-Host "  3. Select model $MODEL_NAME in chat settings" -ForegroundColor Gray
Write-Host "  4. Start chatting - agent has access to /project files" -ForegroundColor Gray
Write-Host ""
Write-Host "  Autostart:" -ForegroundColor Yellow
Write-Host "  - Ollama: runs at Windows login (Scheduled Task)" -ForegroundColor Gray
Write-Host "  - Docker + Open WebUI: auto-restart (restart=always)" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host "  Press any key to open the interface..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
Start-Process "http://localhost:$WEBUI_PORT"
