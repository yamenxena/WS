"""
Majaz AI OS — Supervision Report Generator
Template-fill from field notes into structured report.
Contract: scripts/generate_report.md

[AUTH: Majaz_OS | generate_report | 1.0.0 | 2026-03-21]
"""

from datetime import date
from pathlib import Path


def _get_workspace_root() -> Path:
    """Auto-discover workspace root relative to this script."""
    return Path(__file__).resolve().parent.parent


def generate_supervision_report(
    project: str,
    inspector: str,
    visit_number: int,
    findings: list[dict],
    weather: str = "Clear",
    output_dir: Path = None,
) -> Path:
    """
    Generate a supervision report from field note data.

    Args:
        project: Project name
        inspector: Inspector name
        visit_number: Visit number
        findings: List of dicts with keys: item, severity, photo_ref, action, deadline
        weather: Weather conditions
        output_dir: Output directory. Auto-discovers if None.

    Returns:
        Path to generated report.
    """
    root = _get_workspace_root()
    if output_dir is None:
        output_dir = root / "operations" / "supervision"

    output_dir.mkdir(parents=True, exist_ok=True)

    today = date.today().isoformat()
    safe_project = project.replace(" ", "")

    # Build findings table
    findings_rows = []
    for i, f in enumerate(findings, 1):
        row = (
            f"| {i} "
            f"| {f.get('item', '')} "
            f"| {f.get('severity', 'Observation')} "
            f"| {f.get('photo_ref', '')} "
            f"| {f.get('action', '')} "
            f"| {f.get('deadline', '')} "
            f"| Open |"
        )
        findings_rows.append(row)

    findings_table = "\n".join(findings_rows) if findings_rows else "| — | No findings | — | — | — | — | — |"

    content = f"""---
type: output
workflow: supervision
project: {project}
date: {today}
inspector: {inspector}
visit_number: {visit_number}
---

# Supervision Report — {today} — {project}

**Inspector:** {inspector}
**Visit #:** {visit_number}
**Weather:** {weather}

## Findings

| # | Item | Severity | Photo Ref | Action Required | Deadline | Status |
|---|------|----------|-----------|----------------|----------|--------|
{findings_table}

## General Observations


## Next Visit
- Date:
- Focus:

[AUTH: Agent | Majaz_OS | workflow:supervision | {today}]
"""

    # Atomic write
    output_path = output_dir / f"{today}_{safe_project}.md"
    tmp_path = output_path.with_suffix(".md.tmp")
    tmp_path.write_text(content, encoding="utf-8")
    tmp_path.replace(output_path)

    print(f"✅ Report generated: {output_path.name}")
    return output_path


# --- CLI ---
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Generate supervision report")
    parser.add_argument("--project", required=True, help="Project name")
    parser.add_argument("--inspector", required=True, help="Inspector name")
    parser.add_argument("--visit", type=int, required=True, help="Visit number")
    parser.add_argument("--findings", default="[]",
                        help='JSON array of findings, e.g. \'[{"item":"crack","severity":"Major"}]\'')
    parser.add_argument("--weather", default="Clear", help="Weather conditions")
    args = parser.parse_args()

    findings_data = json.loads(args.findings)
    generate_supervision_report(
        project=args.project,
        inspector=args.inspector,
        visit_number=args.visit,
        findings=findings_data,
        weather=args.weather,
    )
