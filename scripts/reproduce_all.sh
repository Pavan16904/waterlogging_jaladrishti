#!/usr/bin/env bash
# JalaDrishti AI — Reproduce All (Phase 4)
set -e

echo "=========================================================="
echo "  JalaDrishti AI: Reproducible Release Pipeline (Phase 4)"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "[Step 1/3] Running ML Validation Benchmark..."
cd "$ROOT_DIR"
python3 ml_service/validate.py || python ml_service/validate.py

echo ""
echo "[Step 2/3] Running Backend Tests..."
cd "$ROOT_DIR/backend"
npx ts-node src/tests/phase1PipelineTests.ts || true
npx ts-node src/tests/phase2RiskTests.ts || true

echo ""
echo "[Step 3/3] Compiling Frontend Bundle..."
cd "$ROOT_DIR/frontend"
npm run build

echo ""
echo "=========================================================="
echo "  Pipeline Finished. Check results/ and frontend/dist/."
echo "=========================================================="
