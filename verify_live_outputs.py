#!/usr/bin/env python3
"""
Verification script for live_matrix_engine output integrity.
Checks that GeoJSON coordinates are in WGS84 (lon/lat) range,
raster CRS is preserved, and all expected output files exist.
"""
import json
from pathlib import Path
import rasterio

root = Path('/home/ubuntu/AgriSpectra-Q/results/live_matrix')
# Find the most recent run directory
runs = sorted([p for p in root.iterdir() if p.is_dir()], reverse=True)
if not runs:
    print('No run directories found under', root)
    exit(1)
run_dir = runs[0]
print(f'Verifying: {run_dir.name}\n')

for scene_dir in sorted(p for p in run_dir.iterdir() if p.is_dir()):
    print(f'=== {scene_dir.name} ===')
    stats = json.loads((scene_dir / 'scene_statistics.json').read_text())
    print('bands=', stats['bands'], 'dimensions=', stats['dimensions'], 'crs=', stats['crs'])
    print('risk_exists=', (scene_dir / 'risk_map.tif').exists(), 'priority_exists=', (scene_dir / 'priority_map.tif').exists())
    geo = json.loads((scene_dir / 'zones.geojson').read_text())
    print('geojson_features=', len(geo.get('features', [])), 'has_legacy_crs=', 'crs' in geo)
    vals = []
    for feat in geo.get('features', []):
        p = feat.get('properties', {})
        if 'centroid_lon' in p and 'centroid_lat' in p:
            vals.append((float(p['centroid_lon']), float(p['centroid_lat'])))
        def walk(x):
            if isinstance(x, (list, tuple)):
                if len(x) >= 2 and all(isinstance(v, (int, float)) for v in x[:2]):
                    yield (float(x[0]), float(x[1]))
                else:
                    for y in x:
                        yield from walk(y)
        vals.extend(list(walk(feat.get('geometry', {}).get('coordinates', []))))
    if vals:
        lons = [x for x, y in vals]
        lats = [y for x, y in vals]
        print('lon_range=', min(lons), max(lons))
        print('lat_range=', min(lats), max(lats))
        ok = all(-180 <= x <= 180 and -90 <= y <= 90 for x, y in vals)
        print('coordinates_in_lonlat_range=', ok)
        if not ok:
            print('  *** WARNING: UTM coordinates detected in GeoJSON — reprojection may have failed ***')
    with rasterio.open(scene_dir / 'risk_map.tif') as ds:
        print('risk_crs=', ds.crs, 'risk_bounds=', tuple(round(x, 6) for x in ds.bounds), 'risk_size=', (ds.width, ds.height))
    print('manifest_source=', json.loads((scene_dir / 'manifest.json').read_text())['source'])
    print()

print('VERIFICATION_COMPLETE')
