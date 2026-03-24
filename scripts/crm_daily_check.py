"""
CRM Daily Check — queries Notion for overdue leads and generates report.
Run daily via Windows Task Scheduler at 8 AM.
Usage: python scripts/crm_daily_check.py
"""
import requests
import json
import os
from datetime import date, datetime

# --- Config ---
NOTION_KEY = os.environ.get("NOTION_API_KEY", "")
HEADERS = {
    "Authorization": f"Bearer {NOTION_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}
LANDLORDS_DB = "32b39a01-a595-802c-b37b-e4723f2e8994"
PROJECTS_DB = "32b39a01-a595-8031-b453-c18e335772fe"
REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output", "reports")


def query_db(db_id, filter_obj=None):
    """Query a Notion database with optional filter."""
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    body = {"page_size": 100}
    if filter_obj:
        body["filter"] = filter_obj
    resp = requests.post(url, headers=HEADERS, json=body)
    if resp.status_code != 200:
        print(f"  API Error ({resp.status_code}): {resp.json().get('message', '')}")
        return []
    return resp.json().get("results", [])


def get_prop_text(page, prop_name):
    """Extract text from a title or rich_text property."""
    prop = page.get("properties", {}).get(prop_name, {})
    ptype = prop.get("type", "")
    if ptype == "title":
        items = prop.get("title", [])
        return items[0]["plain_text"] if items else "?"
    elif ptype == "rich_text":
        items = prop.get("rich_text", [])
        return items[0]["plain_text"] if items else ""
    return ""


def get_prop_date(page, prop_name):
    """Extract date string from a date property."""
    prop = page.get("properties", {}).get(prop_name, {})
    d = prop.get("date")
    if d and d.get("start"):
        return d["start"]
    return None


def get_prop_status(page, prop_name):
    """Extract status name."""
    prop = page.get("properties", {}).get(prop_name, {})
    s = prop.get("status")
    return s.get("name", "") if s else ""


def get_prop_select(page, prop_name):
    """Extract select value."""
    prop = page.get("properties", {}).get(prop_name, {})
    s = prop.get("select")
    return s.get("name", "") if s else ""


def get_prop_number(page, prop_name):
    """Extract number value."""
    prop = page.get("properties", {}).get(prop_name, {})
    return prop.get("number")


def run_daily_check():
    today = date.today()
    report_lines = []
    report_lines.append(f"# CRM Daily Check — {today.isoformat()}")
    report_lines.append(f"> Generated at {datetime.now().strftime('%H:%M')}\n")

    # === 1. Overdue Leads ===
    report_lines.append("## Overdue Leads")
    all_landlords = query_db(LANDLORDS_DB)
    overdue = []
    no_action = []
    high_priority = []

    for ll in all_landlords:
        name = get_prop_text(ll, "Name")
        due_str = get_prop_date(ll, "Due Date")
        status = get_prop_status(ll, "Lead Status")
        next_action = get_prop_text(ll, "Next Action")
        icp = get_prop_number(ll, "ICP Score")

        # Skip won/lost
        if status in ["Won", "Lost"]:
            continue

        # Overdue check
        if due_str:
            due = date.fromisoformat(due_str)
            if due < today:
                days_late = (today - due).days
                overdue.append({
                    "name": name, "due": due_str,
                    "days_late": days_late, "action": next_action,
                    "status": status, "icp": icp
                })

        # No next action
        if not next_action and status not in ["Won", "Lost"]:
            no_action.append({"name": name, "status": status, "icp": icp})

        # High priority without action
        if icp and icp >= 4 and not next_action:
            high_priority.append({"name": name, "icp": icp, "status": status})

    if overdue:
        report_lines.append(f"\n🔴 **{len(overdue)} overdue leads:**\n")
        report_lines.append("| Client | Due | Days Late | Next Action | Status |")
        report_lines.append("|--------|-----|:---------:|-------------|--------|")
        for o in sorted(overdue, key=lambda x: -x["days_late"]):
            report_lines.append(
                f"| {o['name']} | {o['due']} | {o['days_late']} | {o['action'] or '—'} | {o['status'] or '—'} |"
            )
    else:
        report_lines.append("\n✅ No overdue leads.")

    # === 2. No Next Action ===
    report_lines.append("\n## Leads Without Next Action")
    if no_action:
        report_lines.append(f"\n⚠️ **{len(no_action)} leads with no next action:**\n")
        for na in no_action:
            report_lines.append(f"- {na['name']} [{na['status'] or 'No Status'}] (ICP: {na['icp'] or '?'})")
    else:
        report_lines.append("\n✅ All active leads have next actions.")

    # === 3. High Priority Alerts ===
    report_lines.append("\n## High Priority (ICP ≥ 4) Alerts")
    if high_priority:
        report_lines.append(f"\n🟡 **{len(high_priority)} high-value leads need attention:**\n")
        for hp in high_priority:
            report_lines.append(f"- ⭐{hp['icp']} {hp['name']} [{hp['status'] or 'No Status'}]")
    else:
        report_lines.append("\n✅ All high-priority leads are being managed.")

    # === 4. Pipeline Summary ===
    report_lines.append("\n## Pipeline Summary")
    status_counts = {}
    for ll in all_landlords:
        s = get_prop_status(ll, "Lead Status") or "No Status"
        status_counts[s] = status_counts.get(s, 0) + 1

    report_lines.append("\n| Stage | Count |")
    report_lines.append("|-------|:-----:|")
    for stage in ["Inquiry", "Qualified", "Proposal", "Negotiation", "Won", "Lost", "No Status"]:
        if stage in status_counts:
            report_lines.append(f"| {stage} | {status_counts[stage]} |")
    report_lines.append(f"| **Total** | **{len(all_landlords)}** |")

    # === Write Report ===
    report_lines.append(f"\n[AUTH: Majaz_OS | crm_daily_check | {today.isoformat()}]")
    report_content = "\n".join(report_lines)

    os.makedirs(REPORT_DIR, exist_ok=True)
    report_path = os.path.join(REPORT_DIR, f"{today.isoformat()}_crm_check.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    print(f"Report saved: {report_path}")
    print(f"  Overdue: {len(overdue)} | No Action: {len(no_action)} | High Priority: {len(high_priority)}")
    return report_path


if __name__ == "__main__":
    run_daily_check()
