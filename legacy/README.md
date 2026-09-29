# legacy/ — Historical Reference Copies

These files are **prototype scripts** from the original development environment.
They are kept for historical reference only and are **NOT** part of the active codebase.

## Why they are here

All files in this directory contain hardcoded paths to `/home/ubuntu/AgriSpectra-Q/`
and reference the old root-level engine. They do not work outside that environment
and are not called by any API, Dockerfile, or deployment configuration.

## Active codebase (use these instead)

| Purpose | Active file |
|---|---|
| Spectral anomaly engine | `backend/engine/live_matrix_engine.py` |
| Live API (Docker/gunicorn) | `api/live_matrix_api.py` |
| Demo API (hackathon) | `api/demo_api.py` |
| Production API (VPS upload-only) | `api/production_api.py` |
| Benchmark scripts | `backend/benchmark/` |
| Independent validation | `api/independent_reference_catalog.py` |

## Files in this directory

| File | Original purpose |
|---|---|
| `live_matrix_engine.py` | Root-level prototype engine (hardcoded paths) |
| `live_matrix_api.py` | Root-level prototype API (hardcoded paths) |
| `add_live_lab.py` | HTML lab injector for old dashboard |
| `advanced_decision_analysis.py` | Decision analysis on frozen predictions |
| `create_required_tables.py` | Table generator for validation report |
| `decision_intelligence_validation.py` | Decision intelligence metrics |
| `final_six_benchmark.py` | Six-model benchmark runner |
| `generate_master_outputs.py` | Master output generator |
| `make_cards.py` | Decision cards generator |
| `update_final_report.py` | Final report updater |
| `verify_live_outputs.py` | Output integrity verifier |
