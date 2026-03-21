---
type: script_contract
version: 1.0.0
script: generate_report.py
domain: reporting
dependencies: []
last_updated: 2026-03-21
---

# Generate Report — Contract

## Purpose
Template-fill a supervision report from field notes. Reads the supervision template, fills variables, writes atomic output.

## Interface
```python
generate_supervision_report(
    project: str,
    inspector: str,
    visit_number: int,
    findings: list[dict],
    output_dir: Path
) -> Path
```

## Behavior
1. Load `operations/supervision/_template.md`
2. Fill template variables (date, project, inspector, visit #)
3. Insert findings table rows
4. Atomic write to `operations/supervision/YYYY-MM-DD_Project.md`
5. Returns: path to generated report

## AP Guards
- AP02: never fabricate findings — pass-through from input only
- AP27: atomic write (.tmp → rename)

[AUTH: Majaz_OS | contract:generate_report | 1.0.0 | 2026-03-21]
