# =============================================================================
# REFERENCE COPY — DO NOT RUN OR EDIT
# =============================================================================
# This is the original root-level prototype API kept for historical reference.
#
# Active API entry-points:
#   api/demo_api.py        → Railway / hackathon demo (pre-computed results)
#   api/live_matrix_api.py → Docker / gunicorn with pre-loaded TIF scenes
#   api/production_api.py  → VPS upload-only mode
#
# This file has hardcoded paths to /home/ubuntu/ and calls the deprecated
# root-level live_matrix_engine.py. Do not deploy or import this file.
# =============================================================================
from flask import Flask, jsonify, request, send_file
from pathlib import Path
import threading,uuid,subprocess,sys,json
ROOT=Path('/home/ubuntu/AgriSpectra-Q'); OUT=ROOT/'results/live_matrix'; RUNS={}; LOCK=threading.Lock()
app=Flask(__name__)

def run_analysis(scene):
 rid='AGRQ-LIVE-API-'+uuid.uuid4().hex[:8]
 p=subprocess.run([sys.executable,str(ROOT/'live_matrix_engine.py'),'--scene',scene,'--run-id',rid],capture_output=True,text=True)
 path=OUT/rid
 if p.returncode!=0: raise RuntimeError(p.stderr[-2000:])
 with LOCK: RUNS[rid]={'run_id':rid,'scene':scene,'path':str(path),'status':'completed'}
 return RUNS[rid]
@app.get('/')
def home():
 return jsonify({'service':'AgriSpectra-Q Live Matrix API','mode':'LIVE ANALYSIS','benchmark_mode':'FROZEN SCIENTIFIC BENCHMARK is separate','endpoints':['POST /api/analyse','GET /api/runs/<run_id>','GET /api/runs/<run_id>/zones','GET /api/runs/<run_id>/spectral-evidence','GET /api/runs/<run_id>/inspection','GET /api/runs/<run_id>/report']})
@app.post('/api/analyse')
def analyse():
 body=request.get_json(silent=True) or {};scene=body.get('scene','scene_01_DT0000205230')
 allowed={'scene_01_DT0000205230','scene_02','scene_03'}
 if scene not in allowed:return jsonify({'error':'scene must be one of the three server-side EnMAP scenes'}),400
 try:return jsonify(run_analysis(scene))
 except Exception as e:return jsonify({'error':str(e)}),500
@app.get('/api/runs/<rid>')
def result(rid):
 p=OUT/rid/'run_summary.json'
 if not p.exists():return jsonify({'error':'run not found'}),404
 return app.response_class(p.read_text(),mimetype='application/json')
def csv_endpoint(rid,fn):
 p=OUT/rid
 if not p.exists():return jsonify({'error':'run not found'}),404
 # Return all scene files as a JSON index; individual zone files remain machine-readable on disk.
 out=[]
 for d in sorted(x for x in p.iterdir() if x.is_dir()):
  q=d/fn
  if q.exists():out.append({'scene':d.name,'path':str(q),'download':f'/api/runs/{rid}/files/{d.name}/{fn}'})
 return jsonify({'run_id':rid,'live':True,'files':out})
@app.get('/api/runs/<rid>/zones')
def zones(rid):return csv_endpoint(rid,'zones.csv')
@app.get('/api/runs/<rid>/spectral-evidence')
def evidence(rid):return csv_endpoint(rid,'spectral_evidence.csv')
@app.get('/api/runs/<rid>/inspection')
def inspection(rid):return csv_endpoint(rid,'inspection_budget.csv')
@app.get('/api/runs/<rid>/report')
def report(rid):
 p=OUT/rid/'run_summary.json'
 return send_file(p,mimetype='application/json') if p.exists() else (jsonify({'error':'run not found'}),404)
@app.get('/api/runs/<rid>/files/<scene>/<filename>')
def files(rid,scene,filename):
 allowed={'zones.csv','spectral_evidence.csv','inspection_budget.csv','risk_map.tif','priority_map.tif','zones.geojson','scene_statistics.json','metrics.json','manifest.json'}
 if filename not in allowed:return jsonify({'error':'file not allowed'}),400
 p=OUT/rid/scene/filename
 return send_file(p,as_attachment=False) if p.exists() else (jsonify({'error':'file not found'}),404)
if __name__=='__main__':app.run(host='0.0.0.0',port=8765)
