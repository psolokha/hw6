#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://127.0.0.1:4000}"

echo "Smoke: GET /api/health"
curl -sf "$BASE_URL/api/health" | grep -q '"ok"'

echo "Smoke: GET /api/categories"
curl -sf "$BASE_URL/api/categories" | grep -q '\['

echo "Smoke: GET /api/locations/search"
curl -sf "$BASE_URL/api/locations/search?q=Rome" | grep -q '\['

echo "All smoke checks passed."
