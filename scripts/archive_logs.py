"""
Majaz AI OS — Log Archiver & Memory Compaction
Rolls old daily logs into weekly summaries, archives completed tasks.
Source: itseffi compaction-aware + AIOS memory eviction pattern.
Contract: scripts/archive_logs.md

[AUTH: Majaz_OS | archive_logs | 1.0.0 | 2026-03-21]
"""

import re
from datetime import date, timedelta
from pathlib import Path


def _get_workspace_root() -> Path:
    """Auto-discover workspace root relative to this script."""
    return Path(__file__).resolve().parent.parent


def archive_logs(
    logs_dir: Path = None,
    archive_age_days: int = 14,
) -> dict:
    """
    Compact old daily logs into weekly summaries.

    1. Find logs older than archive_age_days
    2. Group by ISO week
    3. Create weekly summary
    4. Move originals to _legacy/logs/

    Returns:
        {"archived": N, "summaries_created": N, "errors": []}
    """
    root = _get_workspace_root()
    if logs_dir is None:
        logs_dir = root / "operations" / "logs"

    legacy_logs = root / "_legacy" / "logs"
    legacy_logs.mkdir(parents=True, exist_ok=True)

    cutoff = date.today() - timedelta(days=archive_age_days)
    archived = 0
    summaries = 0
    errors = []

    # Find old log files (YYYY-MM-DD.md format)
    log_files = sorted(logs_dir.glob("????-??-??.md"))
    old_logs = []
    for lf in log_files:
        try:
            log_date = date.fromisoformat(lf.stem)
            if log_date < cutoff:
                old_logs.append((log_date, lf))
        except ValueError:
            continue

    if not old_logs:
        print("✅ No logs to archive")
        return {"archived": 0, "summaries_created": 0, "errors": []}

    # Group by ISO week
    weeks = {}
    for log_date, log_path in old_logs:
        iso_year, iso_week, _ = log_date.isocalendar()
        week_key = f"{iso_year}-W{iso_week:02d}"
        if week_key not in weeks:
            weeks[week_key] = []
        weeks[week_key].append((log_date, log_path))

    # Create weekly summaries
    for week_key, entries in weeks.items():
        summary_path = logs_dir / f"{week_key}_summary.md"
        if summary_path.exists():
            # Don't overwrite existing summaries
            continue

        lines = [f"# Weekly Summary — {week_key}\n"]
        for log_date, log_path in sorted(entries):
            content = log_path.read_text(encoding="utf-8")
            lines.append(f"\n## {log_date.isoformat()}\n")
            # Extract key sections (skip frontmatter)
            clean = re.sub(r"^---.*?---\s*", "", content, flags=re.DOTALL)
            lines.append(clean.strip())

        lines.append(f"\n\n[AUTH: Agent | Majaz_OS | weekly_summary | {date.today().isoformat()}]")

        # Atomic write
        tmp = summary_path.with_suffix(".md.tmp")
        tmp.write_text("\n".join(lines), encoding="utf-8")
        tmp.replace(summary_path)
        summaries += 1

        # Move originals to legacy
        for _, log_path in entries:
            try:
                dest = legacy_logs / log_path.name
                log_path.rename(dest)
                archived += 1
            except Exception as e:
                errors.append(f"Failed to move {log_path.name}: {e}")

    print(f"✅ Archived {archived} logs, created {summaries} weekly summaries")
    return {"archived": archived, "summaries_created": summaries, "errors": errors}


def archive_completed_tasks(
    tasks_path: Path = None,
    legacy_dir: Path = None,
) -> dict:
    """
    Move completed tasks from tasks.md to legacy archive.

    1. Read tasks.md
    2. Extract items under ## Done
    3. Append to _legacy/tasks/YYYY-MM_archive.md
    4. Rewrite tasks.md without Done items (atomic)

    Returns:
        {"archived": N, "errors": []}
    """
    root = _get_workspace_root()
    if tasks_path is None:
        tasks_path = root / "operations" / "tasks.md"
    if legacy_dir is None:
        legacy_dir = root / "_legacy" / "tasks"

    legacy_dir.mkdir(parents=True, exist_ok=True)

    if not tasks_path.exists():
        return {"archived": 0, "errors": ["tasks.md not found"]}

    content = tasks_path.read_text(encoding="utf-8")

    # Find ## Done section
    done_match = re.search(
        r"(## Done\n)(.*?)(?=\n## |\Z)",
        content,
        re.DOTALL,
    )
    if not done_match:
        print("✅ No Done section found")
        return {"archived": 0, "errors": []}

    done_items = done_match.group(2).strip()
    if not done_items or done_items.startswith("- [ ] _"):
        print("✅ No completed tasks to archive")
        return {"archived": 0, "errors": []}

    # Count items
    item_count = len(re.findall(r"^- \[x\]", done_items, re.MULTILINE))

    # Archive to monthly file
    today = date.today()
    archive_file = legacy_dir / f"{today.strftime('%Y-%m')}_archive.md"

    archive_content = f"\n\n## Archived {today.isoformat()}\n{done_items}\n"
    with open(archive_file, "a", encoding="utf-8") as f:
        f.write(archive_content)

    # Rewrite tasks.md — clear Done section (atomic)
    new_content = content.replace(
        done_match.group(0),
        "## Done\n- [ ] _Completed tasks (archive monthly)_\n"
    )
    tmp = tasks_path.with_suffix(".md.tmp")
    tmp.write_text(new_content, encoding="utf-8")
    tmp.replace(tasks_path)

    print(f"✅ Archived {item_count} completed tasks to {archive_file.name}")
    return {"archived": item_count, "errors": []}


# --- CLI ---
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Majaz Log Archiver & Memory Compaction")
    parser.add_argument("--logs", action="store_true", help="Archive old daily logs")
    parser.add_argument("--tasks", action="store_true", help="Archive completed tasks")
    parser.add_argument("--all", action="store_true", help="Archive both logs and tasks")
    parser.add_argument("--age", type=int, default=14, help="Archive logs older than N days")
    args = parser.parse_args()

    if not (args.logs or args.tasks or args.all):
        args.all = True

    if args.logs or args.all:
        archive_logs(archive_age_days=args.age)

    if args.tasks or args.all:
        archive_completed_tasks()
