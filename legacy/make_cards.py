import csv,json
from pathlib import Path
R=Path('/home/ubuntu/AgriSpectra-Q/results/industrial_validation');
with (R/'error_disagreement_analysis.csv').open() as f:r=list(csv.DictReader(f))
p=[x for x in r if x.get('model')=='paired_disagreement']
for x in p:
 for k in ['n_test','RF_correct_Q_wrong','RF_wrong_Q_correct','both_correct','both_wrong']:x[k]=int(x[k])
from collections import defaultdict
d=defaultdict(lambda:[0,0,0])
for x in p:d[x['scene']][0]+=x['RF_wrong_Q_correct'];d[x['scene']][1]+=x['RF_correct_Q_wrong'];d[x['scene']][2]+=x['n_test']
rows=[]
for scene,(uq,rq,n) in d.items():rows.append({'scene':scene,'unique_Q_corrections':uq,'RF_correct_Q_wrong':rq,'unique_rate':uq/n,'regression_rate':rq/n,'interpretation':'Q has more unique corrections' if uq>rq else 'RF has more corrections or tie'})
with (R/'unique_corrections_by_scene.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
# cards from actual zone outputs
op=Path('/home/ubuntu/AgriSpectra-Q/results/adaptive_hybrid/operational');cards=[]
for f in sorted(op.glob('*_zone_risk.csv')):
 with f.open() as h:rr=list(csv.DictReader(h))
 for x in rr[:3]:cards.append({'scene':f.name.replace('_zone_risk.csv',''),'zone':x['zone'],'priority_rank':x['priority_rank'],'risk':x['risk'],'confidence':x['confidence'],'n_pixels':x['n_pixels'],'priority':x['priority'],'recommended_action':'Inspect this high-priority spectral crop-stress/anomaly candidate first.'})
with (R/'decision_cards.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=cards[0].keys());w.writeheader();w.writerows(cards)
print(json.dumps(rows,indent=2))
