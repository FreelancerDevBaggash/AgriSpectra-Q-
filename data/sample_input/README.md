# AgriSpectra-Q sample inputs

These three GeoTIFF files are 256 × 256 spatial crops of the real EnMAP L2A scenes used by AgriSpectra-Q. Every sample retains all 224 source spectral bands, the original integer data type, NoData value, 30 m georeferencing, and the source CRS.

They are included to satisfy the reviewer quick-start requirement and to let the notebook verify the complete processing path without downloading the full scenes. They are not replacement files for the full-scene benchmark outputs.

Files:

- `scene_01_sudan_sample.tif` — source scene `DT0000192416`, Sudan.
- `scene_02_china_sample.tif` — source scene `DT0000174684`, China.
- `scene_03_russia_sample.tif` — source scene `DT0000203347`, Kamchatka, Russia.

Exact crop windows, checksums, CRS, dimensions, and validity information are in `metadata/`.
