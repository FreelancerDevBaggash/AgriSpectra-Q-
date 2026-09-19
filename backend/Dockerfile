FROM python:3.12-slim

# System deps required by rasterio / GDAL
RUN apt-get update && apt-get install -y --no-install-recommends \
        gdal-bin \
        libgdal-dev \
        gcc \
        g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# ── EnMAP scene data ──────────────────────────────────────────────────────────
# The three EnMAP GeoTIFF files (~1.3 GB total) are NOT in the repository.
# They are excluded via .gitignore and must be placed on the server manually.
#
# After deploying this container, copy the files to:
#   /app/data/raw/enmap_three_scenes/scene_01_DT0000205230.TIF
#   /app/data/raw/enmap_three_scenes/scene_02.TIF
#   /app/data/raw/enmap_three_scenes/scene_03.TIF
#
# The engine still starts without them — GET /api/status will report which
# scenes are missing.  Users can always upload their own GeoTIFF via the
# Upload tab regardless of whether the pre-loaded scenes are present.
# See DEPLOYMENT.md for full instructions.
RUN mkdir -p data/raw/enmap_three_scenes results/live_matrix results/uploads

# Railway injects $PORT; fall back to 8765 for local runs
ENV PORT=8765
EXPOSE $PORT

CMD ["sh", "-c", "python api/live_matrix_api.py --host 0.0.0.0 --port ${PORT}"]
