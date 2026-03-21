---
type: script_contract
version: 1.0.0
script: validate_governance.py
domain: governance
dependencies: [pyyaml]
source: "itseffi/agentic-os evals-as-regression-gate pattern"
last_updated: 2026-03-21
---

# Validate Governance — Contract

## Purpose
Automated weekly governance validation. Checks all config files for structural compliance. Acts as a regression gate (itseffi evals pattern).

## Interface
```python
validate_governance(config_dir: Path) -> dict
```

## Checks Performed
1. All `.md` files in `.agents/config/` have YAML frontmatter
2. All YAML frontmatter contains `type` and `version` fields
3. All files end with `[AUTH:]` provenance stamp
4. CHANGELOG version matches latest config `version` fields
5. WORKSPACE_ONTOLOGY has no orphaned file references
6. All workflows reference at least one SOP or context file

## Returns
```python
{
    "passed": int,
    "failed": int,
    "errors": [{"file": str, "check": str, "detail": str}],
    "status": "PASS" | "FAIL"
}
```

## On FAIL
Print errors and exit with code 1 (UU-M15 governance drift detected).

## Scheduling
```
schtasks /create /tn "Majaz_GovernanceCheck" /tr "D:\YO\.venv\Scripts\python.exe D:\YO\WS\scripts\validate_governance.py" /sc weekly /d SUN /st 20:00
```

[AUTH: Majaz_OS | contract:validate_governance | 1.0.0 | 2026-03-21]
