"""
Majaz CRM API — Full CRUD proxy for all 10 Notion databases.
Usage: D:\\YO\\.venv\\Scripts\\python.exe scripts/notion_web_proxy.py
"""
import os
import time
import re
import functools
from datetime import date, datetime

import jwt
import requests
from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ══════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════
NOTION_KEY = os.environ.get("NOTION_API_KEY", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "majaz-crm-2026-secret-key")
HEADERS = {
    "Authorization": f"Bearer {NOTION_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# ── Database IDs ──
DB = {
    "projects":       "32b39a01-a595-8031-b453-c18e335772fe",
    "tasks":          "32b39a01-a595-80cb-903a-d341d2ae9b49",
    "clients":        "32b39a01-a595-802c-b37b-e4723f2e8994",
    "interactions":   "32c39a01-a595-81e9-9781-e4784472cacf",
    "meetings":       "32c39a01-a595-8049-b1da-dbbe89473309",
    "pipeline":       "32c39a01-a595-806a-a8cd-eeeac94f31ba",
    "stage_cards":    "32c39a01-a595-80a3-b074-d9a3ebb810d7",
    "suppliers":      "32c39a01-a595-80e4-8378-dec2b3542223",
    "team":           "32b39a01-a595-805d-9207-c50a008a280e",
    "concept_plans":  "32b39a01-a595-801b-ac03-c0ab854337c8",
}

# ══════════════════════════════════════════════════════════════
# HELPERS — Notion field extraction
# ══════════════════════════════════════════════════════════════

def _txt(prop):
    """Extract text from title or rich_text."""
    if not prop:
        return ""
    t = prop.get("type", "")
    if t == "title":
        return prop["title"][0]["plain_text"] if prop.get("title") else ""
    if t == "rich_text":
        return prop["rich_text"][0]["plain_text"] if prop.get("rich_text") else ""
    return ""

def _sel(prop):
    """Extract select value."""
    if not prop or not prop.get("select"):
        return ""
    return prop["select"]["name"]

def _msel(prop):
    """Extract multi_select values."""
    if not prop or not prop.get("multi_select"):
        return []
    return [o["name"] for o in prop["multi_select"]]

def _status(prop):
    """Extract status value."""
    if not prop or not prop.get("status"):
        return ""
    return prop["status"]["name"]

def _num(prop):
    """Extract number."""
    if not prop:
        return None
    return prop.get("number")

def _date(prop):
    """Extract date start."""
    if not prop or not prop.get("date"):
        return None
    return prop["date"].get("start")

def _phone(prop):
    """Extract phone_number."""
    if not prop:
        return ""
    return prop.get("phone_number") or ""

def _email(prop):
    """Extract email."""
    if not prop:
        return ""
    return prop.get("email") or ""

def _url(prop):
    """Extract url."""
    if not prop:
        return ""
    return prop.get("url") or ""

def _people(prop):
    """Extract people names."""
    if not prop or not prop.get("people"):
        return []
    return [p.get("name", "") for p in prop["people"]]

def _relation_ids(prop):
    """Extract relation page IDs."""
    if not prop or not prop.get("relation"):
        return []
    return [r["id"] for r in prop["relation"]]

def _formula(prop):
    """Extract formula result."""
    if not prop or not prop.get("formula"):
        return None
    f = prop["formula"]
    return f.get("string") or f.get("number") or f.get("date", {}).get("start") or f.get("boolean")

def _rollup(prop):
    """Extract rollup result."""
    if not prop or not prop.get("rollup"):
        return None
    r = prop["rollup"]
    if r.get("type") == "number":
        return r.get("number")
    if r.get("type") == "array":
        results = []
        for item in r.get("array", []):
            if item.get("type") == "number":
                results.append(item.get("number"))
            elif item.get("type") == "status":
                results.append(item.get("status", {}).get("name", ""))
        return results
    return None

def _uid(prop):
    """Extract unique_id."""
    if not prop or not prop.get("unique_id"):
        return ""
    u = prop["unique_id"]
    prefix = u.get("prefix", "")
    num = u.get("number", "")
    return f"{prefix}-{num}" if prefix else str(num)

def _files(prop):
    """Extract file URLs."""
    if not prop or not prop.get("files"):
        return []
    return [f.get("external", {}).get("url") or f.get("file", {}).get("url", "") for f in prop["files"]]

def _created(page):
    return page.get("created_time", "")[:10]

def _edited(page):
    return page.get("last_edited_time", "")[:10]


# ══════════════════════════════════════════════════════════════
# NOTION API — Query / Get / Patch / Create
# ══════════════════════════════════════════════════════════════

def notion_query(db_id, filter_obj=None, sorts=None, page_size=100):
    """Query a Notion database. Returns all pages (handles pagination)."""
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    body = {"page_size": min(page_size, 100)}
    if filter_obj:
        body["filter"] = filter_obj
    if sorts:
        body["sorts"] = sorts

    all_results = []
    has_more = True
    cursor = None

    while has_more:
        if cursor:
            body["start_cursor"] = cursor
        resp = requests.post(url, headers=HEADERS, json=body)
        if resp.status_code != 200:
            return all_results
        data = resp.json()
        all_results.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        cursor = data.get("next_cursor")
        if has_more:
            time.sleep(0.35)

    return all_results


def notion_get_page(page_id):
    """Get a single Notion page."""
    resp = requests.get(f"https://api.notion.com/v1/pages/{page_id}", headers=HEADERS)
    return resp.json() if resp.status_code == 200 else None


def notion_patch_page(page_id, properties):
    """Update a Notion page's properties."""
    resp = requests.patch(
        f"https://api.notion.com/v1/pages/{page_id}",
        headers=HEADERS,
        json={"properties": properties}
    )
    return resp.status_code == 200, resp.json()


def notion_create_page(db_id, properties):
    """Create a new page in a Notion database."""
    resp = requests.post(
        "https://api.notion.com/v1/pages",
        headers=HEADERS,
        json={"parent": {"database_id": db_id}, "properties": properties}
    )
    return resp.status_code == 200, resp.json()


# ══════════════════════════════════════════════════════════════
# AUTH — JWT Middleware
# ══════════════════════════════════════════════════════════════

def require_auth(f):
    """JWT auth decorator. Pass ?no_auth=1 in dev to bypass."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        # Dev bypass
        if os.environ.get("MAJAZ_DEV") == "1" or request.args.get("no_auth") == "1":
            return f(*args, **kwargs)
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Missing auth token"}), 401
        try:
            jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Login and get a JWT token."""
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")
    # Simple credential check — configurable via env
    valid_user = os.environ.get("MAJAZ_USER", "admin")
    valid_pass = os.environ.get("MAJAZ_PASS", "majaz2026")
    if username == valid_user and password == valid_pass:
        token = jwt.encode(
            {"user": username, "exp": datetime.utcnow().timestamp() + 86400},
            JWT_SECRET, algorithm="HS256"
        )
        return jsonify({"token": token, "user": username})
    return jsonify({"error": "Invalid credentials"}), 401


# ══════════════════════════════════════════════════════════════
# TRANSFORM — Convert Notion pages to clean JSON
# ══════════════════════════════════════════════════════════════

def transform_client(page):
    p = page["properties"]
    last_contact = _date(p.get("Last Contacted"))
    days_since = 0
    if last_contact:
        try:
            lc = date.fromisoformat(last_contact[:10])
            days_since = (date.today() - lc).days
        except ValueError:
            pass
    return {
        "id": page["id"],
        "name": _txt(p.get("Name")),
        "phone": _phone(p.get("Phone")),
        "phone_1": _phone(p.get("Phone 1")),
        "email": _email(p.get("Email")),
        "location": _sel(p.get("Location")),
        "icp_score": _sel(p.get("ICP Score")),
        "project_type": _sel(p.get("Project Type")),
        "service_interest": _sel(p.get("Service Interest")),
        "lead_status": _status(p.get("Lead Status")),
        "lead_source": _sel(p.get("Lead Source")),
        "preferred_channel": _sel(p.get("Preferred Channel")),
        "preferred_language": _sel(p.get("Preferred Language")),
        "budget": _num(p.get("Budget (AED)")),
        "last_contacted": last_contact,
        "days_since_contact": days_since,
        "due_date": _date(p.get("Due Date")),
        "urgency": _formula(p.get("Urgency")),
        "overdue_alert": _formula(p.get("Overdue Alert")),
        "next_action": _txt(p.get("Next Action")),
        "representative": _txt(p.get("Representative")),
        "referred_by": _txt(p.get("Referred By")),
        "nation": _msel(p.get("Nation")),
        "assigned_to": _people(p.get("Assigned To")),
        "lost_reason": _sel(p.get("Lost Reason")),
        "clv": _rollup(p.get("CLV")),
        "active_projects": _rollup(p.get("Active Projects")),
        "project_s_num": _rollup(p.get("PROJECT/S NUM")),
        "project_ids": _relation_ids(p.get("PROJECTS")),
        "created": _created(page),
    }

def transform_project(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "name": _txt(p.get("Project Name")),
        "sn": _num(p.get("SN")),
        "description": _txt(p.get("Description")),
        "stage": _status(p.get("Stage")),
        "service_type": _sel(p.get("Service Type")),
        "adm_id": _txt(p.get("ADM ID")),
        "fab_id": _txt(p.get("FAB ID")),
        "plot_info": _txt(p.get("Plot Info")),
        "value": _num(p.get("Value")),
        "pct_completed": _rollup(p.get("Percent Completed")),
        "assignee": _rollup(p.get("Assignee")),
        "client_ids": _relation_ids(p.get("LIST OF LANDLORDS")),
        "task_ids": _relation_ids(p.get("LIST OF TASKS")),
        "meeting_ids": _relation_ids(p.get("Meetings")),
        "pipeline_ids": _relation_ids(p.get("Work Pipe line")),
        "created": _created(page),
    }

def transform_task(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "name": _txt(p.get("Task")),
        "status": _status(p.get("Status")),
        "due_date": _date(p.get("Due Date")),
        "duration": _num(p.get("Duration")),
        "assigned_to": _people(p.get("Assigned to")),
        "deadline": _formula(p.get("Deadline")),
        "project_ids": _relation_ids(p.get("Project")),
        "created": _created(page),
        "last_edited": _edited(page),
    }

def transform_interaction(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "name": _txt(p.get("Interaction")),
        "type": _sel(p.get("Type")),
        "date": _date(p.get("Date")),
        "summary": _txt(p.get("Summary")),
        "next_steps": _txt(p.get("Next Steps")),
        "logged_by": _people(p.get("Logged By")),
        "client_ids": _relation_ids(p.get("Client")),
        "project_ids": _relation_ids(p.get("Project")),
    }

def transform_meeting(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "name": _txt(p.get("Meeting Name")),
        "attendee": _msel(p.get("Attendee")),
        "project_ids": _relation_ids(p.get("PROJECTS")),
        "created": _created(page),
    }

def transform_pipeline(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "name": _txt(p.get("Tasks ")),
        "stage": _sel(p.get("Stage")),
        "task_type": _sel(p.get("Tasks ---")),
        "duration": _num(p.get("Duration")),
        "project_ids": _relation_ids(p.get("PROJECTS")),
    }

def transform_stage_card(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "stage": _txt(p.get("Stage")),
        "status": _status(p.get("Status")),
        "due_date": _date(p.get("Due Date")),
        "assigned_to": _people(p.get("Assigned to")),
        "project_ids": _relation_ids(p.get("PROJECTS")),
        "task_ids": _relation_ids(p.get("TASKS")),
    }

def transform_supplier(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "name": _txt(p.get("Contractor /supplier")),
        "type": _sel(p.get("Type")),
        "speciality": _msel(p.get("Speciality")),
        "phone": _phone(p.get("Phone")),
        "email": _email(p.get("Email")),
        "url": _url(p.get("URL")),
        "contact_person": _txt(p.get("Contact Person")),
        "uid": _uid(p.get("ID")),
    }

def transform_team(page):
    p = page["properties"]
    return {
        "id": page["id"],
        "name": _txt(p.get("Name")),
        "uid": _uid(p.get("ID")),
        "email": _email(p.get("Email")),
        "work_phone": _phone(p.get("WORK PHONE")),
        "personal_phone": _phone(p.get("PERSONAL")),
        "dob": _date(p.get("Date of Birth")),
        "joining_date": _date(p.get("JOINING DATE")),
        "e_pass": _txt(p.get("E-PASS")),
    }


# ══════════════════════════════════════════════════════════════
# ROUTES — CRUD Endpoints
# ══════════════════════════════════════════════════════════════

# ── Health ──
@app.route("/health")
def health():
    return jsonify({"status": "ok", "version": "2.0.0", "databases": len(DB)})


# ── Dashboard (aggregated KPIs) ──
@app.route("/api/dashboard")
@require_auth
def dashboard():
    projects = notion_query(DB["projects"])
    clients = notion_query(DB["clients"])
    tasks = notion_query(DB["tasks"])

    # Stage distribution
    stages = {}
    service_types = {}
    for p in projects:
        s = _status(p["properties"].get("Stage"))
        st = _sel(p["properties"].get("Service Type"))
        stages[s] = stages.get(s, 0) + 1
        if st:
            service_types[st] = service_types.get(st, 0) + 1

    # Task status
    task_statuses = {}
    for t in tasks:
        s = _status(t["properties"].get("Status"))
        task_statuses[s] = task_statuses.get(s, 0) + 1

    # Client lead status
    lead_statuses = {}
    for c in clients:
        s = _status(c["properties"].get("Lead Status"))
        lead_statuses[s] = lead_statuses.get(s, 0) + 1

    return jsonify({
        "total_projects": len(projects),
        "total_clients": len(clients),
        "total_tasks": len(tasks),
        "stages": stages,
        "service_types": service_types,
        "task_statuses": task_statuses,
        "lead_statuses": lead_statuses,
    })


# ── Clients (LIST OF LANDLORDS) ──
@app.route("/api/clients")
@require_auth
def get_clients():
    pages = notion_query(DB["clients"])
    rows = [transform_client(p) for p in pages]
    # Optional filter
    loc = request.args.get("location")
    status = request.args.get("status")
    if loc:
        rows = [r for r in rows if r["location"].lower() == loc.lower()]
    if status:
        rows = [r for r in rows if r["lead_status"].lower() == status.lower()]
    return jsonify({"rows": rows, "count": len(rows)})


@app.route("/api/clients/<page_id>")
@require_auth
def get_client(page_id):
    page = notion_get_page(page_id)
    if not page:
        abort(404)
    client = transform_client(page)
    # Also fetch linked interactions
    interactions = notion_query(DB["interactions"], filter_obj={
        "property": "Client", "relation": {"contains": page_id}
    })
    client["interactions"] = [transform_interaction(i) for i in interactions]
    return jsonify(client)


@app.route("/api/clients", methods=["POST"])
@require_auth
def create_client():
    data = request.get_json() or {}
    props = {"Name": {"title": [{"text": {"content": data.get("name", "")}}]}}
    if data.get("phone"):
        props["Phone"] = {"phone_number": data["phone"]}
    if data.get("email"):
        props["Email"] = {"email": data["email"]}
    if data.get("location"):
        props["Location"] = {"select": {"name": data["location"]}}
    if data.get("project_type"):
        props["Project Type"] = {"select": {"name": data["project_type"]}}
    if data.get("service_interest"):
        props["Service Interest"] = {"select": {"name": data["service_interest"]}}
    ok, result = notion_create_page(DB["clients"], props)
    if ok:
        return jsonify(transform_client(result)), 201
    return jsonify({"error": result.get("message", "Failed")}), 400


@app.route("/api/clients/<page_id>", methods=["PATCH"])
@require_auth
def update_client(page_id):
    data = request.get_json() or {}
    props = {}
    if "name" in data:
        props["Name"] = {"title": [{"text": {"content": data["name"]}}]}
    if "phone" in data:
        props["Phone"] = {"phone_number": data["phone"]}
    if "email" in data:
        props["Email"] = {"email": data["email"]}
    if "location" in data:
        props["Location"] = {"select": {"name": data["location"]}}
    if "next_action" in data:
        props["Next Action"] = {"rich_text": [{"text": {"content": data["next_action"]}}]}
    if "budget" in data:
        props["Budget (AED)"] = {"number": data["budget"]}
    if not props:
        return jsonify({"error": "No fields to update"}), 400
    ok, result = notion_patch_page(page_id, props)
    if ok:
        return jsonify({"ok": True})
    return jsonify({"error": result.get("message", "Failed")}), 400


# ── Projects ──
@app.route("/api/projects")
@require_auth
def get_projects():
    pages = notion_query(DB["projects"])
    rows = [transform_project(p) for p in pages]
    # Filters
    stage = request.args.get("stage")
    svc = request.args.get("service_type")
    if stage:
        rows = [r for r in rows if r["stage"].lower() == stage.lower()]
    if svc:
        rows = [r for r in rows if r["service_type"].lower() == svc.lower()]
    return jsonify({"rows": rows, "count": len(rows)})


@app.route("/api/projects/<page_id>")
@require_auth
def get_project(page_id):
    page = notion_get_page(page_id)
    if not page:
        abort(404)
    project = transform_project(page)
    # Fetch linked tasks
    tasks_pages = notion_query(DB["tasks"], filter_obj={
        "property": "Project", "relation": {"contains": page_id}
    })
    project["tasks"] = [transform_task(t) for t in tasks_pages]
    return jsonify(project)


@app.route("/api/projects", methods=["POST"])
@require_auth
def create_project():
    data = request.get_json() or {}
    props = {"Project Name": {"title": [{"text": {"content": data.get("name", "")}}]}}
    if data.get("sn"):
        props["SN"] = {"number": data["sn"]}
    if data.get("description"):
        props["Description"] = {"rich_text": [{"text": {"content": data["description"]}}]}
    if data.get("service_type"):
        props["Service Type"] = {"select": {"name": data["service_type"]}}
    if data.get("stage"):
        props["Stage"] = {"status": {"name": data["stage"]}}
    if data.get("value"):
        props["Value"] = {"number": data["value"]}
    ok, result = notion_create_page(DB["projects"], props)
    if ok:
        return jsonify(transform_project(result)), 201
    return jsonify({"error": result.get("message", "Failed")}), 400


@app.route("/api/projects/<page_id>", methods=["PATCH"])
@require_auth
def update_project(page_id):
    data = request.get_json() or {}
    props = {}
    if "stage" in data:
        props["Stage"] = {"status": {"name": data["stage"]}}
    if "description" in data:
        props["Description"] = {"rich_text": [{"text": {"content": data["description"]}}]}
    if "value" in data:
        props["Value"] = {"number": data["value"]}
    if "service_type" in data:
        props["Service Type"] = {"select": {"name": data["service_type"]}}
    if not props:
        return jsonify({"error": "No fields to update"}), 400
    ok, result = notion_patch_page(page_id, props)
    if ok:
        return jsonify({"ok": True})
    return jsonify({"error": result.get("message", "Failed")}), 400


# ── Tasks ──
@app.route("/api/tasks")
@require_auth
def get_tasks():
    pages = notion_query(DB["tasks"])
    rows = [transform_task(p) for p in pages]
    status = request.args.get("status")
    if status:
        rows = [r for r in rows if r["status"].lower() == status.lower()]
    return jsonify({"rows": rows, "count": len(rows)})


@app.route("/api/tasks/<page_id>", methods=["PATCH"])
@require_auth
def update_task(page_id):
    data = request.get_json() or {}
    props = {}
    if "status" in data:
        props["Status"] = {"status": {"name": data["status"]}}
    if "due_date" in data:
        props["Due Date"] = {"date": {"start": data["due_date"]}}
    if "duration" in data:
        props["Duration"] = {"number": data["duration"]}
    if not props:
        return jsonify({"error": "No fields to update"}), 400
    ok, result = notion_patch_page(page_id, props)
    if ok:
        return jsonify({"ok": True})
    return jsonify({"error": result.get("message", "Failed")}), 400


# ── Interactions ──
@app.route("/api/interactions")
@require_auth
def get_interactions():
    pages = notion_query(DB["interactions"])
    return jsonify({"rows": [transform_interaction(p) for p in pages]})


@app.route("/api/interactions", methods=["POST"])
@require_auth
def create_interaction():
    data = request.get_json() or {}
    props = {"Interaction": {"title": [{"text": {"content": data.get("name", "")}}]}}
    if data.get("type"):
        props["Type"] = {"select": {"name": data["type"]}}
    if data.get("date"):
        props["Date"] = {"date": {"start": data["date"]}}
    if data.get("summary"):
        props["Summary"] = {"rich_text": [{"text": {"content": data["summary"]}}]}
    if data.get("next_steps"):
        props["Next Steps"] = {"rich_text": [{"text": {"content": data["next_steps"]}}]}
    if data.get("client_id"):
        props["Client"] = {"relation": [{"id": data["client_id"]}]}
    if data.get("project_id"):
        props["Project"] = {"relation": [{"id": data["project_id"]}]}
    ok, result = notion_create_page(DB["interactions"], props)
    if ok:
        return jsonify(transform_interaction(result)), 201
    return jsonify({"error": result.get("message", "Failed")}), 400


# ── Meetings ──
@app.route("/api/meetings")
@require_auth
def get_meetings():
    pages = notion_query(DB["meetings"])
    return jsonify({"rows": [transform_meeting(p) for p in pages]})


# ── Pipeline ──
@app.route("/api/pipeline")
@require_auth
def get_pipeline():
    pages = notion_query(DB["pipeline"])
    return jsonify({"rows": [transform_pipeline(p) for p in pages]})


# ── Stage Task Cards ──
@app.route("/api/stage-cards")
@require_auth
def get_stage_cards():
    pages = notion_query(DB["stage_cards"])
    return jsonify({"rows": [transform_stage_card(p) for p in pages]})


# ── Suppliers ──
@app.route("/api/suppliers")
@require_auth
def get_suppliers():
    pages = notion_query(DB["suppliers"])
    return jsonify({"rows": [transform_supplier(p) for p in pages]})


# ── Team Members ──
@app.route("/api/team")
@require_auth
def get_team():
    pages = notion_query(DB["team"])
    return jsonify({"rows": [transform_team(p) for p in pages]})


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5051))
    print(f"🏗️  Majaz CRM API v2.0.0")
    print(f"📡 Serving {len(DB)} Notion databases on port {port}")
    print(f"🔗 API: http://localhost:{port}/api")
    print(f"💚 Health: http://localhost:{port}/health")
    print(f"🔓 Dev mode: set MAJAZ_DEV=1 or pass ?no_auth=1 to bypass JWT")
    app.run(host="0.0.0.0", port=port)
