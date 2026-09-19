#!/usr/bin/env python3
import argparse,csv,json,time,uuid
from pathlib import Path
import numpy as np
import rasterio
from rasterio.features import shapes
from rasterio.transform import xy
from scipy import ndimage

ROOT=Path('/home/ubuntu/AgriSpectra-Q'); RAW=ROOT/'data/raw/enmap_three_scenes'; OUT=ROOT/'results/live_matrix'
SCENES={'scene_01_DT0000205230':RAW/'scene_01_DT0000205230.TIF','scene_02':RAW/'scene_02.TIF','scene_03':RAW/'scene_03.TIF'}
BANDS=np.linspace(0,223,32,dtype=int)

def csvwrite(p,rows):
 p.parent.mkdir(parents=True,exist_ok=True)
 if not rows:return
 keys=[]
 for r in rows:
  for k in r:
   if k not in keys:keys.append(k)
 with p.open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)

def process(name,path,run):
 t0=time.perf_counter(); od=run/name;od.mkdir(parents=True,exist_ok=True)
 with rasterio.open(path) as ds:
  H,W,C=ds.height,ds.width,ds.count; nodata=ds.nodata; transform=ds.transform; crs=str(ds.crs)
  # Streaming mean/variance over 32 actual spectral bands; no test labels or synthetic data.
  n=0; mean=np.zeros(len(BANDS),float); M2=np.zeros(len(BANDS),float)
  valid_count=0; total=H*W
  for _,win in ds.block_windows(1):
   a=ds.read(indexes=(BANDS+1).tolist(),window=win).astype('float32')
   ok=np.all(np.isfinite(a),axis=0) & (a[0]!=nodata if nodata is not None else np.ones(a.shape[1:],bool))
   x=a[:,ok].T
   valid_count+=x.shape[0]
   if len(x):
    nb=len(x); d=x.mean(0)-mean; n2=n+nb; mean += d*nb/n2; M2 += ((x-mean)**2).sum(0)+(d**2)*n*nb/n2; n=n2
  std=np.sqrt(np.maximum(M2/max(n-1,1),1e-6))
  risk=np.full((H,W),np.nan,np.float32); valid=np.zeros((H,W),bool)
  # Second streaming pass: RMS standardized spectral deviation.
  for _,win in ds.block_windows(1):
   a=ds.read(indexes=(BANDS+1).tolist(),window=win).astype('float32')
   ok=np.all(np.isfinite(a),axis=0) & (a[0]!=nodata if nodata is not None else np.ones(a.shape[1:],bool))
   z=np.sqrt(np.mean(((a-mean[:,None,None])/std[:,None,None])**2,axis=0))
   rr,cc=int(win.row_off),int(win.col_off);h,w=z.shape
   risk[rr:rr+h,cc:cc+w][ok]=z[ok]; valid[rr:rr+h,cc:cc+w]=ok
  vals=risk[valid]; q95=float(np.quantile(vals,.95));q80=float(np.quantile(vals,.80));q50=float(np.quantile(vals,.50))
  # Relative operational priority thresholds, not disease thresholds.
  pri=np.zeros((H,W),np.uint8);pri[valid & (risk>=q50)]=1;pri[valid & (risk>=q80)]=2;pri[valid & (risk>=q95)]=3
  hi=pri==3; lab,nz=ndimage.label(hi,structure=np.ones((3,3),int))
  zones=[]; features=[]
  for zid in range(1,nz+1):
   ys,xs=np.where(lab==zid); npx=len(xs)
   if npx<9: continue
   rv=risk[ys,xs]; cx,cy=xy(transform,float(ys.mean()),float(xs.mean()))
   coords=[]
   for geom,val in shapes((lab==zid).astype(np.uint8),mask=(lab==zid),transform=transform): coords.append(geom)
   zones.append({'zone_id':f'{name}-Z{len(zones)+1:04d}','scene':name,'pixel_count':int(npx),'approx_area_m2':float(npx*abs(transform.a*transform.e)),'centroid_x':float(cx),'centroid_y':float(cy),'mean_risk':float(rv.mean()),'max_risk':float(rv.max()),'median_risk':float(np.median(rv)),'high_priority_pixel_pct':100.0,'priority_category':'HIGH PRIORITY','threshold_type':'95th percentile prioritisation threshold','recommendation':'Spectral-stress evidence detected. Prioritise field inspection to determine the underlying cause. Field verification required.'})
   features.append((geom if coords else None,zones[-1]))
  zones.sort(key=lambda x:x['mean_risk'],reverse=True)
  for i,z in enumerate(zones,1):z['priority_rank']=i
  # Raster outputs, actual CRS/geotransform.
  profile=ds.profile.copy();profile.update(count=1,dtype='float32',nodata=-9999,compress='deflate')
  with rasterio.open(od/'risk_map.tif','w',**profile) as o:o.write(np.nan_to_num(risk,nan=-9999).astype('float32'),1)
  profile.update(dtype='uint8',nodata=0)
  with rasterio.open(od/'priority_map.tif','w',**profile) as o:o.write(pri,1)
  # GeoJSON generated only because CRS/geotransform are valid.
  geoms=[]
  for zid in range(1,nz+1):
   mask=(lab==zid); ys,xs=np.where(mask)
   if len(xs)<9:continue
   geom=None
   for g,v in shapes(mask.astype(np.uint8),mask=mask,transform=transform):geom=g
   if geom is not None:
    z=next((z for z in zones if z['pixel_count']==len(xs) and abs(z['centroid_x']-xy(transform,float(ys.mean()),float(xs.mean()))[0])<1e-3),None)
    if z: geoms.append({'type':'Feature','geometry':geom,'properties':z})
  (od/'zones.geojson').write_text(json.dumps({'type':'FeatureCollection','crs':{'type':'name','properties':{'name':crs}},'features':geoms},default=float))
  csvwrite(od/'zones.csv',zones)
  # Actual zone spectral evidence from source pixels.
  ev=[]
  for z in zones[:10]:
   zid=z['zone_id']; rank=z['priority_rank'];
   # identify zone by rank and use its connected component
   idx=next((i for i,x in enumerate(zones) if x['zone_id']==zid),0)+1
   ys,xs=np.where(lab==idx)
   if len(xs):
    # Read only zone windows, aggregate all 224 bands for evidence.
    y0,y1=ys.min(),ys.max()+1;x0,x1=xs.min(),xs.max()+1
    a=ds.read(window=rasterio.windows.Window(x0,y0,x1-x0,y1-y0)).astype('float32')
    m=(lab[y0:y1,x0:x1]==idx)&np.all(np.isfinite(a),axis=0)
    spec=np.nanmean(np.where(m[None,:,:],a,np.nan),axis=(1,2))
    for b,val in enumerate(spec,1):ev.append({'zone_id':zid,'priority_rank':rank,'band_index':b,'observed_mean':float(val),'reference_mean_32band_only':float(mean[list(BANDS).index(min(BANDS,key=lambda q:abs(q-(b-1))))]) if b-1 in BANDS else None,'wavelength_status':'unavailable in GeoTIFF/XML artifact; band index reported'})
  csvwrite(od/'spectral_evidence.csv',ev)
  rows=[]
  for b in [.05,.10,.20,.30,.50,1.0]:
   k=max(1,int(valid_count*b));sel=np.argsort(vals)[-k:];rows.append({'budget':b,'valid_pixels':valid_count,'selected_pixels':k,'proxy_positive_coverage':float(np.sum(vals[sel]>=q95)/max(1,np.sum(vals>=q95))),'label':'pixel-level proxy inspection coverage'})
  csvwrite(od/'inspection_budget.csv',rows)
  scene_stats={'scene':name,'source':str(path),'dimensions':[H,W],'bands':C,'resolution_m':30.0,'valid_pixels':valid_count,'total_pixels':total,'nodata_percentage':float(100*(1-valid_count/total)),'crs':crs,'transform':list(transform),'thresholds':{'low_medium_q50':q50,'medium_high_q80':q80,'high_priority_q95':q95},'priority_zone_count':len(zones),'processing_seconds':time.perf_counter()-t0,'status':'LIVE ANALYSIS from actual EnMAP GeoTIFF; spectral anomaly proxy, not disease label'}
  (od/'scene_statistics.json').write_text(json.dumps(scene_stats,indent=2,default=float));(od/'metrics.json').write_text(json.dumps({'engine':'windowed spectral anomaly Matrix','risk_definition':'RMS standardized deviation over 32 actual EnMAP bands','models':'spectral anomaly proxy; AgriSpectra-Q benchmark remains frozen separately','zone_count':len(zones)},indent=2))
  (od/'manifest.json').write_text(json.dumps({'run_id':run.name,'scene':name,'source':str(path),'live':True,'leakage_control':'no labels; relative thresholds computed from full scene unsupervised anomaly reference; not benchmark test evaluation','crs':crs,'outputs':['risk_map.tif','priority_map.tif','zones.geojson','zones.csv','spectral_evidence.csv','inspection_budget.csv','scene_statistics.json','metrics.json']},indent=2))
  return scene_stats

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--scene',choices=list(SCENES)+['all'],default='all');ap.add_argument('--run-id',default=None);a=ap.parse_args();run=OUT/(a.run_id or ('AGRQ-LIVE-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid.uuid4().hex[:6]));run.mkdir(parents=True,exist_ok=True);names=list(SCENES) if a.scene=='all' else [a.scene];stats=[process(n,SCENES[n],run) for n in names];(run/'run_summary.json').write_text(json.dumps({'run_id':run.name,'live':True,'scenes':stats,'limitations':['spectral wavelength metadata unavailable; band indices reported','unsupervised spectral anomaly proxy; no disease/pest labels','priority thresholds are relative percentiles','not the frozen six-model benchmark']},indent=2,default=float));print(json.dumps({'run_id':run.name,'path':str(run),'scenes':len(stats),'seconds':sum(x['processing_seconds'] for x in stats)},indent=2))
if __name__=='__main__':main()
