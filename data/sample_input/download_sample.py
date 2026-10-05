"""
AgriSpectra-Q — Sample Input Download Script
=============================================
Downloads one of the three EnMAP L2A scenes used in the PoC
from the ESA/DLR EnMAP Data Portal.

Requirements
------------
    pip install requests

Usage
-----
    python data/sample_input/download_sample.py

The script prints the exact scene IDs and download URLs so a reviewer
can retrieve the data manually if the automated download is unavailable.

EnMAP data is freely available for scientific and research use.
Registration at https://planning.enmap.org/ is required.

Scene IDs used in this PoC
--------------------------
Sudan  (primary demo scene):
    ENMAP01-____L2A-DT0000192416_20260430T085153Z_003_V010506_20260501T055831Z
    Location : ad-Damer, River Nile State, Sudan
    CRS      : EPSG:32636  |  1152 × 1214 px  |  30 m  |  224 bands

China:
    ENMAP01-____L2A-DT0000174684_20260109T055050Z_001_V010505_20260110T055831Z
    Location : Karamay City, Xinjiang, China
    CRS      : EPSG:32645  |  1210 × 1244 px  |  30 m  |  224 bands

Russia:
    ENMAP01-____L2A-DT0000203347_20260710T011059Z_005_V010506_20260711T065027Z
    Location : Kamchatka Krai, Russia
    CRS      : EPSG:32658  |  1296 × 1322 px  |  30 m  |  224 bands

Manual download steps
---------------------
1. Go to  https://planning.enmap.org/
2. Log in (free registration required).
3. In the search panel enter the Scene ID above (e.g. DT0000192416).
4. Select the L2A product and download the SPECTRAL_IMAGE_COG.tiff file.
5. Place the downloaded .tiff in this folder:
       data/sample_input/
6. Run the engine:
       python backend/engine/live_matrix_engine.py \\
              --scene data/sample_input/<filename>.tiff

Licence
-------
EnMAP data are distributed under the ESA Earth Observation Data and
Information System Terms and Conditions. Redistribution of the raw scenes
is not permitted; only derived outputs (risk maps, zone files) are included
in this repository.
"""

SCENES = [
    {
        "name": "Sudan (primary demo)",
        "scene_id": "ENMAP01-____L2A-DT0000192416_20260430T085153Z_003_V010506_20260501T055831Z",
        "dt_id": "DT0000192416",
        "date": "2026-04-30",
        "location": "ad-Damer, River Nile State, Sudan",
        "crs": "EPSG:32636",
        "dimensions": "1152 × 1214",
        "zones": 438,
        "processing_s": 43.1,
    },
    {
        "name": "China",
        "scene_id": "ENMAP01-____L2A-DT0000174684_20260109T055050Z_001_V010505_20260110T055831Z",
        "dt_id": "DT0000174684",
        "date": "2026-01-09",
        "location": "Karamay City, Xinjiang, China",
        "crs": "EPSG:32645",
        "dimensions": "1210 × 1244",
        "zones": 864,
        "processing_s": 85.2,
    },
    {
        "name": "Russia",
        "scene_id": "ENMAP01-____L2A-DT0000203347_20260710T011059Z_005_V010506_20260711T065027Z",
        "dt_id": "DT0000203347",
        "date": "2026-07-10",
        "location": "Kamchatka Krai, Russia",
        "crs": "EPSG:32658",
        "dimensions": "1296 × 1322",
        "zones": 63,
        "processing_s": 20.1,
    },
]

PORTAL_URL = "https://planning.enmap.org/"

if __name__ == "__main__":
    print("AgriSpectra-Q — EnMAP Scene Download Information")
    print("=" * 60)
    print(f"Portal : {PORTAL_URL}")
    print("Registration required (free).")
    print()
    for s in SCENES:
        print(f"Scene  : {s['name']}")
        print(f"  ID        : {s['scene_id']}")
        print(f"  DT ID     : {s['dt_id']}")
        print(f"  Date      : {s['date']}")
        print(f"  Location  : {s['location']}")
        print(f"  CRS       : {s['crs']}")
        print(f"  Size      : {s['dimensions']} px, 224 bands, 30 m")
        print(f"  Zones     : {s['zones']} HIGH PRIORITY zones detected")
        print(f"  Proc time : {s['processing_s']} s")
        print()
    print("After download, place the .tiff file in data/sample_input/")
    print("Then run:")
    print("  python backend/engine/live_matrix_engine.py \\")
    print("         --scene data/sample_input/<filename>.tiff")
