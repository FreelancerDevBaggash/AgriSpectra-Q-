# AgriSpectra-Q — Deployment Guide

Two deployment modes are supported. Choose the one that fits your situation.

---

## Mode A — Hackathon Demo  
**"Judges see the full platform with real results — no TIF files needed on the server"**

### How it works
The `demo_api.py` serves pre-computed results from a real engine run stored in  
`results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/` (all three scenes, genuine outputs).  
When a judge clicks "Run Live Analysis", the API returns results in ~0.8s.  
The frontend shows the same Dashboard, zones, maps, and charts as a fresh run.

### What to deploy

| File | Purpose |
|------|---------|
| `api/demo_api.py` | The demo Flask server |
| `results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/` | Pre-computed real results (~14 MB) |
| `backend/requirements.txt` | Python deps (Flask, flask-cors only — no rasterio needed for demo) |

### Storage needed
```
Docker image (python:3.12-slim + flask):   ~200 MB
Pre-computed results:                       ~14 MB
Total:                                     ~215 MB   ← fits in 1 GB free tier
```

### Deploy on Railway (free tier)

**Step 1 — Create a separate Dockerfile for demo:**

```dockerfile
# Dockerfile.demo
FROM python:3.12-slim
WORKDIR /app
RUN pip install flask flask-cors
COPY api/demo_api.py api/
COPY results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9 results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/
ENV PORT=8765
CMD ["sh", "-c", "python api/demo_api.py --host 0.0.0.0 --port ${PORT}"]
```

**Step 2 — Update `railway.json`:**

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.demo"
  },
  "deploy": {
    "startCommand": "python api/demo_api.py --host 0.0.0.0 --port ${PORT}"
  }
}
```

**Step 3 — Set `NEXT_PUBLIC_API_URL` in Vercel** to point to your Railway backend URL.

### Verify

```bash
curl https://your-backend.railway.app/api/status
# Expected: { "mode": "demo", "demo_run_exists": true, "all_scenes_ready": true }
```

The Intelligence page will show:
- Badge: **🟢 DEMO — REAL RESULTS**
- Blue banner: *"Demo mode: These results were computed from real EnMAP GeoTIFF data…"*

---

## Mode B — Production (Upload-Only)  
**"Any user can upload their own GeoTIFF and get real analysis results"**

### How it works
The `production_api.py` accepts any multi-band GeoTIFF upload, runs the live engine,  
and returns real spectral-anomaly results. No pre-loaded scenes required.  
Large raster outputs (`risk_map.tif`, `priority_map.tif`) are deleted after each run  
to keep disk usage minimal.

### What to deploy

| File | Purpose |
|------|---------|
| `api/production_api.py` | The production Flask server |
| `backend/engine/live_matrix_engine.py` | Analysis engine |
| `backend/requirements.txt` | All Python deps (including rasterio + GDAL) |

### Storage per run
```
Uploaded GeoTIFF (temp, deleted after run):   up to 2 GB
Run outputs (CSV + GeoJSON + JSON):           ~1–5 MB per run
Docker image (python + GDAL + rasterio):      ~550 MB
5 recent runs:                                ~25 MB
Total at any given time:                      ~575 MB + upload in flight
```

> **Note:** The upload file is stored only during processing, then deleted.  
> Peak disk = Docker image (~550 MB) + one active upload (up to 2 GB).  
> On a 1 GB free tier, uploads must be < ~450 MB. For larger files, upgrade to a paid plan.

### Deploy on Railway

**Use the existing `Dockerfile` with a modified start command:**

Update `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "python api/production_api.py --host 0.0.0.0 --port ${PORT}"
  }
}
```

### Verify

```bash
curl https://your-backend.railway.app/api/status
# Expected: { "status": "ready", "mode": "upload_only" }
```

The Intelligence page will show:
- Badge: **🔵 UPLOAD-ONLY MODE**
- Blue banner: *"This server does not host pre-loaded scenes. Switch to Upload GeoTIFF tab."*
- Scene selector tab is still visible but scenes show as unavailable

---

## Running Both Modes Locally

```bash
# Demo mode (port 8765)
python api/demo_api.py
# → http://localhost:8765

# Production mode (port 8766, different port for testing)
python api/production_api.py --port 8766
# → http://localhost:8766

# Full live mode with TIF files (original API)
python api/live_matrix_api.py
# → http://localhost:8765
```

---

## Frontend Environment Variable

Set `NEXT_PUBLIC_API_URL` to point to whichever backend you are using:

```bash
# Vercel dashboard → Settings → Environment Variables
NEXT_PUBLIC_API_URL=https://your-demo-backend.railway.app
```

```bash
# Local .env.local
NEXT_PUBLIC_API_URL=http://localhost:8765
```

---

## Summary Table

| | Demo (`demo_api.py`) | Production (`production_api.py`) | Full Live (`live_matrix_api.py`) |
|---|---|---|---|
| **Pre-loaded scenes** | ✅ 3 scenes (pre-computed) | ❌ None | ✅ 3 scenes (need TIF files) |
| **User upload** | ❌ Not needed | ✅ Primary feature | ✅ Supported |
| **TIF files required** | ❌ No | ❌ No | ✅ Yes (~1.3 GB) |
| **Disk needed** | ~215 MB | ~575 MB peak | ~2.3 GB+ |
| **Processing time** | ~0.8s (instant) | Depends on file | ~37–111s |
| **Use case** | Hackathon demo | Production SaaS | Local development |

---

## Files in This Repository

```
✅ In Git (committed)
  api/demo_api.py                          ← Hackathon demo API
  api/production_api.py                    ← Production upload-only API
  api/live_matrix_api.py                   ← Full live API (original)
  backend/engine/live_matrix_engine.py
  results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/   ← Pre-computed demo results
  frontend/                                ← Next.js app

❌ Not in Git (.gitignore)
  data/raw/enmap_three_scenes/*.TIF        ← ~1.3 GB, must be placed manually
  results/live_matrix/**/*.tif             ← Large raster outputs
  frontend/.next/
  frontend/node_modules/
```
