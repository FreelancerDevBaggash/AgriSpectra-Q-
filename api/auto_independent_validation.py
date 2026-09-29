#!/usr/bin/env python3
"""Generate strict independent-reference artifacts for an existing model run.

This script runs after the model. It never edits anomaly outputs and never
creates a combined score. It derives footprint/CRS from scene metadata and
uses only external STAC assets that actually intersect the scene.
"""
from __future__ import annotations
import argparse, json, math, urllib.request
from datetime import date, timedelta
from pathlib import Path
from typing import Any
import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import reproject, Resampling, transform_bounds, transform_geom
import planetary_computer
try:
    from independent_f1 import evaluate_files
except ImportError:
    evaluate_files = None

PC = 'https://planetarycomputer.microsoft.com/api/stac/v1'
CROPLAND = 40

def get_json(url, payload=None):
    if payload is None:
        return json.load(urllib.request.urlopen(url, timeout=90))
    req=urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type':'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=90))

def search(collection, bbox, dt, limit=20):
    payload={'collections':[collection], 'bbox':bbox, 'limit':limit}
    if dt: payload['datetime']=dt
    return get_json(PC+'/search', payload).get('features', [])

def parse_date(value):
    return date.fromisoformat(value[:10]) if value else None

def scene_context(scene_dir: Path):
    stats=json.loads((scene_dir/'scene_statistics.json').read_text())
    geo=json.loads((scene_dir/'zones.geojson').read_text())
    target=scene_dir/'risk_map.tif'
    if not target.exists(): target=scene_dir/'priority_map.tif'
    if not target.exists(): raise FileNotFoundError(f'No target grid raster in {scene_dir}; expected risk_map.tif or priority_map.tif')
    with rasterio.open(target) as ds:
        bbox=list(transform_bounds(str(ds.crs),'EPSG:4326',*ds.bounds,densify_pts=21))
    return stats,geo,target,bbox

def read_asset(href, target, scale=1.0, offset=0.0, categorical=False):
    with rasterio.open('/vsicurl/'+href) as src:
        out=np.full((target.height,target.width), np.nan, dtype='float32')
        reproject(rasterio.band(src,1),out,src_transform=src.transform,src_crs=src.crs,dst_transform=target.transform,dst_crs=target.crs,resampling=Resampling.nearest if categorical else Resampling.bilinear,dst_nodata=np.nan)
    return out*scale+offset

def zone_stats(arr, geo, target):
    geoms=[transform_geom('EPSG:4326',str(target.crs),f['geometry']) for f in geo['features']]
    m=geometry_mask(geoms,out_shape=(target.height,target.width),transform=target.transform,invert=True)
    valid=np.isfinite(arr); z=arr[valid&m]; allv=arr[valid]
    if not z.size or not allv.size: return {'status':'Not Available','reason':'No valid aligned pixels'}
    return {'status':'Available','scene_mean':float(allv.mean()),'zone_mean':float(z.mean()),'difference':float(z.mean()-allv.mean()),'zone_below_scene_median_pct':float(np.mean(z<np.median(allv))*100),'zone_valid_pixels':int(z.size),'scene_valid_pixels':int(allv.size)}

def s2_result(item, geo, target):
    item=planetary_computer.sign(item); a=item['assets']
    red=read_asset(a['B04']['href'],target,1/10000); nir=read_asset(a['B08']['href'],target,1/10000); rededge=read_asset(a['B05']['href'],target,1/10000)
    ndvi=(nir-red)/(nir+red+1e-6); ndre=(nir-rededge)/(nir+rededge+1e-6)
    if 'SCL' in a:
        scl=read_asset(a['SCL']['href'],target,categorical=True); ndvi[np.isin(scl,[3,8,9,10,11])]=np.nan; ndre[np.isin(scl,[3,8,9,10,11])]=np.nan
    return {'item_id':item['id'],'date':item.get('properties',{}).get('datetime'),'cloud_cover':item.get('properties',{}).get('eo:cloud_cover'),'ndvi':zone_stats(ndvi,geo,target),'ndre':zone_stats(ndre,geo,target),'crs':str(target.crs),'aligned_to_target':True}

def landsat_result(item, geo, target):
    item=planetary_computer.sign(item); a=item['assets']
    red=read_asset(a['red']['href'],target,0.0000275,-0.2); nir=read_asset(a['nir08']['href'],target,0.0000275,-0.2); swir=read_asset(a['swir16']['href'],target,0.0000275,-0.2); qa=read_asset(a['qa_pixel']['href'],target,1,categorical=True)
    q=np.nan_to_num(qa,nan=1).astype('uint16'); clear=((q&1)==0)&((q&(1<<1))==0)&((q&(1<<2))==0)&((q&(1<<3))==0)&((q&(1<<4))==0)&((q&(1<<5))==0)
    ndvi=(nir-red)/(nir+red+1e-6); ndmi=(nir-swir)/(nir+swir+1e-6); ndvi[~clear]=np.nan; ndmi[~clear]=np.nan
    return {'item_id':item['id'],'date':item.get('properties',{}).get('datetime'),'cloud_cover':item.get('properties',{}).get('eo:cloud_cover'),'qa_mask':'QA_PIXEL excluding fill/dilated cloud/cirrus/cloud/shadow/snow','ndvi':zone_stats(ndvi,geo,target),'ndmi':zone_stats(ndmi,geo,target),'crs':str(target.crs),'aligned_to_target':True}

def worldcover_result(item, geo, target):
    item=planetary_computer.sign(item); href=item['assets']['map']['href']; rows=[]
    with rasterio.open('/vsicurl/'+href) as ds:
        for i,f in enumerate(geo['features'],1):
            try:
                from rasterio.mask import mask
                g=transform_geom('EPSG:4326',str(ds.crs),f['geometry']); arr,_=mask(ds,[g],crop=True,filled=False); x=arr[0].compressed(); valid=x[x!=ds.nodata] if ds.nodata is not None else x
                rows.append({'zone_index':i,'valid_pixels':int(valid.size),'cropland_pixels':int(np.sum(valid==CROPLAND)),'cropland_fraction':float(np.mean(valid==CROPLAND)) if valid.size else None})
            except ValueError: rows.append({'zone_index':i,'valid_pixels':0,'cropland_pixels':0,'cropland_fraction':None})
    valid=[x for x in rows if x['valid_pixels']]; return {'worldcover_item':item['id'],'class_40':'Cropland','zones':len(rows),'zones_with_data':len(valid),'zone_area_weighted_cropland_fraction':float(sum(x['cropland_pixels'] for x in valid)/sum(x['valid_pixels'] for x in valid)) if valid else None,'zones_majority_cropland_pct':float(np.mean([x['cropland_fraction']>=.5 for x in valid])*100) if valid else None,'aligned_by_footprint':True}

def run(run_dir: Path, out_root: Path, enmap_date: str|None, days: int, max_candidates: int, reference_polygons: Path|None = None, f1_overlap_threshold: float = 0.10):
    scenes=[run_dir] if (run_dir/'scene_statistics.json').exists() else sorted(p for p in run_dir.iterdir() if p.is_dir() and (p/'scene_statistics.json').exists() and (p/'zones.geojson').exists())
    for scene in scenes:
        stats,geo,target,bbox=scene_context(scene); d=parse_date(enmap_date) or parse_date(stats.get('timestamp')) or date.today(); lo=(d-timedelta(days=days)).isoformat(); hi=(d+timedelta(days=days)).isoformat(); dest=out_root/'results'/'independent_references'/run_dir.name/scene.name; dest.mkdir(parents=True,exist_ok=True)
        s2=search('sentinel-2-l2a',bbox,f'{lo}/{hi}',50); s2=sorted(s2,key=lambda x:(x.get('properties',{}).get('eo:cloud_cover',999),abs((parse_date(x.get('properties',{}).get('datetime'))-d).days if parse_date(x.get('properties',{}).get('datetime')) else 999)))
        ls=search('landsat-c2-l2',bbox,f'{lo}/{hi}',50); ls=sorted(ls,key=lambda x:(x.get('properties',{}).get('eo:cloud_cover',999),abs((parse_date(x.get('properties',{}).get('datetime'))-d).days if parse_date(x.get('properties',{}).get('datetime')) else 999)))
        wc=search('esa-worldcover',bbox,None,10)
        base={'run_id':run_dir.name,'scene':scene.name,'source_crs':stats.get('crs'),'footprint_wgs84_bbox':bbox,'target_grid':{'crs':str(target.exists() and rasterio.open(target).crs),'width':target.stat().st_size if False else None},'independent_only':True}
        with rasterio.open(target) as target_ds:
            s2_choice=None
            for item in s2[:max_candidates]:
                try:
                    result=s2_result(item,geo,target_ds)
                    if any(result.get(k,{}).get('status')=='Available' for k in ('ndvi','ndre')):
                        s2_choice=(item,result); break
                except Exception:
                    continue
            ls_choice=None
            for item in ls[:max_candidates]:
                try:
                    result=landsat_result(item,geo,target_ds)
                    if any(result.get(k,{}).get('status')=='Available' for k in ('ndvi','ndmi')):
                        ls_choice=(item,result); break
                except Exception:
                    continue
        if s2_choice:
            item,result=s2_choice; (dest/'sentinel2_timeseries.json').write_text(json.dumps({**base,'selected':item['id'],'result':result},indent=2)+'\n')
        if ls_choice:
            item,result=ls_choice; (dest/'landsat_quality_masked.json').write_text(json.dumps({**base,'selected':item['id'],'result':result},indent=2)+'\n')
        if wc:
            base3=dict(base); base3['worldcover']=worldcover_result(wc[0],geo,rasterio.open(target)); (dest/'esa_worldcover.json').write_text(json.dumps({**base3,'selected':wc[0]['id'],'result':base3.pop('worldcover')},indent=2)+'\n')
        if reference_polygons and reference_polygons.exists() and evaluate_files:
            f1_payload=evaluate_files(scene/'zones.geojson', reference_polygons, dest/'f1_score.json', f1_overlap_threshold)
            (dest/'reference_polygons.json').write_text(json.dumps({**base,'selected':str(reference_polygons),'result':{'status':'Available','f1_score':f1_payload.get('result',{}),'source':str(reference_polygons)}},indent=2)+'\n')
        else:
            (dest/'f1_score.json').write_text(json.dumps({'status':'Not Available','reason':'No explicitly labelled reference_polygons.geojson was provided. F1 is not inferred from satellite indices.'},indent=2)+'\n')
        (dest/'validation_manifest.json').write_text(json.dumps({'run_id':run_dir.name,'scene':scene.name,'bbox':bbox,'sources_found':{'sentinel2':bool(s2_choice),'landsat':bool(ls_choice),'worldcover':bool(wc)},'note':'No combined score; no model outputs modified.'},indent=2)+'\n')
    status_path = out_root/'results'/'independent_references'/run_dir.name/'validation_status.json'
    status_path.parent.mkdir(parents=True, exist_ok=True)
    status_path.write_text(json.dumps({'status':'Completed','run_id':run_dir.name},indent=2)+'\n')

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--run-dir',type=Path,required=True); ap.add_argument('--output-root',type=Path,required=True); ap.add_argument('--enmap-date'); ap.add_argument('--search-days',type=int,default=30); ap.add_argument('--max-candidates',type=int,default=1); ap.add_argument('--reference-polygons',type=Path); ap.add_argument('--f1-overlap-threshold',type=float,default=0.10); a=ap.parse_args(); run(a.run_dir,a.output_root,a.enmap_date,a.search_days,a.max_candidates,a.reference_polygons,a.f1_overlap_threshold); print(json.dumps({'status':'completed','run_dir':str(a.run_dir),'output_root':str(a.output_root)}))
if __name__=='__main__': main()
