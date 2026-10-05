from pathlib import Path
import hashlib
import rasterio

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "scene_01_sudan_sample.tif": ("EPSG:32636", "DT0000192416"),
    "scene_02_china_sample.tif": ("EPSG:32645", "DT0000174684"),
    "scene_03_russia_sample.tif": ("EPSG:32658", "DT0000203347"),
}
for filename, (expected_crs, scene_id) in EXPECTED.items():
    path = ROOT / "data" / "sample_input" / filename
    assert path.exists(), f"Missing sample: {path}"
    with rasterio.open(path) as ds:
        assert (ds.width, ds.height) == (256, 256), (filename, ds.shape)
        assert ds.count == 224, (filename, ds.count)
        assert str(ds.crs) == expected_crs, (filename, ds.crs)
        assert ds.nodata == -32768, (filename, ds.nodata)
        assert ds.tags().get("source_scene_id") == scene_id, (filename, ds.tags())
    print(f"OK {filename} sha256={hashlib.sha256(path.read_bytes()).hexdigest()}")
print("All three sample inputs passed validation.")
