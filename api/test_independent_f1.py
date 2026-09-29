#!/usr/bin/env python3
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from independent_f1 import calculate_f1

# Deterministic unit test of the metric, not a scientific result for a real scene.
model = {"type":"FeatureCollection","features":[
    {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[ [0,0],[1,0],[1,1],[0,1],[0,0] ]]}},
]}
reference = {"type":"FeatureCollection","crs":"EPSG:4326","features":[
    {"type":"Feature","properties":{"reference_label":"anomaly"},"geometry":{"type":"Polygon","coordinates":[[ [0,0],[1,0],[1,1],[0,1],[0,0] ]]}},
    {"type":"Feature","properties":{"reference_label":"normal"},"geometry":{"type":"Polygon","coordinates":[[ [2,0],[3,0],[3,1],[2,1],[2,0] ]]}},
]}
r=calculate_f1(model,reference,0.10)
assert r['status']=='Available', r
assert r['confusion_matrix']=={'tp':1,'tn':1,'fp':0,'fn':0}, r
assert r['f1']==1.0, r
print(json.dumps({'status':'passed','f1':r['f1'],'confusion_matrix':r['confusion_matrix']},indent=2))
