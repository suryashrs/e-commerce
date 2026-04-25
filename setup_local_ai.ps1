# setup_local_ai.ps1
# Setup script for IDM-VTON local execution on Windows

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "       IDM-VTON Local AI Environment Setup             " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Warning: This will download ~20GB of AI models." -ForegroundColor Yellow
Write-Host ""

# 1. Clone Repository
if (-not (Test-Path "IDM-VTON")) {
    Write-Host "[1/5] Cloning IDM-VTON repository..." -ForegroundColor Green
    git clone https://github.com/yisol/IDM-VTON.git
} else {
    Write-Host "[1/5] IDM-VTON folder already exists. Skipping clone." -ForegroundColor Yellow
}

cd IDM-VTON

# 2. Create Virtual Environment
if (-not (Test-Path "venv")) {
    Write-Host "[2/5] Creating Python virtual environment (using Python 3.10)..." -ForegroundColor Green
    py -3.10 -m venv venv
} else {
    Write-Host "[2/5] Virtual environment already exists." -ForegroundColor Yellow
}

# 3. Activate and Install Core Dependencies
Write-Host "[3/5] Installing PyTorch with CUDA support..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

Write-Host "[4/5] Installing Diffusers and IDM-VTON dependencies..." -ForegroundColor Green
# IDM-VTON strictly requires diffusers 0.25.1
pip install diffusers==0.25.1 accelerate transformers gradio opencv-python scipy einops omegaConf pycocotools basicsr pydantic
pip install -r requirements.txt

# 4. Patch the app.py to enable CPU Offloading for GTX 1650 (4GB)
Write-Host "[5/5] Patching application for 4GB VRAM (GTX 1650)..." -ForegroundColor Green
$appPath = "gradio_demo\app.py"
if (Test-Path $appPath) {
    $content = Get-Content $appPath -Raw
    
    # We need to inject 'pipe.enable_model_cpu_offload()' right after the pipeline is loaded
    if ($content -notmatch "enable_model_cpu_offload") {
        # Find where pipe is loaded and insert the offload command
        $content = $content -replace "pipe = TryonPipeline.from_pretrained\(.*?\n", "`$0`n    pipe.enable_model_cpu_offload()`n"
        Set-Content -Path $appPath -Value $content
        Write-Host "-> CPU Offloading enabled for pipeline." -ForegroundColor Green
    } else {
        Write-Host "-> CPU Offloading already enabled." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "                      SETUP COMPLETE                   " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the local server, run these commands:" -ForegroundColor White
Write-Host "1. cd IDM-VTON"
Write-Host "2. .\venv\Scripts\Activate.ps1"
Write-Host "3. python gradio_demo\app.py"
Write-Host ""
Write-Host "NOTE: The first time you run step 3, it will automatically"
Write-Host "download ~20GB of model checkpoints. Let it finish."
Write-Host "When it says 'Running on local URL: http://127.0.0.1:7860',"
Write-Host "your React app will automatically connect to it!" -ForegroundColor Yellow
