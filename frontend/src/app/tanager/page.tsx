'use client'

import Link from 'next/link'
import { useState } from 'react'

// ── Planet Tanager page — based on:
//   docs/integration-package/TANAGER_FRONTEND_INTEGRATION_CONTRACT.md.txt
//   docs/integration-package/دليل_دمج_AgriSpectraQ_للموقع_GitHub_Colab.md §6
//   docs/integration-package/COLAB_CONTENT_HANDOFF_AR.md
//
// IMPORTANT: This page is NOT EnMAP Live Matrix. Do NOT merge with EnMAP data.
// All results sourced from: deliverables/tanager_trust_final/

// ── Frozen provenance data from TANAGER_HDF5_METADATA.json and COLAB_CONTENT_HANDOFF_AR.md ──
const TANAGER_PROVENANCE = {
  scene_id:            '20250501_143138_87_4001',
  dimensions:          '426 × 752 × 784',
  crs:                 'EPSG:32721',
  source_bands:        426,
  valid_bands:         352,
  valid_pixel_fraction:'71.6659%',
  tile_size:           128,
  data_source:         'Google Drive supplied HDF5',
  source_note:         'Raw .h5 file is NOT stored in the repository. Only derived outputs are committed.',
}

// ── Validation states — MUST be shown, never hidden ──
const VALIDATION_STATUS = [
  { label: 'Geospatial integrity',       status: 'PASS',    desc: 'Raster-to-vector representation verified for all 128 zones.' },
  { label: 'Independent scene validation', status: 'BLOCKED', desc: 'No distinct documented scene available. Required before generalisation claims.' },
  { label: 'Cross-sensor consistency',   status: 'BLOCKED', desc: 'No compatible cross-sensor reference supplied. Required before sensor-independence claims.' },
]

// ── Geospatial integrity result — from TANAGER_GEOSPATIAL_INTEGRITY_REPORT.md ──
const GEOSPATIAL_METRICS = [
  { label: 'Zones checked',           value: '128',   note: '' },
  { label: 'Rasterize-back FP',       value: '0',     note: 'False positives' },
  { label: 'Rasterize-back FN',       value: '0',     note: 'False negatives' },
  { label: 'IoU',                     value: '1.0',   note: 'Intersection over Union' },
  { label: 'Precision',               value: '1.0',   note: '' },
  { label: 'Recall',                  value: '1.0',   note: '' },
  { label: 'F1',                      value: '1.0',   note: '' },
]

// ── Analysis track tabs ──
const ANALYSIS_TRACKS = [
  {
    id:        'baseline_anomaly',
    label:     'Baseline anomaly',
    artifact:  'baseline_anomaly_score.tif',
    method:    'RMS standardised deviation over valid bands — scene-relative baseline.',
    limits:    'Relative to this scene only. Not comparable across sensors or scenes without recalibration.',
  },
  {
    id:        'trust_anomaly',
    label:     'TRUST anomaly',
    artifact:  'trust_anomaly_score.tif',
    method:    'TRUST-refined anomaly score applying valid-band mask and tile-by-tile normalisation.',
    limits:    'Relative prioritisation only. Not a confirmed spectral disease signature.',
  },
  {
    id:        'reference_ambiguity',
    label:     'Reference ambiguity',
    artifact:  'ambiguity_proxy.tif',
    method:    'Proximity of each pixel to scene-relative percentile decision thresholds (P50/P80/P95).',
    limits:    'Not calibrated measurement uncertainty. Describes threshold proximity, not probability of error.',
  },
  {
    id:        'ambiguity_v2',
    label:     'Ambiguity v2',
    artifact:  'ambiguity_v2_rank_robust.tif',
    method:    'Rank-robust reformulation of ambiguity proxy — reduced sensitivity to outlier scores.',
    limits:    'Ambiguity v2 is not claimed to be superior to the reference formulation without independent validation.',
  },
  {
    id:        'priority_classes',
    label:     'Priority classes',
    artifact:  'trust_priority_classes.tif',
    method:    'Scene-relative percentile classification: INSPECT (P95+), MONITOR (P80–P95), ABSTAIN (below P80).',
    limits:    'Scene-relative thresholds. Not absolute severity levels. Not a disease classification.',
  },
  {
    id:        'corrected_zones',
    label:     'Corrected multipart zones',
    artifact:  'zones_corrected_exact_multipart.geojson',
    method:    'Connected components extracted from priority raster, rebuilt as corrected multipart GeoJSON polygons. Rasterize-back validated.',
    limits:    'Spatial extent only. No ground-truth field labels. Zone boundaries are raster-pixel aligned.',
  },
]

// ── Workflow steps (Cell 3 from TANAGER_NOTEBOOK_CELLS.md) ──
const WORKFLOW_STEPS = [
  'Validate HDF5 structure and metadata.',
  'Identify valid bands and valid pixels.',
  'Produce baseline and TRUST relative anomaly outputs.',
  'Compute the reference ambiguity proxy.',
  'Compute ambiguity v2 as a separate method, not a replacement.',
  'Extract connected priority components.',
  'Rebuild corrected multipart polygons from the original raster masks.',
  'Perform projected-area, centroid, and rasterize-back checks.',
  'Generate Evidence Passports and the advanced atlas.',
  'Report blocked independent-scene and cross-sensor validations explicitly.',
]

// ── Atlas panel descriptions (from ATLAS_PANEL_TITLES + TANAGER_NOTEBOOK_CELLS Cell 4) ──
const ATLAS_PANELS = [
  { id: 'anomaly_score',             title: 'Spectral anomaly score',              sub: 'RMS standardized deviation',              note: 'Continuous anomaly signal — higher = more spectral deviation from scene mean.' },
  { id: 'priority_classes',          title: 'Relative spectral-priority classes',   sub: 'INSPECT / MONITOR / ABSTAIN',             note: 'Scene-relative classification. Not biological severity.' },
  { id: 'threshold_ambiguity_proxy', title: 'Threshold ambiguity proxy',           sub: 'Not measurement uncertainty',              note: 'Proximity to decision thresholds — not a calibrated probability of error.' },
  { id: 'p95_footprint',             title: 'P95 high-priority footprint',          sub: 'Inspection candidate areas',              note: 'Areas crossing the P95 scene-relative threshold. Field verification required.' },
]

export default function TanagerPage() {
  const [activeTrack, setActiveTrack] = useState('baseline_anomaly')
  const selectedTrack = ANALYSIS_TRACKS.find(t => t.id === activeTrack)!

  return (
    <div className="min-h-screen bg-surface-50">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-surface-700 transition-colors">Home</Link>
            <span aria-hidden="true">›</span>
            <Link href="/research" className="hover:text-surface-700 transition-colors">Research</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Tanager Experiment</span>
          </nav>

          {/* Mode badge — mandatory, must not be removed */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-xs font-bold text-purple-800 tracking-wider">
              PLANET TANAGER — SCIENTIFIC EXPERIMENT
            </span>
            <span className="badge bg-surface-100 text-surface-500 border border-surface-200 text-xs">
              Separate from EnMAP Live Matrix
            </span>
          </div>

          <h1 className="text-3xl font-bold text-surface-900 mb-3">
            Planet Tanager — Hyperspectral Trust Experiment
          </h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            This experiment processes a real Planet Tanager hyperspectral HDF5 scene and evaluates a reproducible
            workflow for relative spectral-anomaly prioritisation, ambiguity analysis, and geospatial integrity.
            The output is a research and inspection-prioritisation signal, not an agricultural diagnosis.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ── 1. Validation status — MUST be visible, never hidden ─────── */}
        <section>
          <p className="section-label mb-2">VALIDATION STATUS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Current Experiment Validation State</h2>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            {VALIDATION_STATUS.map(({ label, status, desc }) => {
              const isPass    = status === 'PASS'
              const isBlocked = status === 'BLOCKED'
              const color = isPass
                ? 'bg-green-50 border-green-300'
                : isBlocked
                  ? 'bg-gold-50 border-gold-300'
                  : 'bg-surface-50 border-surface-200'
              const textColor = isPass ? 'text-green-800' : isBlocked ? 'text-gold-800' : 'text-surface-700'
              return (
                <div key={label} className={`border rounded-lg p-4 ${color}`}>
                  <div className={`text-sm font-bold tracking-widest mb-1 ${textColor}`}>{status}</div>
                  <div className={`text-xs font-semibold mb-1 ${textColor}`}>{label}</div>
                  <div className="text-xs text-surface-500 leading-relaxed">{desc}</div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-surface-400 leading-relaxed">
            Blocked validation states are retained — they are not hidden. They represent required validations that
            cannot be completed without distinct documented external data.
          </p>
        </section>

        {/* ── 2. Source provenance card ──────────────────────────────────── */}
        <section>
          <p className="section-label mb-2">SOURCE PROVENANCE</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">HDF5 Scene Metadata</h2>
          <div className="bg-white border border-surface-200 rounded-lg p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-xs mb-4">
              <div>
                <span className="text-surface-400 block mb-0.5">Scene ID</span>
                <code className="font-mono text-surface-800 font-semibold">{TANAGER_PROVENANCE.scene_id}</code>
              </div>
              <div>
                <span className="text-surface-400 block mb-0.5">Dimensions (bands × rows × cols)</span>
                <strong className="text-surface-800">{TANAGER_PROVENANCE.dimensions}</strong>
              </div>
              <div>
                <span className="text-surface-400 block mb-0.5">CRS</span>
                <code className="font-mono text-surface-800">{TANAGER_PROVENANCE.crs}</code>
              </div>
              <div>
                <span className="text-surface-400 block mb-0.5">Source bands</span>
                <strong className="text-surface-800">{TANAGER_PROVENANCE.source_bands}</strong>
              </div>
              <div>
                <span className="text-surface-400 block mb-0.5">Valid (good) bands</span>
                <strong className="text-surface-800">{TANAGER_PROVENANCE.valid_bands}</strong>
              </div>
              <div>
                <span className="text-surface-400 block mb-0.5">Valid pixel fraction</span>
                <strong className="text-surface-800">{TANAGER_PROVENANCE.valid_pixel_fraction}</strong>
              </div>
              <div>
                <span className="text-surface-400 block mb-0.5">Tile size</span>
                <strong className="text-surface-800">{TANAGER_PROVENANCE.tile_size} px</strong>
              </div>
              <div>
                <span className="text-surface-400 block mb-0.5">Data source</span>
                <strong className="text-surface-800">{TANAGER_PROVENANCE.data_source}</strong>
              </div>
            </div>
            <div className="border-t border-surface-100 pt-3">
              <p className="text-xs text-surface-400 leading-relaxed">
                <strong className="text-surface-500">Raw data policy:</strong>{' '}
                {TANAGER_PROVENANCE.source_note}
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. Workflow ────────────────────────────────────────────────── */}
        <section>
          <p className="section-label mb-2">WORKFLOW</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Ten-Step Tanager Experiment</h2>
          <div className="space-y-0 divide-y divide-surface-100 border-t border-b border-surface-100">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={i} className="flex gap-5 py-3.5">
                <span className="text-xs font-bold text-surface-300 font-mono mt-0.5 w-5 flex-shrink-0 tabular-nums">{i + 1}</span>
                <p className="text-sm text-surface-600 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Analysis tracks ──────────────────────────────────────────── */}
        <section>
          <p className="section-label mb-2">ANALYSIS TRACKS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Six Analysis Outputs</h2>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 mb-4">
            {ANALYSIS_TRACKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTrack(id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  activeTrack === id
                    ? 'bg-surface-800 text-white border-surface-800'
                    : 'bg-white text-surface-600 border-surface-200 hover:border-surface-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active track detail */}
          <div className="bg-white border border-surface-200 rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="text-base font-semibold text-surface-900">{selectedTrack.label}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 font-mono">
                {selectedTrack.artifact}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Method</p>
                <p className="text-sm text-surface-600 leading-relaxed">{selectedTrack.method}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Limitations</p>
                <p className="text-sm text-surface-500 leading-relaxed italic">{selectedTrack.limits}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Advanced atlas ───────────────────────────────────────────── */}
        <section>
          <p className="section-label mb-2">ADVANCED SPECTRAL ATLAS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Four-Panel Spectral Atlas</h2>
          <p className="text-xs text-surface-400 mb-5 leading-relaxed">
            Derived from actual Planet Tanager experiment outputs.
            Relative prioritisation only; field verification required.
            Generated by:{' '}
            <code className="font-mono text-xs">docs/integration-package/deliverables/agrispectraq_integration_package/tools/generate_spectral_atlas.py</code>
          </p>

          {/* Four panels description */}
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            {ATLAS_PANELS.map(({ title, sub, note }, i) => (
              <div key={title} className="bg-white border border-surface-200 rounded-lg px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-50 border border-primary-200 text-[10px] font-bold text-primary-700">{i + 1}</span>
                  <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
                </div>
                <p className="text-xs text-primary-600 font-medium mb-1">{sub}</p>
                <p className="text-xs text-surface-500 leading-relaxed">{note}</p>
              </div>
            ))}
          </div>

          {/* Atlas generation command */}
          <div className="bg-surface-800 rounded-lg p-4">
            <p className="text-xs text-surface-400 mb-2">Generate atlas from Tanager run directory:</p>
            <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">{`python "docs/integration-package/deliverables/agrispectraq_integration_package/tools/generate_spectral_atlas.py" \\
  "docs/integration-package/AgriSpectra_Q_Google_Colab_Content_Handoff/deliverables/tanager_trust_final" \\
  --output "results/figures/planet_tanager_advanced_atlas.png" \\
  --title "Planet Tanager scientific experiment"`}</pre>
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-surface-500">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5 text-surface-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>
              The ambiguity panel describes proximity to decision boundaries — it is not calibrated measurement uncertainty.
              The red footprint identifies inspection-priority candidates — not disease, pests, or confirmed crop stress.
            </span>
          </div>
        </section>

        {/* ── 6. Geospatial integrity ──────────────────────────────────────── */}
        <section>
          <p className="section-label mb-2">GEOSPATIAL INTEGRITY</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Raster-to-Vector Verification</h2>
          <p className="text-xs text-surface-400 mb-5 leading-relaxed">
            Source:{' '}
            <code className="font-mono text-xs">deliverables/tanager_trust_final/TANAGER_GEOSPATIAL_INTEGRITY_REPORT.md</code>
          </p>

          <div className="bg-white border border-surface-200 rounded-lg overflow-hidden mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-surface-100">
              {GEOSPATIAL_METRICS.map(({ label, value, note }) => (
                <div key={label} className="px-5 py-4">
                  <div className="text-2xl font-bold text-surface-900 tabular-nums mb-1">{value}</div>
                  <div className="text-xs text-surface-500 font-medium">{label}</div>
                  {note && <div className="text-xs text-surface-400 mt-0.5">{note}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg p-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600 flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            <p className="text-xs text-surface-600 leading-relaxed">
              These values validate raster-to-vector representation for the corrected scene.
              <strong className="text-surface-800"> They are not agricultural ground-truth accuracy.</strong>{' '}
              IoU = 1.0 and F1 = 1.0 confirm that the corrected GeoJSON zones match the source raster mask exactly
              — this is a geometric integrity check, not a measure of crop-stress detection performance.
            </p>
          </div>
        </section>

        {/* ── 7. Ambiguity comparison ──────────────────────────────────────── */}
        <section>
          <p className="section-label mb-2">AMBIGUITY ANALYSIS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Reference vs V2 Ambiguity</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-surface-200 rounded-lg px-5 py-4">
              <h3 className="text-sm font-semibold text-surface-900 mb-1">Reference ambiguity proxy</h3>
              <p className="text-xs font-mono text-surface-500 mb-2">ambiguity_proxy.tif</p>
              <p className="text-xs text-surface-600 leading-relaxed">
                Proximity of each pixel to the scene-relative percentile decision thresholds.
                Higher values indicate pixels closer to a threshold boundary.
              </p>
            </div>
            <div className="bg-white border border-surface-200 rounded-lg px-5 py-4">
              <h3 className="text-sm font-semibold text-surface-900 mb-1">Ambiguity v2 (rank-robust)</h3>
              <p className="text-xs font-mono text-surface-500 mb-2">ambiguity_v2_rank_robust.tif</p>
              <p className="text-xs text-surface-600 leading-relaxed">
                Reformulation using rank-based scores, reducing sensitivity to outlier anomaly values.
                A separate method — not a replacement of the reference formulation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-surface-50 border border-surface-200 rounded-lg">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-400 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-xs text-surface-500 leading-relaxed">
              Ambiguity is an uncertainty-related proxy. It is not a calibrated probability of error,
              and v2 is not claimed to be superior without independent validation.
            </p>
          </div>
        </section>

        {/* ── 8. Artifact files ───────────────────────────────────────────── */}
        <section>
          <p className="section-label mb-2">OUTPUT ARTIFACTS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Committed Experiment Files</h2>
          <div className="bg-white border border-surface-200 rounded-lg divide-y divide-surface-100">
            {[
              { name: 'baseline_anomaly_score.tif',           kind: 'Raster',  desc: 'Baseline spectral anomaly score map' },
              { name: 'trust_anomaly_score.tif',              kind: 'Raster',  desc: 'TRUST-refined anomaly score map' },
              { name: 'ambiguity_proxy.tif',                  kind: 'Raster',  desc: 'Reference threshold ambiguity proxy' },
              { name: 'ambiguity_v2_rank_robust.tif',         kind: 'Raster',  desc: 'Rank-robust ambiguity v2' },
              { name: 'trust_priority_classes.tif',           kind: 'Raster',  desc: 'Scene-relative priority classes (INSPECT/MONITOR/ABSTAIN)' },
              { name: 'valid_pixel_mask.tif',                 kind: 'Raster',  desc: 'Valid pixel mask — NoData and cloud excluded' },
              { name: 'zones.geojson',                        kind: 'Vector',  desc: 'Initial zone polygons' },
              { name: 'zones_corrected_exact_multipart.geojson', kind: 'Vector', desc: 'Corrected multipart zones — rasterize-back verified' },
              { name: 'zones.csv',                            kind: 'Table',   desc: 'Zone statistics table' },
              { name: 'TANAGER_HDF5_METADATA.json',           kind: 'JSON',    desc: 'Full HDF5 scene metadata and provenance' },
              { name: 'repair_metrics.json',                  kind: 'JSON',    desc: 'Geometry repair statistics' },
              { name: 'TANAGER_GEOSPATIAL_INTEGRITY_REPORT.md', kind: 'Report', desc: 'Geospatial integrity verification report' },
              { name: 'tanager_advanced_atlas.png',           kind: 'Figure',  desc: 'Four-panel Advanced Spectral Atlas' },
            ].map(({ name, kind, desc }) => (
              <div key={name} className="flex items-center gap-4 px-4 py-3">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wide w-12 flex-shrink-0">{kind}</span>
                <code className="text-xs font-mono text-surface-800 flex-1 min-w-0 truncate">{name}</code>
                <span className="text-xs text-surface-400 hidden sm:block">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-surface-400 mt-2">
            Deliverables are in <code className="font-mono text-xs">docs/integration-package/AgriSpectra_Q_Google_Colab_Content_Handoff/deliverables/tanager_trust_final/</code>.
            The API seed run <code className="font-mono text-xs">TANAGER-TRUST-20250501-87-4001</code> serves these files via <code className="font-mono text-xs">/api/tanager/runs/.../files/</code>.
            Actual file names are read from the manifest — do not hard-code paths in UI.
          </p>
        </section>

        {/* ── Mandatory global disclaimer ──────────────────────────────────── */}
        <div className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg p-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-surface-900 mb-1">Scientific boundary</p>
            <p className="text-sm text-surface-600 leading-relaxed">
              AgriSpectra-Q produces relative hyperspectral evidence for agricultural inspection prioritization.
              Its outputs are not confirmed crop diagnoses.
              Independent field observations and agronomic review are required before intervention.
            </p>
            <p className="text-xs text-surface-500 mt-2 italic">
              Priority designation is not a confirmed crop diagnosis.
              Field inspection and independent agronomic evidence are required before intervention.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/research" className="btn-outline inline-flex items-center gap-2 text-sm">
            Research &amp; Evidence
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
          <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run EnMAP Live Analysis
          </Link>
        </div>

      </div>
    </div>
  )
}
