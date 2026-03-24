"""
Notion CRM Webhook Automations — Flask listener for real-time triggers.
Handles: Lead Won → auto-create Project, Overdue → flag lead.
Usage:
  python scripts/notion_crm_automations.py          # Start webhook listener
  python scripts/notion_crm_automations.py --check  # Run overdue check only
Setup:
  1. pip install flask requests
  2. ngrok http 5050 (for public URL)
  3. Register webhook in Notion: Integration Settings → Webhooks → Add URL
"""
import requests
import json
import os
import sys
import logging
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
INTERACTIONS_DB = "32c39a01-a595-81e9-9781-e4784472cacf"

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "operations", "logs")
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "crm_automation.log"),
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)


def query_db(db_id, filter_obj=None):
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    body = {"page_size": 100}
    if filter_obj:
        body["filter"] = filter_obj
    resp = requests.post(url, headers=HEADERS, json=body)
    return resp.json().get("results", []) if resp.status_code == 200 else []


def get_page(page_id):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    resp = requests.get(url, headers=HEADERS)
    return resp.json() if resp.status_code == 200 else None


def create_page(db_id, properties):
    url = "https://api.notion.com/v1/pages"
    body = {
        "parent": {"database_id": db_id},
        "properties": properties
    }
    resp = requests.post(url, headers=HEADERS, json=body)
    return resp.status_code, resp.json()


def update_page(page_id, properties):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    resp = requests.patch(url, headers=HEADERS, json={"properties": properties})
    return resp.status_code


# =============================================
# AUTOMATION 1: Create project when lead is Won
# =============================================
def auto_create_project(page_id):
    """When Lead Status → Won, create a PROJECTS entry."""
    page = get_page(page_id)
    if not page:
        return

    name_items = page["properties"].get("Name", {}).get("title", [])
    name = name_items[0]["plain_text"] if name_items else "Unknown"

    # Check if project already exists for this landlord
    existing = query_db(PROJECTS_DB, {
        "property": "LIST OF LANDLORDS",
        "relation": {"contains": page_id}
    })
    if existing:
        logging.info(f"Project already exists for {name}, skipping")
        return

    # Get service interest
    svc = page["properties"].get("Service Interest", {}).get("select")
    svc_name = svc["name"] if svc else "DESIGN"

    # Create project
    status, result = create_page(PROJECTS_DB, {
        "Project Name": {"title": [{"text": {"content": f"NEW-{name}"}}]},
        "LIST OF LANDLORDS": {"relation": [{"id": page_id}]},
        "Service Type": {"select": {"name": svc_name if svc_name != "BOTH" else "DESIGN"}},
    })
    if status == 200:
        logging.info(f"AUTO: Created project for {name} (ID: {result.get('id', '?')[:12]})")
        print(f"  ✅ Created project: NEW-{name}")
    else:
        logging.error(f"Failed to create project for {name}: {result.get('message', '')}")
        print(f"  ❌ Failed: {result.get('message', '')}")


# =============================================
# AUTOMATION 2: Flag overdue leads
# =============================================
def check_overdue_leads():
    """Check all leads for overdue Due Dates and flag them."""
    today = date.today()
    landlords = query_db(LANDLORDS_DB)
    overdue_count = 0

    for ll in landlords:
        props = ll.get("properties", {})
        status = props.get("Lead Status", {}).get("status", {}).get("name", "")
        if status in ["Won", "Lost"]:
            continue

        due_prop = props.get("Due Date", {}).get("date")
        if not due_prop or not due_prop.get("start"):
            continue

        due = date.fromisoformat(due_prop["start"])
        if due < today:
            days_late = (today - due).days
            name_items = props.get("Name", {}).get("title", [])
            name = name_items[0]["plain_text"] if name_items else "?"

            # Update Next Action with overdue flag
            current_action = ""
            action_items = props.get("Next Action", {}).get("rich_text", [])
            if action_items:
                current_action = action_items[0].get("plain_text", "")

            if not current_action.startswith("⚠️"):
                new_action = f"⚠️ OVERDUE {days_late}d — {current_action}" if current_action else f"⚠️ OVERDUE by {days_late} days — follow up immediately"
                code = update_page(ll["id"], {
                    "Next Action": {"rich_text": [{"text": {"content": new_action[:2000]}}]}
                })
                if code == 200:
                    overdue_count += 1
                    logging.warning(f"OVERDUE: {name} ({days_late}d late)")
                    print(f"  ⚠️ {name}: {days_late}d overdue — flagged")

    print(f"\n  Flagged {overdue_count} overdue leads")
    return overdue_count


# =============================================
# AUTOMATION 3: Log interaction
# =============================================
def log_interaction(client_id, interaction_type, summary, project_id=None):
    """Create an INTERACTIONS entry."""
    props = {
        "Interaction": {"title": [{"text": {"content": summary[:100]}}]},
        "Date": {"date": {"start": date.today().isoformat()}},
        "Type": {"select": {"name": interaction_type}},
        "Summary": {"rich_text": [{"text": {"content": summary}}]},
        "Client": {"relation": [{"id": client_id}]},
    }
    if project_id:
        props["Project"] = {"relation": [{"id": project_id}]}

    status, result = create_page(INTERACTIONS_DB, props)
    if status == 200:
        logging.info(f"Logged interaction: {interaction_type} for {client_id[:8]}")
        print(f"  ✅ Interaction logged")
    else:
        print(f"  ❌ Failed: {result.get('message', '')}")


# =============================================
# WEBHOOK LISTENER (requires Flask)
# =============================================
def start_webhook_listener():
    try:
        from flask import Flask, request, jsonify
    except ImportError:
        print("Flask not installed. Run: pip install flask")
        print("Then: python scripts/notion_crm_automations.py")
        return

    app = Flask(__name__)

    @app.route("/webhook/notion", methods=["POST"])
    def handle_webhook():
        event = request.json
        event_type = event.get("type", "")
        page_id = event.get("data", {}).get("page_id", "")

        logging.info(f"Webhook: {event_type} for {page_id[:12]}")

        if event_type == "page.properties_updated" and page_id:
            page = get_page(page_id)
            if page:
                parent_db = page.get("parent", {}).get("database_id", "")
                if parent_db == LANDLORDS_DB:
                    status = page["properties"].get("Lead Status", {}).get("status", {}).get("name", "")
                    if status == "Won":
                        auto_create_project(page_id)

        return jsonify({"ok": True}), 200

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "time": datetime.now().isoformat()}), 200

    print("Starting CRM webhook listener on port 5050...")
    print("Register this URL in Notion: https://<your-ngrok-url>/webhook/notion")
    app.run(host="0.0.0.0", port=5050)


# =============================================
# CLI
# =============================================
if __name__ == "__main__":
    if "--check" in sys.argv:
        print("Running overdue check...")
        check_overdue_leads()
    elif "--test-project" in sys.argv:
        # Test: create a project for first Won lead
        landlords = query_db(LANDLORDS_DB)
        for ll in landlords:
            s = ll["properties"].get("Lead Status", {}).get("status", {}).get("name", "")
            if s == "Won":
                auto_create_project(ll["id"])
                break
    else:
        start_webhook_listener()
