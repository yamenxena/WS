"""
Compute CRM Fields — agent-computed equivalents of Notion formulas/rollups.
Populates Urgency, Days Silent, CLV by querying Notion and writing back.
Usage: python scripts/compute_crm_fields.py
"""
import requests
import json
import os
from datetime import date

# --- Config ---
NOTION_KEY = os.environ.get("NOTION_API_KEY", "")
HEADERS = {
    "Authorization": f"Bearer {NOTION_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}
LANDLORDS_DB = "32b39a01-a595-802c-b37b-e4723f2e8994"
PROJECTS_DB = "32b39a01-a595-8031-b453-c18e335772fe"


def query_db(db_id):
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    resp = requests.post(url, headers=HEADERS, json={"page_size": 100})
    return resp.json().get("results", []) if resp.status_code == 200 else []


def update_page(page_id, properties):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    resp = requests.patch(url, headers=HEADERS, json={"properties": properties})
    return resp.status_code


def compute_all():
    today = date.today()
    landlords = query_db(LANDLORDS_DB)
    projects = query_db(PROJECTS_DB)

    # Build project value map: landlord_id -> total value
    landlord_values = {}
    landlord_project_count = {}
    for proj in projects:
        props = proj.get("properties", {})
        value = props.get("Value", {}).get("number") or 0
        # Check both relation properties
        for rel_key in ["LIST OF LANDLORDS", "Projects of Clients"]:
            for rel in props.get(rel_key, {}).get("relation", []):
                lid = rel["id"]
                landlord_values[lid] = landlord_values.get(lid, 0) + value
                landlord_project_count[lid] = landlord_project_count.get(lid, 0) + 1

    updated = 0
    for ll in landlords:
        page_id = ll["id"]
        props = ll.get("properties", {})
        name_items = props.get("Name", {}).get("title", [])
        name = name_items[0]["plain_text"] if name_items else "?"

        status_prop = props.get("Lead Status", {}).get("status")
        status = status_prop.get("name", "") if status_prop else ""

        # Skip won/lost for urgency
        if status in ["Won", "Lost"]:
            continue

        updates = {}

        # --- Due Date → Urgency text ---
        due_prop = props.get("Due Date", {}).get("date")
        if due_prop and due_prop.get("start"):
            due = date.fromisoformat(due_prop["start"])
            days_until = (due - today).days
            if days_until < 0:
                urgency = f"🔴 OVERDUE by {abs(days_until)}d"
            elif days_until <= 3:
                urgency = f"🟡 Due in {days_until}d"
            else:
                urgency = f"🟢 {days_until}d remaining"
            updates["Next Action"] = {
                "rich_text": [{
                    "text": {"content": (props.get("Next Action", {}).get("rich_text", [{}])[0].get("plain_text", "") or urgency)}
                }]
            }

        # --- Last Contacted → compute days silent ---
        lc_prop = props.get("Last Contacted", {}).get("date")
        if lc_prop and lc_prop.get("start"):
            lc = date.fromisoformat(lc_prop["start"])
            days_silent = (today - lc).days
            if days_silent > 14:
                print(f"  ⚠️ {name}: {days_silent} days silent!")

        # --- CLV from project values ---
        clv = landlord_values.get(page_id, 0)
        if clv > 0:
            # Only write if there's no existing Budget and CLV is known
            current_budget = props.get("Budget (AED)", {}).get("number")
            if not current_budget:
                updates["Budget (AED)"] = {"number": clv}

        if updates:
            code = update_page(page_id, updates)
            if code == 200:
                updated += 1
                print(f"  OK: {name} — {list(updates.keys())}")
            else:
                print(f"  FAIL: {name} ({code})")

    print(f"\nComputed fields for {updated}/{len(landlords)} landlords")


if __name__ == "__main__":
    compute_all()
