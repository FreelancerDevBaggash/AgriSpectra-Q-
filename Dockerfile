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
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source and the api entrypoint
COPY backend/ ./backend/
COPY api/live_matrix_api.py ./api/live_matrix_api.py

# Railway injects $PORT; fall back to 8765 for local runs
ENV PORT=8765
EXPOSE ${PORT}

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 120 api.live_matrix_api:app"]
