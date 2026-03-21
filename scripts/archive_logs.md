---
type: script_contract
version: 1.0.0
script: archive_logs.py
domain: memory_management
dependencies: []
source: "itseffi compaction-aware + AIOS memory eviction pattern"
last_updated: 2026-03-21
---

# Archive Logs — Contract

## Purpose
Memory compaction: roll old daily logs into weekly summaries, archive completed tasks. Prevents context window bloat as workspace grows.

## Interface
```python
archive_logs(logs_dir: Path, archive_age_days: int = 14) -> dict
archive_completed_tasks(tasks_path: Path, legacy_dir: Path) -> dict
```

## Behavior

### Log Compaction
1. Scan `operations/logs/` for files older than `archive_age_days`
2. Group by ISO week
3. Merge into `operations/logs/YYYY-Www_summary.md` (weekly rollup)
4. Move originals to `_legacy/logs/`

### Task Archival
1. Read `operations/tasks.md`
2. Extract items under `## Done`
3. Move to `_legacy/tasks/YYYY-MM_archive.md`
4. Atomic rewrite of `tasks.md` without archived items

## Scheduling
```
schtasks /create /tn "Majaz_ArchiveLogs" /tr "D:\YO\.venv\Scripts\python.exe D:\YO\WS\scripts\archive_logs.py" /sc weekly /d SUN /st 22:00
```

## AP Guards
- AP27: atomic writes on tasks.md
- UU-M15: prevents context window bloat

[AUTH: Majaz_OS | contract:archive_logs | 1.0.0 | 2026-03-21]
