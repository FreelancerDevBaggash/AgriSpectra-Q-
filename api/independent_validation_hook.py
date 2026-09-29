#!/usr/bin/env python3
"""Start independent validation after a model run without changing model output."""
from __future__ import annotations
import json
import subprocess
import sys
from pathlib import Path


def start_after_analysis(root: Path, run_dir: Path, enmap_date: str | None = None) -> dict:
    """Launch validation in a separate process and return immediately.

    The model request is not blocked by Planetary Computer latency. The hook
    writes a status file so the UI/integration layer can distinguish pending
    validation from a completed artifact.
    """
    script = Path(__file__).resolve().parent / "auto_independent_validation.py"
    status_path = root / "results" / "independent_references" / run_dir.name / "validation_status.json"
    status_path.parent.mkdir(parents=True, exist_ok=True)
    if not script.exists():
        payload = {"status": "Not Available", "reason": "Automatic validation script is not installed."}
        status_path.write_text(json.dumps(payload, indent=2) + "\n")
        return payload
    cmd = [sys.executable, str(script), "--run-dir", str(run_dir), "--output-root", str(root)]
    if enmap_date:
        cmd += ["--enmap-date", enmap_date]
    log_path = status_path.with_suffix(".log")
    with log_path.open("ab") as log:
        proc = subprocess.Popen(cmd, stdout=log, stderr=subprocess.STDOUT, cwd=str(script.parent))
    payload = {"status": "Pending", "pid": proc.pid, "run_id": run_dir.name}
    status_path.write_text(json.dumps(payload, indent=2) + "\n")
    return payload
