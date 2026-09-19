#!/usr/bin/env python3
import csv,json,html,shutil
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
ROOT=Path('/home/ubuntu/AgriSpectra-Q');P=ROOT/'results/industrial_validation';FIG=P/'figures';MAP=P/'maps';DASH=P/'dashboard';FIG.mkdir(exist_ok=True);MAP.mkdir(exist_ok=True);DASH.mkdir(exist_ok=True)
def csvr(p):
 with p.open() as f:return list(csv.DictReader(f))
metrics=csvr(P/'main_metrics.csv');summary=csvr(P/'final_industrial_validation_summary.csv');scene_rows=csvr(ROOT/'results/final_six_benchmark/final_6_model_benchmark.csv')
for r in metrics+scene_rows:
 for k in ['f1','precision','recall','pr_auc','roc_auc','brier','ece','brier_calibrated','ece_calibrated']:
  if k in r:r[k]=float(r[k])
# Figure 1 benchmark
models=['HSI-RF','Spectral XGBoost','48-band XGBoost','Adaptive Classical','Current Hybrid','AgriSpectra-Q']; means={r['model']:float(r['mean_f1']) for r in summary}
plt.figure(figsize=(9,4.8));vals=[means[m] for m in models];cols=['#355C7D']*5+['#C06C84'];plt.bar(models,vals,color=cols);plt.ylabel('Mean F1');plt.title('Six-model benchmark on real EnMAP anomaly proxy');plt.xticks(rotation=25,ha='right');plt.ylim(.86,1.0);plt.grid(axis='y',alpha=.25);plt.tight_layout();plt.savefig(FIG/'six_model_benchmark.png',dpi=220);plt.close()
# Per scene F1
scenes=sorted({r['scene'] for r in scene_rows});x=np.arange(len(scenes));w=.13;plt.figure(figsize=(10,5));
for i,m in enumerate(models):plt.bar(x+(i-2.5)*w,[np.mean([r['f1'] for r in scene_rows if r['scene']==s and r['model']==m]) for s in scenes],w,label=m)
plt.xticks(x,scenes);plt.ylabel('Mean F1');plt.title('Per-scene F1');plt.legend(fontsize=8,ncol=3);plt.grid(axis='y',alpha=.25);plt.tight_layout();plt.savefig(FIG/'per_scene_f1.png',dpi=220);plt.close()
# heatmap
Z=np.array([[np.mean([r['f1'] for r in scene_rows if r['scene']==s and r['model']==m]) for s in scenes] for m in models]);plt.figure(figsize=(7,5));plt.imshow(Z,cmap='viridis',vmin=.8,vmax=1);plt.colorbar(label='F1');plt.xticks(range(3),scenes,rotation=20);plt.yticks(range(6),models);plt.title('F1 heatmap');
for i in range(6):
 for j in range(3):plt.text(j,i,f'{Z[i,j]:.3f}',ha='center',va='center',color='white' if Z[i,j]<.94 else 'black',fontsize=8)
plt.tight_layout();plt.savefig(FIG/'per_scene_heatmap.png',dpi=220);plt.close()
# paired differences from verified bootstrap
b=json.loads((P/'paired_bootstrap_results.json').read_text());d=np.array([x['delta'] for x in b['per_pair_delta']]);plt.figure(figsize=(8,4.5));plt.hist(d,bins=9,color='#6C5B7B',alpha=.85);plt.axvline(0,color='black',ls='--');plt.axvline(b['mean_delta_f1'],color='#F67280',label=f"mean {b['mean_delta_f1']:.4f}");plt.axvspan(b['ci95_low'],b['ci95_high'],color='#F8B195',alpha=.35,label='95% bootstrap CI');plt.xlabel('AgriSpectra-Q − HSI-RF F1');plt.ylabel('Scene-seed pairs');plt.title('Paired differences');plt.legend();plt.tight_layout();plt.savefig(FIG/'paired_bootstrap.png',dpi=220);plt.close()
# reliability curve from frozen predictions
pred=json.loads((ROOT/'results/final_six_benchmark/predictions.json').read_text());plt.figure(figsize=(6,5));
for m,c in [('HSI-RF','#355C7D'),('AgriSpectra-Q','#C06C84')]:
 y=[];p=[]
 for k,v in pred.items():
  if k.endswith('__'+m):y.extend(v['y']);p.extend(v['pc'])
 y=np.array(y);p=np.array(p);bins=np.linspace(0,1,11);xs=[];ys=[]
 for lo,hi in zip(bins[:-1],bins[1:]):
  ix=(p>=lo)&(p<hi)
  if ix.any():xs.append(p[ix].mean());ys.append(y[ix].mean())
 plt.plot(xs,ys,'o-',label=m,color=c)
plt.plot([0,1],[0,1],'k--',alpha=.5);plt.xlabel('Mean predicted anomaly confidence');plt.ylabel('Observed proxy frequency');plt.title('Reliability on frozen test predictions');plt.legend();plt.tight_layout();plt.savefig(FIG/'reliability.png',dpi=220);plt.close()
# routing and inspection copy figures
for f in ['routing_f1_curve.png','inspection_recall_curve.png']:shutil.copy(P/f,FIG/f)
# maps from actual zone operational outputs
for f in sorted((ROOT/'results/adaptive_hybrid/operational').glob('*_zone_risk.csv')):
 rows=csvr(f);z=np.array([int(r['zone']) for r in rows]);rr=z//100000;cc=z%100000;h=int(rr.max()+1);w=int(cc.max()+1);img=np.full((h,w),np.nan);conf=np.full((h,w),np.nan)
 for r in rows:img[int(int(r['zone'])//100000),int(int(r['zone'])%100000)]=float(r['priority_rank']);conf[int(int(r['zone'])//100000),int(int(r['zone'])%100000)]=float(r['confidence'])
 scene=f.name.replace('_zone_risk.csv','');
 for name,a,cmap,title in [('priority_rank',img,'magma','Spectral Crop-Stress / Anomaly Priority Map'),('confidence',conf,'viridis','Operational anomaly-confidence map')]:
  plt.figure(figsize=(8,6));plt.imshow(a,cmap=cmap);plt.colorbar(label=name);plt.title(f'{title}\n{scene} — actual operational zone output');plt.xlabel('32-pixel zone column');plt.ylabel('32-pixel zone row');plt.tight_layout();plt.savefig(MAP/f'{scene}_{name}.png',dpi=180);plt.close()
# architecture diagram via matplotlib
plt.figure(figsize=(13,2.7));plt.axis('off');boxes=[('Real EnMAP L2A','#355C7D'),('Train / validate / freeze','#6C5B7B'),('HSI-RF + spectral features','#F8B195'),('Residual + Mahalanobis gate','#F67280'),('Risk / confidence / priority','#C06C84'),('Targeted human review','#99B898')];x=0.02
for i,(t,c) in enumerate(boxes):plt.text(x,.5,t,ha='left',va='center',color='white',fontsize=11,bbox=dict(boxstyle='round,pad=.7',fc=c,ec='none'));x+=.16
plt.savefig(FIG/'system_architecture.png',dpi=220,bbox_inches='tight');plt.close()
# dashboard data
zones={}
for f in sorted((ROOT/'results/adaptive_hybrid/operational').glob('*_zone_risk.csv')):
 rows=csvr(f);scene=f.name.replace('_zone_risk.csv','');zones[scene]=rows[:30]
DASH.joinpath('data.js').write_text('window.AG_DATA='+json.dumps({'summary':summary,'zones':zones},ensure_ascii=False)+';')
DASH.joinpath('index.html').write_text('''<!doctype html><html><head><meta charset="utf-8"><title>AgriSpectra-Q Decision Intelligence</title><style>body{font-family:Arial;margin:0;background:#f4f7f8;color:#203040}header{background:#16324f;color:white;padding:24px}main{padding:22px;max-width:1200px;margin:auto}.cards{display:flex;gap:12px;flex-wrap:wrap}.card{background:white;border-radius:10px;padding:16px;box-shadow:0 2px 9px #ccd;min-width:180px}.high{color:#b23a48}.monitor{color:#b17819}.abstain{color:#555}table{border-collapse:collapse;width:100%;background:white}td,th{padding:9px;border-bottom:1px solid #ddd;text-align:left}img{max-width:100%;background:white;padding:8px}.note{background:#fff3cd;padding:13px;border-left:4px solid #d39e00}</style></head><body><header><h1>AgriSpectra-Q</h1><p>EO Crop Intelligence & Inspection Prioritisation Platform</p></header><main><div class="note"><b>Evidence status:</b> This prototype uses real EnMAP outputs and a spectral crop-stress/anomaly proxy. It is not a disease-diagnosis dashboard and does not claim field validation.</div><h2>Benchmark overview</h2><div id="cards" class="cards"></div><h2>Decision logic</h2><div class="cards"><div class="card high"><b>HIGH PRIORITY</b><br>Inspect this zone first.</div><div class="card monitor"><b>MONITOR</b><br>Continue EO monitoring and reassess.</div><div class="card abstain"><b>ABSTAIN / HUMAN REVIEW</b><br>Confidence is insufficient for automated action.</div></div><h2>Top operational zones</h2><select id="scene"></select><table><thead><tr><th>Rank</th><th>Zone</th><th>Risk</th><th>Confidence</th><th>Action</th></tr></thead><tbody id="zones"></tbody></table><h2>Actual experiment figures</h2><img src="../figures/six_model_benchmark.png"><img src="../figures/per_scene_f1.png"><img src="../maps/scene_01_DT0000205230_priority_rank.png"><p class="note">Operational zone records come from the existing real-output zone CSVs. Spatial maps are zone-grid priority maps, not field-confirmed disease maps. Temporal persistence is omitted because no validated temporal series is available.</p></main><script src="data.js"></script><script>const d=window.AG_DATA;document.getElementById('cards').innerHTML=d.summary.map(x=>`<div class="card"><b>${x.model}</b><br>Mean F1: ${Number(x.mean_f1).toFixed(4)}<br>PR-AUC: ${Number(x.mean_pr_auc).toFixed(4)}</div>`).join('');let s=document.getElementById('scene');Object.keys(d.zones).forEach(k=>s.add(new Option(k,k)));function render(){let rows=d.zones[s.value]||[];document.getElementById('zones').innerHTML=rows.slice(0,20).map(x=>`<tr><td>${x.priority_rank}</td><td>${x.zone}</td><td>${Number(x.risk).toFixed(2)}</td><td>${Number(x.confidence).toFixed(3)}</td><td class="high">${x.priority==='Critical'?'Inspect this zone first':'Monitor / review'}</td></tr>`).join('')}s.onchange=render;s.value=Object.keys(d.zones)[0];render();</script></body></html>''')
print({'figures':len(list(FIG.glob('*.png'))),'maps':len(list(MAP.glob('*.png'))),'dashboard':str(DASH/'index.html')})
