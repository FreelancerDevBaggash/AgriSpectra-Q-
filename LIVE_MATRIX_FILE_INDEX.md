# AgriSpectra-Q — Complete Live Matrix File Index

Run ID: `AGRQ-LIVE-20260916-132530-587fc9`

This index covers the live run executed from the three real EnMAP GeoTIFF scenes. The live engine produces an unsupervised spectral-anomaly proxy and is separate from the frozen six-model scientific benchmark.

## Run-level files

- [Run summary](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/run_summary.json)

## Scene 1 — `scene_01_DT0000205230`

- [Scene manifest](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/manifest.json)
- [Metrics](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/metrics.json)
- [Scene statistics and metadata](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/scene_statistics.json)
- [Risk map GeoTIFF](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/risk_map.tif)
- [Priority map GeoTIFF](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/priority_map.tif)
- [Zones CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/zones.csv)
- [Zones GeoJSON](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/zones.geojson)
- [Spectral evidence CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/spectral_evidence.csv)
- [Inspection-budget CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_01_DT0000205230/inspection_budget.csv)

## Scene 2 — `scene_02`

- [Scene manifest](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/manifest.json)
- [Metrics](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/metrics.json)
- [Scene statistics and metadata](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/scene_statistics.json)
- [Risk map GeoTIFF](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/risk_map.tif)
- [Priority map GeoTIFF](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/priority_map.tif)
- [Zones CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/zones.csv)
- [Zones GeoJSON](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/zones.geojson)
- [Spectral evidence CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/spectral_evidence.csv)
- [Inspection-budget CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_02/inspection_budget.csv)

## Scene 3 — `scene_03`

- [Scene manifest](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/manifest.json)
- [Metrics](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/metrics.json)
- [Scene statistics and metadata](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/scene_statistics.json)
- [Risk map GeoTIFF](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/risk_map.tif)
- [Priority map GeoTIFF](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/priority_map.tif)
- [Zones CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/zones.csv)
- [Zones GeoJSON](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/zones.geojson)
- [Spectral evidence CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/spectral_evidence.csv)
- [Inspection-budget CSV](results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/scene_03/inspection_budget.csv)

## Live implementation

- [Windowed Live Matrix engine](live_matrix_engine.py)
- [Live Matrix API](live_matrix_api.py)
- [Analysis Lab updater](add_live_lab.py)
- [Interactive dashboard](results/industrial_validation/dashboard/index.html)

## Frozen scientific benchmark and industrial validation

- [Final industrial validation report](results/industrial_validation/final_industrial_validation_report.md)
- [Experiment manifest](results/industrial_validation/experiment_manifest.json)
- [Decision-value results](results/industrial_validation/decision_value_results.csv)
- [Unique-value summary](results/industrial_validation/unique_value_summary.csv)
- [Decision cards](results/industrial_validation/decision_cards.csv)
- [Selective-risk results](results/industrial_validation/selective_risk_results.csv)
- [Difficulty-quantile results](results/industrial_validation/difficulty_quantile_results.csv)
- [VOI proxy results](results/industrial_validation/voi_proxy_results.csv)
- [Quantum-component ablation](results/industrial_validation/quantum_component_ablation.csv)
- [Selective-risk plot](results/industrial_validation/figures/selective_risk_curve.png)
- [Decision-value plot](results/industrial_validation/figures/decision_value_under_limited_inspection.png)

## Complete package

- [AgriSpectra-Q master industrial PoC ZIP](../AgriSpectra-Q-master-industrial-poc.zip)

## Evidence boundary

The live run is a real, georeferenced, windowed spectral-anomaly analysis from EnMAP GeoTIFFs. Its priority categories are relative operational categories based on scene-specific percentile thresholds. They are not disease or pest labels. The live run does not independently establish AgriSpectra-Q superiority over HSI-RF.
