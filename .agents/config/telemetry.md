---
type: config
version: 1.0.0
last_updated: 2026-03-21
---

# Telemetry

## Session Metrics

Track these 6 metrics during every session:

| Metric | Description |
|--------|------------|
| `model` | Which model is active (Gemini Pro 3.1 / Claude 4.6 Opus) |
| `msg_count` | Message count in current session |
| `files_modified` | List of files created, modified, or deleted |
| `phase` | Current phase (0-5) |
| `last_audit` | Date of last governance validation |
| `session_duration` | Approximate session length |

## Session Finalization

At end of every session:
1. Compile metrics above
2. Append entry to `WORKSPACE_LEDGER.md`
3. Update `operations/tasks.md` with completed items
4. Log summary to `operations/logs/YYYY-MM-DD.md`

[AUTH: Majaz_OS | telemetry | 1.0.0 | 2026-03-21]
