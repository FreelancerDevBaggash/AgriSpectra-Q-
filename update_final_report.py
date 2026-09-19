from pathlib import Path
import json
root=Path('/home/ubuntu/AgriSpectra-Q'); report=root/'results/industrial_validation/final_industrial_validation_report.md'; manifest=root/'results/industrial_validation/experiment_manifest.json'
append='''

## 30. Master Prompt extension: value-of-inspection, selective risk, and fairness audit

The attached Master Prompt was executed against the frozen prediction artifact. The new outputs are descriptive analyses of the locked test predictions unless explicitly marked as validation-frozen. No test correctness was used to tune a threshold, weight, routing gate, or decision policy.

### Selective prediction

Entropy-ranked selective risk was computed for HSI-RF and AgriSpectra-Q at 10%, 20%, 30%, 50%, 70%, 90%, and 100% coverage. At 10–70% coverage both models had zero observed error in this highly separable frozen proxy subset; at 90% mean selective risk was 0.000595 for HSI-RF and 0.000709 for AgriSpectra-Q; at 100% it was 0.014711 and 0.014352 respectively. These values are **descriptive frozen-test results**, not evidence of a deployable conformal guarantee. The accepted/rejected gate was not selected on validation data in the preserved artifact, so a proper selective-prediction claim remains **NOT VALIDATED — REQUIRED VALIDATION POLICY ARTIFACT UNAVAILABLE**.

### Difficulty specialisation

A descriptive difficulty index combining predictive entropy and absolute Q/RF disagreement was used only to stratify the frozen test observations. AgriSpectra-Q and HSI-RF were tied in the first four quintiles under the available hard-decision proxy; in the hardest quintile their mean F1 values were 0.929274 and 0.927977 respectively. This is a small descriptive signal, not a statistically established difficult-case advantage, because the difficulty construction and complete validation-frozen gate were not preserved before test evaluation.

### Value-of-inspection formulations

Risk-only, risk-plus-uncertainty, and multiplicative PVOI-proxy rankings were compared. At 5%, 10%, and 20% budgets, the risk-only ranking achieved mean recall 0.244880, 0.491909, and 0.922243 respectively; the risk-plus-uncertainty proxy achieved 0.212404, 0.456677, and 0.908696; the multiplicative PVOI proxy achieved 0.211593, 0.454404, and 0.907031. Thus, on the available frozen predictions, adding the available entropy/disagreement proxies reduced recall relative to risk-only ranking. Spectral novelty, spatial coherence, true inspection cost, and posterior loss reduction were unavailable; these are **Proxy Value of Information (PVOI)** results, not economic VOI.

### Quantum-component fairness

The controlled residual-specific V4 comparison produced F1 0.976578 with the V4-C hybrid and 0.976640 for HSI-RF on that earlier protocol, a delta of -0.000061. The current evidence does not demonstrate a statistically meaningful benefit from the quantum-inspired transformation. The scientifically correct terminology remains **quantum-inspired feature transformation** or **hybrid quantum-classical research layer**; no quantum advantage is claimed.

### Additional blocked requirements

The following requirements cannot be legitimately completed from the preserved artifacts and are explicitly not replaced with invented numbers:

- Mahalanobis novelty recomputation from training/validation raw spectra: **NOT VALIDATED — RAW TRAIN/VALIDATION FEATURE ARTIFACT UNAVAILABLE**.
- Coordinate-preserving connected components, spatial coherence, and submodular zone selection on the exact frozen test membership: **NOT VALIDATED — FROZEN PREDICTION SCHEMA LACKS PIXEL COORDINATES**.
- Raw selective inference timing, RAM, model size, Q evaluations, and cost efficiency: **COMPUTATIONAL COST NOT FULLY VALIDATED**.
- Temporal persistence and trend: **TEMPORAL VALIDATION NOT AVAILABLE**.
- Fourth blind EnMAP scene: **BLIND EXTERNAL VALIDATION UNAVAILABLE**.
- Field/zone ground truth: **FIELD VALIDATION NOT AVAILABLE**.

The new machine-readable outputs are `selective_risk_results.csv`, `difficulty_quantile_results.csv`, `voi_proxy_results.csv`, and `quantum_component_ablation.csv`, with corresponding tables in `tables/` and the figure `figures/selective_risk_curve.png`.

## 31. Updated final verdict

The attached Master Prompt does not overturn the previous yellow verdict. AgriSpectra-Q remains numerically competitive with HSI-RF, but the new decision-score comparisons do not show a benefit beyond risk-only ranking, and the selective routing and spatial optimisation claims cannot be validated from the frozen schema. The current evidence therefore supports **HSI-RF as the operational reference** and AgriSpectra-Q as an **incubation-stage hybrid research layer** pending validation-frozen policy training, raw-input re-execution, coordinate preservation, external scenes, temporal data, and field labels.
'''
text=report.read_text()
if '## 30. Master Prompt extension' not in text: report.write_text(text.rstrip()+append+'\n')
m=json.loads(manifest.read_text())
m.update({'master_prompt_extension':'executed_on_frozen_predictions','selective_risk_status':'descriptive frozen-test analysis; deployable gate not validated','difficulty_specialisation_status':'descriptive; validation-frozen difficulty policy unavailable','voi_status':'proxy only; spectral novelty, spatial coherence, true inspection cost and posterior loss unavailable','quantum_component_ablation_status':'no statistically meaningful quantum-inspired gain demonstrated','spatial_optimisation_status':'not validated; frozen predictions lack coordinates','computational_cost_status':'not fully validated','blind_external_scene_status':'unavailable','new_outputs':['selective_risk_results.csv','difficulty_quantile_results.csv','voi_proxy_results.csv','quantum_component_ablation.csv','figures/selective_risk_curve.png']})
manifest.write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n')
print('updated',report,manifest)
