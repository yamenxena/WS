---
type: script_contract
version: 1.0.0
script: sheets_sync.py
domain: sync
dependencies: [gspread, google-auth, python-dotenv]
last_updated: 2026-03-21
---

# Sheets Sync — Contract

## Purpose
Portable bidirectional sync between `operations/crm.md` and Google Sheets.

## Interface
```python
sync_crm_to_sheet(crm_path: Path, sheet_name: str) -> dict
sync_sheet_to_crm(sheet_name: str, crm_path: Path) -> dict
```

## Behavior
1. **crm → sheet:** Parse `crm.md` Kanban, extract leads, push to Google Sheet
2. **sheet → crm:** Read Google Sheet, update `crm.md` Kanban with new entries
3. **Atomic writes:** write `crm.md.tmp` → rename to `crm.md`
4. Returns: `{"synced": N, "errors": [], "direction": "push|pull"}`

## Authentication
- Service account JSON path in `GOOGLE_SHEETS_SERVICE_ACCOUNT` env var
- Auto-discovers `.env` via `find_dotenv()`

## Circuit Breaker
- 3 consecutive 429 (rate limit) responses → raise `SheetsSyncError` → HALT
- Matches UU-M7

## AP Guards
- AP27: atomic writes (`.tmp → rename`)
- AP46: all deps in requirements.txt
- AP55: validates CSV schema before sync

## Portability
- No hardcoded paths — uses relative paths from script location
- Service account path resolved via env var

[AUTH: Majaz_OS | contract:sheets_sync | 1.0.0 | 2026-03-21]
