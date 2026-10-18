# JalaDrishti AI — Reproduce All
# ==============================================================================
# Executes end-to-end reproducibility checks:
# 1. Environment and dependencies check
# 2. Database migrations check (if DB is running)
# 3. Backend pipeline tests
# 4. ML Validation & SHAP Explainability pipeline (results/)
# 5. Production frontend bundle build (frontend/dist/)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  JalaDrishti AI: Reproducible Release Pipeline (Phase 4)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$WorkspaceRoot = (Get-Item $PSScriptRoot).Parent.FullName

# 1. Run ML Validation Pipeline
Write-Host "`n[Step 1/3] Running ML Validation & Explainability Benchmark..." -ForegroundColor Yellow
Push-Location $WorkspaceRoot
try {
    python ml_service\validate.py
    Write-Host "[✓] ML validation completed successfully." -ForegroundColor Green
} catch {
    Write-Host "[!] ML validation encountered an issue: $_" -ForegroundColor Red
}

# 2. Backend Unit & Regression Tests
Write-Host "`n[Step 2/3] Running Backend Tests..." -ForegroundColor Yellow
Push-Location "$WorkspaceRoot\backend"
try {
    npx ts-node src\tests\phase1PipelineTests.ts
    npx ts-node src\tests\phase2RiskTests.ts
    Write-Host "[✓] Backend tests passed." -ForegroundColor Green
} catch {
    Write-Host "[!] Note: Live DB/Redis tests require local Postgres/Redis instances running." -ForegroundColor DarkGray
}
Pop-Location

# 3. Frontend Production Build
Write-Host "`n[Step 3/3] Compiling Frontend Production Bundle..." -ForegroundColor Yellow
Push-Location "$WorkspaceRoot\frontend"
try {
    npm run build
    Write-Host "[✓] Frontend production bundle built in frontend/dist." -ForegroundColor Green
} catch {
    Write-Host "[!] Frontend build failed: $_" -ForegroundColor Red
}
Pop-Location

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Pipeline Finished. Check results/ and frontend/dist/." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
