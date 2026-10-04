# Sample Input Data — AgriSpectra-Q

This folder contains **small 200×200 px clips** cut from real EnMAP L2A hyperspectral scenes
used in the AgriSpectra-Q proof of concept.

---

## Committed sample files

| File | Scene ID | Location | CRS | Size | Bands | NoData |
|------|----------|----------|-----|------|-------|--------|
| `scene_01_sudan_sample.tif` | DT0000192416 | ad-Damer, River Nile State, Sudan | EPSG:32636 | 200×200 px | 224 | −32768 |
| `scene_03_russia_sample.tif` | DT0000203347 | Kamchatka Krai, Russia | EPSG:32658 | 200×200 px | 224 | −32768 |

Both clips were cut from 100% valid-pixel regions (no NoData within the crop window).
They are representative 6 km × 6 km areas of agricultural/vegetated land.

---

## China scene (not committed — download required)

The China scene (DT0000174684) is not committed due to file size (~430 MB).

| Field | Value |
|-------|-------|
| Scene ID | `ENMAP01-____L2A-DT0000174684_20260109T055050Z_001_V010505_20260110T055831Z` |
| DT ID | DT0000174684 |
| Date | 2026-01-09 |
| Location | Karamay City, Xinjiang, China |
| CRS | EPSG:32645 |
| Dimensions | 1244 × 1210 px |
| Bands | 224 |
| Processing level | L2A (surface reflectance) |
| Licence | ESA EO Terms of Use — free for scientific use |

To download, run:

```bash
python data/sample_input/download_sample.py
```

Or visit [https://planning.enmap.org/](https://planning.enmap.org/) and search for DT0000174684.

---

## How these samples were produced

```python
# Cut with rasterio — 200x200 px at best valid-pixel window
window = rasterio.windows.Window(col_off, row_off, 200, 200)
data   = src.read(window=window)   # all 224 bands
```

Window coordinates used:
- **Sudan**: col_off=200, row_off=50
- **Russia**: col_off=350, row_off=100

---

## Running the engine on a sample

```bash
# Install dependencies
pip install -r requirements.txt

# Run on Sudan sample
python backend/engine/live_matrix_engine.py \
       --scene data/sample_input/scene_01_sudan_sample.tif

# Results appear in results/live_matrix/<run_id>/
```

Pre-computed sample results are in `results/sample_demo/`.
