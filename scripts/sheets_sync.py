"""
Majaz AI OS — Google Sheets Sync
Portable bidirectional sync: operations/crm.md <-> Google Sheets.
Contract: scripts/sheets_sync.md

[AUTH: Majaz_OS | sheets_sync | 1.0.0 | 2026-03-21]
"""

import os
import re
import sys
import tempfile
from pathlib import Path

try:
    from dotenv import load_dotenv, find_dotenv
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install gspread google-auth python-dotenv")
    sys.exit(1)


class SheetsSyncError(Exception):
    """Raised when Google Sheets sync fails."""
    pass


# --- Environment ---

def _load_env():
    """Auto-discover and load .env file."""
    env_path = find_dotenv(usecwd=True)
    if not env_path:
        script_dir = Path(__file__).resolve().parent
        for candidate in [script_dir.parent / ".env", script_dir.parent.parent / ".env"]:
            if candidate.exists():
                env_path = str(candidate)
                break
    if env_path:
        load_dotenv(env_path)


def _get_sheets_client() -> gspread.Client:
    """Authenticate with Google Sheets via service account."""
    _load_env()
    sa_path = os.getenv("GOOGLE_SHEETS_SERVICE_ACCOUNT")
    if not sa_path:
        raise SheetsSyncError(
            "GOOGLE_SHEETS_SERVICE_ACCOUNT not set. "
            "Point it to your service account JSON file in .env"
        )
    if not Path(sa_path).exists():
        raise SheetsSyncError(f"Service account file not found: {sa_path}")

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(sa_path, scopes=scopes)
    return gspread.authorize(creds)


# --- CRM Parsing ---

def _parse_crm_leads(crm_path: Path) -> list[dict]:
    """
    Parse Kanban-style crm.md and extract lead entries.
    Expected format: - [ ] **Name** | ICP: X | Source: Y | ...
    """
    if not crm_path.exists():
        raise SheetsSyncError(f"CRM file not found: {crm_path}")

    content = crm_path.read_text(encoding="utf-8")
    leads = []
    current_status = "Unknown"

    for line in content.splitlines():
        # Detect Kanban headers (## New, ## Contacted, etc.)
        header_match = re.match(r"^##\s+(.+)$", line.strip())
        if header_match:
            current_status = header_match.group(1).strip()
            continue

        # Detect lead entries: - [ ] **Name** | key: value | ...
        lead_match = re.match(
            r"^-\s+\[.\]\s+\*\*(.+?)\*\*\s*\|(.+)$", line.strip()
        )
        if lead_match:
            name = lead_match.group(1).strip()
            fields_str = lead_match.group(2)
            fields = {}
            for pair in fields_str.split("|"):
                if ":" in pair:
                    key, val = pair.split(":", 1)
                    fields[key.strip()] = val.strip()
            leads.append({
                "Client": name,
                "Status": current_status,
                "ICP Score": fields.get("ICP", ""),
                "Source": fields.get("Source", ""),
                "Budget": fields.get("Budget", ""),
                "Location": fields.get("Location", ""),
                "Next Action": fields.get("Next", ""),
                "Date Added": fields.get("Added", ""),
            })

    return leads


# --- Sync Operations ---

def sync_crm_to_sheet(
    crm_path: Path,
    sheet_name: str,
    max_retries: int = 3,
) -> dict:
    """
    Push CRM leads from crm.md to Google Sheet.

    Args:
        crm_path: Path to operations/crm.md
        sheet_name: Name of the Google Sheet to update
        max_retries: Circuit breaker threshold

    Returns:
        {"synced": N, "errors": [], "direction": "push"}
    """
    leads = _parse_crm_leads(crm_path)
    if not leads:
        return {"synced": 0, "errors": ["No leads found in CRM"], "direction": "push"}

    errors = []
    for attempt in range(max_retries):
        try:
            client = _get_sheets_client()
            sheet = client.open(sheet_name).sheet1

            # Clear and rewrite (simple sync strategy)
            headers = ["Client", "Status", "ICP Score", "Source",
                       "Budget", "Location", "Next Action", "Date Added"]
            rows = [headers]
            for lead in leads:
                rows.append([lead.get(h, "") for h in headers])

            sheet.clear()
            sheet.update(range_name="A1", values=rows)

            return {"synced": len(leads), "errors": [], "direction": "push"}

        except Exception as e:
            errors.append(f"Attempt {attempt + 1}: {e}")

    # Circuit breaker: 3 consecutive failures
    raise SheetsSyncError(
        f"Sheets sync failed after {max_retries} attempts.\n"
        + "\n".join(errors)
    )


def sync_sheet_to_crm(
    sheet_name: str,
    crm_path: Path,
    max_retries: int = 3,
) -> dict:
    """
    Pull leads from Google Sheet and update crm.md (atomic write).

    Args:
        sheet_name: Name of the Google Sheet to read
        crm_path: Path to operations/crm.md
        max_retries: Circuit breaker threshold

    Returns:
        {"synced": N, "errors": [], "direction": "pull"}
    """
    errors = []
    for attempt in range(max_retries):
        try:
            client = _get_sheets_client()
            sheet = client.open(sheet_name).sheet1
            records = sheet.get_all_records()

            if not records:
                return {"synced": 0, "errors": ["Sheet is empty"], "direction": "pull"}

            # Build Kanban markdown
            statuses = {}
            for rec in records:
                status = rec.get("Status", "New")
                if status not in statuses:
                    statuses[status] = []
                statuses[status].append(rec)

            lines = [
                "---",
                "type: lead",
                "version: 1.0.0",
                "kanban-plugin: basic",
                f"last_updated: {__import__('datetime').date.today().isoformat()}",
                "---",
                "",
                "# CRM Pipeline",
                "",
            ]

            for status_name in ["New", "Contacted", "Qualified",
                                "Proposal Sent", "Won", "Lost"]:
                lines.append(f"## {status_name}")
                leads_in_status = statuses.get(status_name, [])
                if leads_in_status:
                    for lead in leads_in_status:
                        parts = [f"**{lead.get('Client', '?')}**"]
                        if lead.get("ICP Score"):
                            parts.append(f"ICP: {lead['ICP Score']}")
                        if lead.get("Source"):
                            parts.append(f"Source: {lead['Source']}")
                        if lead.get("Budget"):
                            parts.append(f"Budget: {lead['Budget']}")
                        if lead.get("Location"):
                            parts.append(f"Location: {lead['Location']}")
                        if lead.get("Next Action"):
                            parts.append(f"Next: {lead['Next Action']}")
                        if lead.get("Date Added"):
                            parts.append(f"Added: {lead['Date Added']}")
                        lines.append(f"- [ ] {' | '.join(parts)}")
                else:
                    lines.append("- [ ] _No leads_")
                lines.append("")

            content = "\n".join(lines)

            # Atomic write: .tmp -> rename
            tmp_path = crm_path.with_suffix(".md.tmp")
            tmp_path.write_text(content, encoding="utf-8")
            tmp_path.replace(crm_path)

            return {"synced": len(records), "errors": [], "direction": "pull"}

        except SheetsSyncError:
            raise
        except Exception as e:
            errors.append(f"Attempt {attempt + 1}: {e}")

    raise SheetsSyncError(
        f"Sheets sync failed after {max_retries} attempts.\n"
        + "\n".join(errors)
    )


# --- CLI ---

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Majaz CRM <-> Google Sheets Sync")
    parser.add_argument("direction", choices=["push", "pull"],
                        help="push: crm.md -> Sheet | pull: Sheet -> crm.md")
    parser.add_argument("--sheet", default="Majaz CRM",
                        help="Google Sheet name (default: 'Majaz CRM')")
    parser.add_argument("--crm", default=None,
                        help="Path to crm.md (default: auto-discover)")
    args = parser.parse_args()

    # Auto-discover crm.md relative to script
    if args.crm:
        crm = Path(args.crm)
    else:
        crm = Path(__file__).resolve().parent.parent / "operations" / "crm.md"

    try:
        if args.direction == "push":
            result = sync_crm_to_sheet(crm, args.sheet)
        else:
            result = sync_sheet_to_crm(args.sheet, crm)

        print(f"✅ Sync complete ({result['direction']}): {result['synced']} leads")
        if result["errors"]:
            for err in result["errors"]:
                print(f"  ⚠️ {err}")

    except SheetsSyncError as e:
        print(f"❌ Sync failed: {e}", file=sys.stderr)
        sys.exit(1)
