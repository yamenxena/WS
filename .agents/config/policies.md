---
type: config
version: 1.0.0
last_updated: 2026-03-21
---

# Policies

## §1 Idempotency

All operations must be replay-safe. Running the same task twice must not create duplicates or corrupt data.

## §2 Validation Gates

No unvalidated pass-through. Every agent output must be reviewed (PLAN/PROCEED) before advancing to the next phase.

## §3 Handoff Protocol

Cross-provider handoff (Gemini ↔ Claude) follows `dialogue-protocol.md §5`. Do not duplicate handoff rules here.

## §4 TTL on Shared Artifacts

Shared artifacts in `output/` have a 24-hour TTL. After 24h, they should be archived or explicitly renewed.

## §5 Naming Convention

All output files: `YYYY-MM-DD_Action_Description.ext`
Examples:
- `2026-03-21_Lead_Reply_AhmedK.md`
- `2026-03-21_Supervision_VillaReem.md`

## §6 Provenance

Every agent output must end with:
```
[AUTH: Agent | Majaz_OS | source:VERSION | DATE]
```

## §7 Python Environment

All Python execution via `D:\YO\.venv` only. All dependencies in `requirements.txt`. Scripts in workspace are portable — no hardcoded absolute paths. Use `os.path` or env vars for path resolution.

## §8 Evidence-First

Agent must cite `[SOURCE: filepath]` for every factual claim in outputs. Outputs without citations violate AP68 (Evidence Omission) and are invalid.

Examples:
- `[SOURCE: context/strategy.md]` — for business goals
- `[SOURCE: context/icp.md]` — for client profile data
- `[SOURCE: context/sops/municipality_approval.md]` — for process steps

[AUTH: Majaz_OS | policies | 1.0.0 | 2026-03-21]
