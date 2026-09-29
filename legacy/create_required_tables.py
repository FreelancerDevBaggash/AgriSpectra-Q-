import csv,json
from pathlib import Path
import numpy as np
R=Path('/home/ubuntu/AgriSpectra-Q/results/industrial_validation');T=R/'tables';T.mkdir(exist_ok=True)
def rd(p):
 with p.open() as f:return list(csv.DictReader(f))
def wr(name,rows):
 if not rows:return
 fields=[]
 for r in rows:
  for k in r:
   if k not in fields:fields.append(k)
 with (T/name).open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
main=rd(R/'final_industrial_validation_summary.csv');wr('table_01_six_model_benchmark.csv',main)
raw=rd(R/'main_metrics.csv');models=['HSI-RF','Adaptive Classical','AgriSpectra-Q'];scenes=sorted({x['scene'] for x in raw});rows=[]
for s in scenes:
 for m in models:
  a=[x for x in raw if x['scene']==s and x['model']==m];rows.append({'scene':s,'model':m,'f1':np.mean([float(x['f1']) for x in a]),'precision':np.mean([float(x['precision']) for x in a]),'recall':np.mean([float(x['recall']) for x in a]),'pr_auc':np.mean([float(x['pr_auc']) for x in a]),'roc_auc':np.mean([float(x['roc_auc']) for x in a]),'brier':np.mean([float(x['brier_calibrated']) for x in a]),'ece':np.mean([float(x['ece_calibrated']) for x in a])})
wr('table_02_per_scene_results.csv',rows)
b=json.loads((R/'paired_bootstrap_results.json').read_text());wr('table_03_statistical_comparison',[{'mean_delta_f1':b['mean_delta_f1'],'ci95_low':b['ci95_low'],'ci95_high':b['ci95_high'],'replicates':b['replicates'],'n_pairs':b['n_pairs'],'conclusion':'Statistical superiority was not established.'}])
wr('table_04_calibration',rd(R/'calibration_results.csv'));wr('table_05_error_disagreement',rd(R/'error_disagreement_analysis.csv'));wr('table_06_inspection_budget',rd(R/'inspection_budget_results.csv'));wr('table_07_cost_sensitive',rd(R/'cost_sensitive_results.csv'));wr('table_08_selective_routing',rd(R/'routing_results.csv'));wr('table_09_ablation',rd(R/'ablation_results.csv'));wr('table_10_industrial_decision_matrix',[{'dimension':'Detection','HSI-RF':'Strongest ranking metrics','Adaptive Classical':'Competitive','AgriSpectra-Q':'Highest numerical mean F1, not significant'},{'dimension':'Calibration','HSI-RF':'Strong','Adaptive Classical':'Best measured','AgriSpectra-Q':'Slightly weaker'},{'dimension':'Robustness','HSI-RF':'NOT VALIDATED','Adaptive Classical':'NOT VALIDATED','AgriSpectra-Q':'NOT VALIDATED'},{'dimension':'Operational value','HSI-RF':'Pixel proxy','Adaptive Classical':'Pixel proxy','AgriSpectra-Q':'Pixel proxy; no field evidence'}]);wr('table_11_limitations_roadmap',[{'phase':'1','limitation':'No external blind geography','next_step':'Blind fourth EnMAP scene'},{'phase':'2','limitation':'No field-confirmed labels','next_step':'Field validation'},{'phase':'3','limitation':'No validated temporal persistence','next_step':'Multi-date EO'},{'phase':'4','limitation':'No cost logs','next_step':'Operational pilot'},{'phase':'5','limitation':'No ROI','next_step':'Customer validation'}])
