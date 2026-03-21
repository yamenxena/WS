---
type: script_contract
version: 1.0.0
script: daily_log.py
domain: logging
dependencies: []
last_updated: 2026-03-21
---

# Daily Log — Contract

## Purpose
Create daily session log file. Idempotent: skips if today's log already exists.

## Interface
```python
create_daily_log(logs_dir: Path) -> Path
```

## Behavior
1. Check if `operations/logs/YYYY-MM-DD.md` exists
2. If exists: skip (idempotent — AP27)
3. If not: create with header template (date, empty metrics)
4. Returns: path to log file

## Scheduling
```
schtasks /create /tn "Majaz_DailyLog" /tr "D:\YO\.venv\Scripts\python.exe D:\YO\WS\scripts\daily_log.py" /sc daily /st 08:00
```

## Portability
- Auto-discovers `operations/logs/` relative to script location
- No hardcoded absolute paths in script code

[AUTH: Majaz_OS | contract:daily_log | 1.0.0 | 2026-03-21]
