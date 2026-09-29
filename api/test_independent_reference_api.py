#!/usr/bin/env python3
import json
import sys
from pathlib import Path

# Resolve project root (api/ is one level below root)
PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT / "api"))
import live_matrix_api

client = live_matrix_api.app.test_client()
checks = [
    ('AGRQ-LIVE-API-b4e377b4', 'upload_738ccb03', 'landsat_quality_masked', 'Available'),
    ('AGRQ-LIVE-API-b4e377b4', 'upload_738ccb03', 'sentinel2_timeseries', 'Not Available'),
    ('AGRQ-LIVE-API-43a4e95f', 'upload_ce3a2cf2', 'sentinel2_timeseries', 'Available'),
    ('AGRQ-LIVE-API-43a4e95f', 'upload_ce3a2cf2', 'landsat_quality_masked', 'Not Available'),
]
for run_id, scene, ref_id, expected in checks:
    catalog = client.get(f'/api/runs/{run_id}/independent-references?scene={scene}')
    assert catalog.status_code == 200, catalog.data
    refs = catalog.get_json()['references']
    assert len(refs) == 4, refs
    response = client.get(f'/api/runs/{run_id}/independent-references/{ref_id}?scene={scene}')
    assert response.status_code == 200, response.data
    payload = response.get_json()
    assert payload['status'] == expected, payload
    if expected == 'Available':
        assert 'result' in payload and payload['result'], payload
print(json.dumps({'status':'passed','checks':len(checks),'catalog_size':4}, indent=2))
