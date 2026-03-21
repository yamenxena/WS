"""
Majaz AI OS — Daily Log Creator
Idempotent: creates today's log only if it doesn't exist.
Contract: scripts/daily_log.md

[AUTH: Majaz_OS | daily_log | 1.0.0 | 2026-03-21]
"""

from datetime import date
from pathlib import Path


def _get_logs_dir() -> Path:
    """Auto-discover operations/logs/ relative to this script."""
    return Path(__file__).resolve().parent.parent / "operations" / "logs"


def create_daily_log(logs_dir: Path = None) -> Path:
    """
    Create today's session log if it doesn't exist (idempotent).

    Args:
        logs_dir: Path to logs directory. Auto-discovers if None.

    Returns:
        Path to today's log file.
    """
    if logs_dir is None:
        logs_dir = _get_logs_dir()

    logs_dir.mkdir(parents=True, exist_ok=True)

    today = date.today().isoformat()
    log_path = logs_dir / f"{today}.md"

    if log_path.exists():
        print(f"✅ Log already exists: {log_path.name}")
        return log_path

    content = f"""# Session Log — {today}

## Session Info
- **Model:** 
- **Phase:** 
- **Duration:** 
- **Messages:** 

## Files Created


## Files Modified


## Verification


## Issues


[AUTH: Agent | Majaz_OS | session_log | {today}]
"""

    log_path.write_text(content, encoding="utf-8")
    print(f"✅ Created: {log_path.name}")
    return log_path


if __name__ == "__main__":
    create_daily_log()
