import csv,json
from pathlib import Path
import numpy as np, matplotlib.pyplot as plt
from sklearn.metrics import f1_score
R=Path('/home/ubuntu/AgriSpectra-Q/results/industrial_validation');F=R/'figures';T=R/'tables';F.mkdir(exist_ok=True);T.mkdir(exist_ok=True)
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
# analytical random inspection baseline: expected recall equals inspected fraction, lift 1
budgets=[.01,.05,.10,.20,.30,.50,1.0]; rows=[]
for b in budgets: rows.append({'method':'Random analytical expectation','budget':b,'recall':b,'precision':'scene prevalence dependent','f1':'not uniquely defined without a draw','lift':1.0,'uncertainty':'analytical unbiased expectation; no random draw needed'})
# existing HSI and Q inspection summaries
for x in rd(R/'inspection_budget_summary.csv'):
 if x['budget'] in [str(b) for b in budgets]: rows.append({'method':x['model'],'budget':float(x['budget']),'recall':float(x['mean_recall']),'precision':float(x['mean_precision']),'f1':float(x['mean_f1']),'lift':'available in inspection_budget_results.csv','uncertainty':'mean over scene-seed frozen outputs'})
# RF->Q routing proxy as decision recall, clearly labeled
for x in rd(R/'routing_summary.csv'):
 if x['routing']=='Q_top_score':rows.append({'method':'RF→Q selective routing proxy','budget':float(x['fraction']),'recall':float(x['mean_recall']),'precision':float(x['mean_precision']),'f1':float(x['mean_f1']),'lift':'not equivalent to inspection lift','uncertainty':'frozen-output routing proxy'})
wr(R/'decision_value_results.csv',rows);wr(T/'table_12_decision_value.csv',rows)
# plot exact requested central figure
plt.figure(figsize=(8,5));
for method,c,marker in [('Random analytical expectation','#777777','o'),('HSI-RF','#355C7D','o'),('AgriSpectra-Q','#C06C84','o'),('RF→Q selective routing proxy','#F8B195','s')]:
 a=[x for x in rows if x['method']==method];a=sorted(a,key=lambda x:x['budget']);
 if method=='Random analytical expectation':x=[z['budget']*100 for z in a];y=[z['recall']*100 for z in a]
 else:x=[z['budget']*100 for z in a];y=[float(z['recall'])*100 for z in a]
 plt.plot(x,y,marker=marker,ls='--' if method.startswith('Random') else '-',label=method,color=c)
plt.xlabel('% Area / pixels inspected');plt.ylabel('% high-risk proxy area captured');plt.title('Decision Value Under Limited Inspection Capacity');plt.grid(alpha=.25);plt.legend();plt.tight_layout();plt.savefig(F/'decision_value_under_limited_inspection.png',dpi=220);plt.close()
# unique value summary from frozen paired groups
errs=rd(R/'error_disagreement_analysis.csv');paired=[x for x in errs if x.get('model')=='paired_disagreement'];
for x in paired:
 for k in ['n_test','RF_correct_Q_wrong','RF_wrong_Q_correct','both_correct','both_wrong']:x[k]=int(x[k])
unique=sum(x['RF_wrong_Q_correct'] for x in paired);reg=sum(x['RF_correct_Q_wrong'] for x in paired);total=sum(x['n_test'] for x in paired)
main=rd(Path('/home/ubuntu/AgriSpectra-Q/results/final_six_benchmark/final_6_model_summary.csv'));get=lambda m,k:next(float(x[k]) for x in main if x['model']==m)
value=[{'metric':'Mean F1','HSI-RF':get('HSI-RF','mean_f1'),'AgriSpectra-Q':get('AgriSpectra-Q','mean_f1'),'RF→Q':'not directly measured'}, {'metric':'Min-scene F1','HSI-RF':get('HSI-RF','min_scene_f1'),'AgriSpectra-Q':get('AgriSpectra-Q','min_scene_f1'),'RF→Q':'not directly measured'}, {'metric':'Recall@5%','HSI-RF':.2448798451,'AgriSpectra-Q':.2448798451,'RF→Q':.2448798451},{'metric':'Recall@10%','HSI-RF':.4919093255,'AgriSpectra-Q':.4919093255,'RF→Q':.4919093255},{'metric':'Recall@20%','HSI-RF':.9232741162,'AgriSpectra-Q':.9222433931,'RF→Q':.9222433931},{'metric':'Unique Q corrections','HSI-RF':'n/a','AgriSpectra-Q':unique,'RF→Q':'same frozen correction pool'},{'metric':'Decision cost 5:1','HSI-RF':'available in cost_sensitive_results.csv','AgriSpectra-Q':'available in cost_sensitive_results.csv','RF→Q':'not separately executed'},{'metric':'Decision cost 10:1','HSI-RF':'available in cost_sensitive_results.csv','AgriSpectra-Q':'available in cost_sensitive_results.csv','RF→Q':'not separately executed'},{'metric':'Decision cost 20:1','HSI-RF':'available in cost_sensitive_results.csv','AgriSpectra-Q':'available in cost_sensitive_results.csv','RF→Q':'not separately executed'},{'metric':'Q evaluations','HSI-RF':0,'AgriSpectra-Q':total,'RF→Q':'routing proxy only'},{'metric':'Inspection efficiency','HSI-RF':'not measured','AgriSpectra-Q':'not measured','RF→Q':'not measured'}]
wr(R/'unique_value_summary.csv',value);wr(T/'table_13_unique_value.csv',value)
print(json.dumps({'unique_Q_corrections':unique,'RF_correct_Q_wrong':reg,'paired_test_pixels':total,'decision_rows':len(rows)},indent=2))
