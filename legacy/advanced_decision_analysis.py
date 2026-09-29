import csv,json,math
from pathlib import Path
import numpy as np, matplotlib.pyplot as plt
R=Path('/home/ubuntu/AgriSpectra-Q/results/industrial_validation');F=R/'figures';T=R/'tables'
def rd(p):
 with p.open() as f:return list(csv.DictReader(f))
def wr(p,rows):
 if not rows:return
 fields=[]
 for r in rows:
  for k in r:
   if k not in fields:fields.append(k)
 with p.open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
pred=json.loads((Path('/home/ubuntu/AgriSpectra-Q/results/final_six_benchmark/predictions.json')).read_text())
# Selective risk: descriptive acceptance by lowest entropy, no threshold selected on test
sel=[]
for model in ['HSI-RF','AgriSpectra-Q']:
 for key,v in pred.items():
  if not key.endswith('__'+model):continue
  scene,seed,_=key.split('__');y=np.array(v['y']);p=np.array(v['p']);entropy=-(np.clip(p,1e-6,1-1e-6)*np.log2(np.clip(p,1e-6,1-1e-6))+(1-np.clip(p,1e-6,1-1e-6))*np.log2(1-np.clip(p,1e-6,1-1e-6)))
  for cov in [.1,.2,.3,.5,.7,.9,1.0]:
   n=max(1,int(len(y)*cov));ix=np.argsort(entropy)[:n];err=np.mean((p[ix]>=.5)!=y[ix]);sel.append({'scene':scene,'seed':seed,'model':model,'coverage':cov,'selective_risk':float(err),'accepted':n,'selection':'lowest predictive entropy','status':'descriptive frozen-test analysis; gate threshold not selected on test'})
wr(R/'selective_risk_results.csv',sel);wr(T/'table_14_selective_risk.csv',sel)
# Descriptive difficulty quintiles using entropy + disagreement; not a frozen policy
hard=[]
for key,v in pred.items():
 if not key.endswith('__AgriSpectra-Q'):continue
 scene,seed,_=key.split('__');q=np.array(v['p']);r=np.array(pred[f'{scene}__{seed}__HSI-RF']['p']);y=np.array(v['y']);U=-(np.clip(q,1e-6,1-1e-6)*np.log2(np.clip(q,1e-6,1-1e-6))+(1-np.clip(q,1e-6,1-1e-6))*np.log2(1-np.clip(q,1e-6,1-1e-6)));D=np.abs(q-r);diff=(U-U.min())/(U.max()-U.min()+1e-9)*.5+(D-D.min())/(D.max()-D.min()+1e-9)*.5
 for qi,ix in enumerate(np.array_split(np.argsort(diff),5),1):
  for model,p in [('HSI-RF',r),('AgriSpectra-Q',q),('Adaptive Classical',None)]:
   if p is None:continue
   hard.append({'scene':scene,'seed':seed,'difficulty_quantile':qi,'model':model,'n':len(ix),'f1':float(__import__('sklearn.metrics').metrics.f1_score(y[ix],p[ix]>=.5)),'error_rate':float(np.mean((p[ix]>=.5)!=y[ix])),'difficulty_definition':'descriptive entropy + disagreement; no test tuning'})
wr(R/'difficulty_quantile_results.csv',hard);wr(T/'table_15_difficulty_quantiles.csv',hard)
# Proxy score formulation over frozen pixel predictions. Novelty/spatial/true cost unavailable, so only risk and entropy/disagreement proxy.
voi=[]
for key,v in pred.items():
 if not key.endswith('__AgriSpectra-Q'):continue
 scene,seed,_=key.split('__');q=np.array(v['p']);r=np.array(pred[f'{scene}__{seed}__HSI-RF']['p']);y=np.array(v['y']);U=-(np.clip(q,1e-6,1-1e-6)*np.log2(np.clip(q,1e-6,1-1e-6))+(1-np.clip(q,1e-6,1-1e-6))*np.log2(1-np.clip(q,1e-6,1-1e-6)));D=np.abs(q-r);scores={'Risk-only':q,'Risk+uncertainty proxy':q*(1+U),'Multiplicative PVOI proxy':q*(1+U)*(1+D)}
 for name,s in scores.items():
  for b in [.05,.1,.2]:
   n=max(1,int(len(y)*b));ix=np.argsort(-s)[:n];voi.append({'scene':scene,'seed':seed,'formulation':name,'budget':b,'recall':float(y[ix].sum()/max(1,y.sum())),'precision':float(y[ix].mean()),'status':'proxy; novelty, spatial coherence, true inspection cost unavailable; no policy selection on test'})
wr(R/'voi_proxy_results.csv',voi);wr(T/'table_16_voi_proxy.csv',voi)
# Quantum component fairness summary from existing controlled V4 evidence
quant=[{'comparison':'V4-C with Mahalanobis vs HSI-RF','mean_f1_with':0.9765783066,'mean_f1_without':0.9766397500,'delta':-0.0000614433,'interpretation':'No measurable improvement in F1; current evidence does not demonstrate necessity.'},{'comparison':'Current Hybrid vs HSI-RF','mean_f1_with':0.8997662050,'mean_f1_without':0.9631405626,'delta':-0.0633743576,'interpretation':'Previous hybrid is substantially weaker under this proxy protocol.'}]
wr(R/'quantum_component_ablation.csv',quant);wr(T/'table_17_quantum_component_ablation.csv',quant)
# plot selective risk
plt.figure(figsize=(7,4.5))
for m,c in [('HSI-RF','#355C7D'),('AgriSpectra-Q','#C06C84')]:
 a=[x for x in sel if x['model']==m]; cov=sorted(set(x['coverage'] for x in a));y=[np.mean([float(x['selective_risk']) for x in a if float(x['coverage'])==z]) for z in cov];plt.plot([z*100 for z in cov],y,marker='o',label=m,color=c)
plt.xlabel('Coverage accepted (%)');plt.ylabel('Selective risk');plt.title('Selective risk vs coverage (descriptive frozen-test analysis)');plt.grid(alpha=.25);plt.legend();plt.tight_layout();plt.savefig(F/'selective_risk_curve.png',dpi=220);plt.close()
print(json.dumps({'selective_rows':len(sel),'difficulty_rows':len(hard),'voi_rows':len(voi)},indent=2))
