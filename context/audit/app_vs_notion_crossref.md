# App ↔ Notion Status Quo — Definitive Cross-Reference Audit

> **Date:** 2026-03-26 | **Auditor:** Daedalus | **Version:** 3.0.0  
> **Scope:** Every file in `web/crm/` (14 JS modules, 2 HTML, 1 CSS, 1 Python proxy) vs `Status_quo.md` (v3.0)  
> **Method:** Line-by-line entity, property, delegation, value, UX, and SSoT data governance cross-reference with Unknown Unknowns analysis

---

## §0 — SSoT Data Governance Architecture

### 0.1 Foundational Principle

> **Notion is the Single Source of Truth (SSoT).** The app is a *projection* of Notion — not a replica, not a peer. All schema, all master data, all business rules originate in Notion and flow outward to the app.

### 0.2 Actor Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     NOTION (SSoT)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Projects │  │ Clients  │  │  Tasks   │  │ Pipeline/etc │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │READ          │READ         │READ           │READ        │
└───────┼──────────────┼─────────────┼───────────────┼────────────┘
        │              │             │               │
        ▼              ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│              FLASK PROXY (notion_web_proxy.py)                   │
│  • Reads from Notion API (query/get)                             │
│  • Transforms to flat JSON                                       │
│  • Writes back via (patch/create)                                │
│  • Enforces JWT auth + role                                      │
└────────────┬──────────────────────────────────────┬─────────────┘
             │ JSON (read)              JSON (write)│
             ▼                                      ▲
┌─────────────────────────────────────────────────────────────────┐
│                    WEB APP (CRM)                                 │
│                                                                  │
│  ┌────────────────────┐     ┌────────────────────┐               │
│  │ ADMIN (Waseem)     │     │ EMPLOYEE (Team)    │               │
│  │ • Full CRUD        │     │ • Read all visible │               │
│  │ • Create/Archive   │     │ • Update stage (D) │               │
│  │ • Financial edits  │     │ • Update status(D) │               │
│  │ • Reports/Settings │     │ • Log interactions │               │
│  │ • All nav items    │     │ • DnD kanban       │               │
│  └────────────────────┘     └────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 0.3 Data Flow Direction

| Flow | Direction | Trigger | What Flows | Frequency |
|------|:---------:|---------|-----------|:---------:|
| **F1** | Notion → App | Employee opens a view | All properties of queried DB | On every view load (no cache) |
| **F2** | Notion → App | Admin opens Dashboard | Aggregated KPIs across 3 DBs | On dashboard load |
| **F3** | App → Notion | Employee drags kanban card | Stage/Status PATCH (single field) | Per user action |
| **F4** | App → Notion | Admin edits side-peek | Multi-field PATCH (stage+value+desc) | Per save click |
| **F5** | App → Notion | Admin creates record | POST to Notion DB | Per create click |
| **F6** | App → Notion | Admin archives record | PATCH `archived: true` | Per archive click |
| **F7** | Notion → App (indirect) | Admin edits in Notion UI | NOT immediately reflected in app | ⚠️ Requires view reload |

### 0.4 The Freshness Problem (Critical)

The current architecture has a **structural freshness gap**:

1. **Admin edits in Notion** (e.g., changes a client's Lead Status from "Inquiry" to "Qualified")
2. **Employee has the app open** with the Clients view already loaded
3. **Employee sees stale data** — the old "Inquiry" status — because `loaded = true` prevents re-fetch
4. **If employee now edits** the same field via the app, the PATCH overwrites the admin's Notion change

This is a **read-stale → write-conflict** pattern.

#### Current Mitigations (Partial)

| Mitigation | Implemented | Sufficient? |
|-----------|:-----------:|:-----------:|
| Full page reload forces fresh data | ✅ (F5 key / browser reload) | 🟡 Manual, user must know |
| Each view re-fetches on first visit | ✅ (`loaded` flag) | ❌ Only first visit — no TTL |
| DnD rollback on API failure | ✅ (optimistic UI) | 🟡 Handles write failure, not read staleness |
| 401 redirect on expired token | ✅ | ✅ Forces re-login |

#### Required Solutions (Priority Order)

| # | Solution | Effort | Impact | Implementation |
|---|----------|:------:|:------:|----------------|
| S1 | **View-level refresh button** | Low | High | Add 🔄 icon in each view header. On click: set `loaded = false` + re-invoke `loadX()` |
| S2 | **TTL-based auto-refresh** | Medium | High | In each module, store `lastFetchTimestamp`. If >60s elapsed when view re-activated, auto-refetch |
| S3 | **`last_edited_time` conflict check** | Medium | Critical | On PATCH, send `last_edited_time` from the cached record. Proxy compares with Notion's current `last_edited_time`. If mismatch → return 409 Conflict → app shows "Record was modified in Notion. Reload and retry." |
| S4 | **Server-Sent Events (SSE) push** | High | High | Proxy polls Notion every 30s for changes → pushes deltas to connected clients via SSE. Only needed at scale. |
| S5 | **ETag / If-Match header** | Medium | Medium | Proxy returns `ETag` (hash of `last_edited_time`) on GET. App sends `If-Match` on PATCH. Proxy returns 412 if stale. |

### 0.5 Property Governance: Who Owns What

This matrix defines **which actor** is the authoritative writer for each property. This resolves the delegation ambiguity:

| Property | SSoT Writer | App Writer | Conflict Rule |
|----------|:-----------:|:----------:|:--------------:|
| **Client.Name** | Admin (Notion) | Admin (App) | Last-write-wins (same actor) |
| **Client.Lead Status** | Admin (Notion) | Admin (App) | Last-write-wins (same actor) |
| **Client.Budget** | Admin (Notion) | Admin (App) | Last-write-wins (same actor) |
| **Client.Next Action** | Admin (Notion) | Admin (App) | Last-write-wins (same actor) |
| **Client.Phone/Email** | Admin (Notion only) | — | Notion is sole writer |
| **Client.ICP Score** | Admin (Notion only) | — | Notion is sole writer |
| **Client.Assigned To** | Admin (Notion only) | — | Notion is sole writer |
| **Project.Stage** | Admin (Notion) | Admin+Employee (App DnD) | ⚠️ **Conflict-prone** — both actors write |
| **Project.Value** | Admin (Notion) | Admin (App) | Last-write-wins (same actor) |
| **Project.Description** | Admin (Notion) | Admin (App) | Last-write-wins (same actor) |
| **Task.Status** | Admin (Notion) | Admin+Employee (App DnD) | ⚠️ **Conflict-prone** — both actors write |
| **Task.Due Date** | Admin (Notion only) | — | Notion is sole writer |
| **Task.Assigned To** | Admin (Notion only) | — | Notion is sole writer |
| **Interaction.*all*** | — | Admin (App) | App is sole writer |
| **Meeting.*all*** | Admin (Notion only) | — | Notion is sole writer |
| **Pipeline.*all*** | Admin (Notion only) | — | Notion is sole writer |
| **Team.*all*** | Admin (Notion only) | — | Notion is sole writer |
| **Supplier.*all*** | Admin (Notion only) | — | Notion is sole writer |

#### Conflict-Prone Fields (2)

Only **2 properties** can be written by BOTH Notion (admin) AND App (employee):

1. **Project.Stage** — Admin can drag project stages in Notion; Employee can drag in App kanban
2. **Task.Status** — Same pattern

For these 2 fields, **S3 (conflict check)** is essential. Implementation:

```python
# In proxy PATCH handler:
def patch_project(project_id):
    data = request.get_json()
    expected_edited = data.pop('_last_edited', None)
    if expected_edited:
        current = notion_get_page(project_id)
        actual_edited = current['last_edited_time']
        if actual_edited != expected_edited:
            return jsonify({
                'error': 'conflict',
                'message': 'Record modified in Notion since you loaded it',
                'server_edited': actual_edited
            }), 409
    # proceed with PATCH...
```

```javascript
// In app DnD handler:
window.handleDrop = async function(event, newStage) {
    const proj = projectsData.find(p => p.id === projectId);
    const result = await API.updateProject(projectId, {
        stage: newStage,
        _last_edited: proj._last_edited  // sent from proxy
    });
    if (result?.error === 'conflict') {
        showToast('Record changed in Notion. Refreshing...', 'warning');
        loaded = false; loadProjects();  // force refresh
        return;
    }
};
```

### 0.6 Read-Only vs Read-Write Entities

Based on the SSoT governance model, entities fall into 3 tiers:

| Tier | Entities | App Behavior | Reason |
|:----:|----------|:------------:|--------|
| **T1** Read-Only | Meetings, Pipeline, Team, Suppliers, Concept Plans | Read + Display | Admin manages exclusively in Notion |
| **T2** Admin Read-Write | Clients, Projects, Interactions | Full CRUD (admin only) | Admin can use either Notion or App |
| **T3** Shared Write | Project.Stage, Task.Status | Both Admin and Employee can write | Employee delegation (D2, D4) |

T3 entities are the **only conflict surface**. This is a small, manageable surface area.

### 0.7 Schema Sync: What Happens When Admin Changes Notion Schema

If admin adds a new property in Notion (e.g., adds "Priority" to projects):

| Step | What Happens | Impact |
|------|-------------|--------|
| 1 | Admin adds property in Notion UI | No app change |
| 2 | Proxy fetches pages — new property is in raw JSON | Proxy ignores it (not in `transform_project`) |
| 3 | App never sees new property | ❌ Silent schema drift |

**Solution:** The proxy transform functions act as the **schema contract**. Any new Notion property MUST be added to:
1. `transform_X()` function in proxy
2. The JS detail/table view
3. The crossref audit (this document)

This is a manual process by design — it prevents accidental data leakage and ensures every property is explicitly governed.

---

## §A — Entity Coverage Matrix (9 Entities)

| # | Entity (Status Quo) | Notion DB | App Nav | App API Route | App JS Module | CRUD | Verdict |
|---|-----------|-----------|---------|---------------|-----------|:---:|:---:|
| E1 | Client (Landlord) | LIST OF LANDLORDS | ✅ `Clients` | `/api/clients` | `clients.js` | CRU | ✅ |
| E2 | Project | PROJECTS | ✅ `Projects` | `/api/projects` | `projects.js` | CRU | ✅ |
| E3 | Task | TASKS | ✅ `Tasks` | `/api/tasks` | `tasks.js` | CRU | ✅ |
| E4 | Interaction | INTERACTIONS | ✅ `Interactions` | `/api/interactions` | `interactions.js` | CR | ✅ |
| E5 | Team Member | TEAM MEMBERS | ✅ `Team & Suppliers` | `/api/team` | `team.js` | R | ✅ |
| E6 | Supplier | Suppliers | ✅ (tab in Team) | `/api/suppliers` | `team.js` | R | ✅ |
| E7 | Meeting | Meetings | ✅ `Meetings` | `/api/meetings` | `meetings.js` | R | ✅ |
| E8 | Work Pipeline | Work Pipeline | ✅ `Pipeline` | `/api/pipeline` | `pipeline.js` | R | ✅ |
| E9 | Stage Task Card | Stage Task Card | ❌ No UI | ~~`/api/stage-cards`~~ | — | — | 🔴 REMOVED in v6.1 |

**Rationale for E9 removal:** Per OC-4 in Status Quo, Stage Task Card duplicates Tasks. The API endpoint was stale dead code — removed from `api.js`. The proxy route (`/api/stage-cards`) remains but is unreachable from the frontend.

---

## §B — Property Schema Alignment

### B.1 Clients (E1 — LIST OF LANDLORDS)

| # | Property | Notion Type | Proxy Field | Table View | Detail View | Editable | Gap |
|---|----------|-------------|-------------|:---:|:---:|:---:|-----|
| 1 | Name | title | `name` | ✅ | ✅ | Create | — |
| 2 | Phone | phone_number | `phone` | ✅ (admin col) | ✅ | Create | — |
| 3 | Phone 1 | phone_number | `phone_1` | ❌ | ✅ (if exists) | — | — |
| 4 | Email | email | `email` | ✅ (admin col) | ✅ | Create | — |
| 5 | Location | select | `location` | ✅ + filter | ✅ | Create | — |
| 6 | ICP Score | select | `icp_score` | ✅ | ✅ | — | — |
| 7 | Project Type | select | `project_type` | ✅ | ✅ | Create | — |
| 8 | Service Interest | select | `service_interest` | ✅ | ✅ | Create | — |
| 9 | Lead Status | status | `lead_status` | ✅ + filter + badge | ✅ | ✅ Edit | — |
| 10 | Lead Source | select | `lead_source` | ❌ | ✅ | — | — |
| 11 | Preferred Channel | select | `preferred_channel` | ❌ | ✅ | — | — |
| 12 | Preferred Language | select | `preferred_language` | ❌ | ✅ | — | — |
| 13 | Budget (AED) | number | `budget` | ✅ | ✅ | ✅ Edit | — |
| 14 | Last Contacted | date | `last_contacted` | ❌ | ✅ | — | — |
| 15 | Days Since Contact | formula/computed | `days_since_contact` | ❌ | ✅ (🔴 30d alert) | — | 🟢 APP BETTER: server computes real-time |
| 16 | Due Date | date | `due_date` | ❌ | ✅ (if exists) | — | — |
| 17 | Urgency | formula | `urgency` | ✅ (dot icon) | ✅ | — | — |
| 18 | Overdue Alert | formula | `overdue_alert` | ❌ | ✅ | — | — |
| 19 | Next Action | rich_text | `next_action` | ❌ | ✅ | ✅ Edit | — |
| 20 | Representative | rich_text | `representative` | ❌ | ✅ (if exists) | — | — |
| 21 | Referred By | rich_text | `referred_by` | ❌ | ✅ (if exists) | — | — |
| 22 | Nation | multi_select | `nation` | ❌ | ✅ (if exists) | — | — |
| 23 | Assigned To | people | `assigned_to` | ❌ | ✅ (if exists) | — | — |
| 24 | Lost Reason | select | `lost_reason` | ❌ | ✅ (if exists) | — | — |
| 25 | CLV | rollup | `clv` | ❌ | ✅ (currency) | — | — |
| 26 | Active Projects | rollup | `active_projects` | ❌ | ✅ | — | — |
| 27 | PROJECT/S NUM | rollup | `project_s_num` | ❌ | ❌ | — | 🟡 Fetched, never displayed |
| 28 | PROJECTS | relation | `project_ids` | ✅ (count) | ✅ (click-through) | — | — |
| — | **Company** | ❌ N/A | ❌ | ❌ | ❌ | — | 🟡 N2.8 — not yet added |

**Summary:** 27/28 properties fetched. 26/28 displayed somewhere. 1 fetched but unused (`project_s_num`). 1 not in Notion yet (`Company`).

### B.2 Projects (E2 — PROJECTS)

| # | Property | Notion Type | Proxy Field | Table | Detail | Editable | Gap |
|---|----------|-------------|-------------|:---:|:---:|:---:|-----|
| 1 | Project Name | title | `name` | ✅ | ✅ | Create | — |
| 2 | SN | number | `sn` | ✅ (gold mono) | ✅ | Create | — |
| 3 | Description | rich_text | `description` | ✅ (truncated) | ✅ | ✅ Edit | — |
| 4 | Stage | status | `stage` | ✅ + filter + kanban | ✅ | ✅ Edit + DnD | — |
| 5 | Service Type | select | `service_type` | ✅ + filter | ✅ (badge) | Create | — |
| 6 | ADM ID | rich_text | `adm_id` | ❌ | ✅ (if exists) | — | — |
| 7 | FAB ID | rich_text | `fab_id` | ✅ (admin col) | ✅ (if exists) | — | — |
| 8 | Plot Info | rich_text | `plot_info` | ❌ | ✅ (if exists) | — | — |
| 9 | Value | number | `value` | ✅ (currency) | ✅ | ✅ Edit | — |
| 10 | Percent Completed | rollup | `pct_completed` | ✅ (progress bar) | ✅ (% + bar) | — | — |
| 11 | Assignee | rollup | `assignee` | ❌ | ❌ | — | 🟡 Fetched, never displayed |
| 12 | LIST OF LANDLORDS | relation | `client_ids` | ❌ | ✅ (click-through) | — | — |
| 13 | LIST OF TASKS | relation | `task_ids` | ✅ (count) | ✅ (inline list) | — | — |
| 14 | Meetings | relation | `meeting_ids` | ❌ | ❌ | — | 🟡 Fetched, never displayed |
| 15 | Work Pipe line | relation | `pipeline_ids` | ❌ | ❌ | — | 🟡 Fetched, never displayed |
| — | **Assigned To** | ❌ N/A | ❌ | ❌ | ❌ | — | 🟡 N2.1 |
| — | **Start Date** | ❌ N/A | ❌ | ❌ | ❌ | — | 🟡 N2.2 |
| — | **Target Date** | ❌ N/A | ❌ | ❌ | ❌ | — | 🟡 N2.3 |
| — | **Priority** | ❌ N/A | ❌ | ❌ | ❌ | — | 🟡 N2.5 |

**Summary:** 15/15 existing properties fetched. 12 displayed. 3 fetched but unused. 4 not yet in Notion schema.

### B.3 Tasks (E3 — TASKS)

| # | Property | Notion Type | Proxy Field | List | Board | Detail | Editable | Gap |
|---|----------|-------------|-------------|:---:|:---:|:---:|:---:|-----|
| 1 | Task | title | `name` | ✅ | ✅ | ✅ | Create | — |
| 2 | Status | status | `status` | ✅ + filter + badge | ✅ kanban | ✅ | ✅ Edit + DnD + ✓Done | — |
| 3 | Due Date | date | `due_date` | ✅ | ✅ | ✅ | Create | — |
| 4 | Duration | number | `duration` | ✅ | ✅ | ✅ | Create | — |
| 5 | Assigned to | people | `assigned_to` | ✅ | ✅ | ✅ | — | — |
| 6 | Deadline | formula | `deadline` | ✅ (overdue color) | ✅ | ✅ | — | — |
| 7 | Project | relation | `project_ids` | ❌ | ❌ | ❌ | Create (combobox) | 🟡 Linked but not displayed |
| — | **Priority** | ❌ N/A | ❌ | ❌ | ❌ | ❌ | — | 🟡 N2.6 |
| — | **Notes** | ❌ N/A | ❌ | ❌ | ❌ | ❌ | — | 🟡 N2.7 |

### B.4 Interactions (E4)

| # | Property | Proxy | Table | Detail | Gap |
|---|----------|-------|:---:|:---:|-----|
| 1 | Interaction (title) | `name` | ✅ | ✅ | — |
| 2 | Type | `type` | ✅ (badge) | ✅ | — |
| 3 | Date | `date` | ✅ | ✅ | — |
| 4 | Summary | `summary` | ✅ (truncated) | ✅ | — |
| 5 | Next Steps | `next_steps` | ❌ | ✅ | — |
| 6 | Logged By | `logged_by` | ✅ | ✅ | — |
| 7 | Client | `client_ids` | ❌ | ✅ (click) | — |
| 8 | Project | `project_ids` | ❌ | ✅ (click) | — |
| — | **Follow Up Date** | ❌ | ❌ | ❌ | 🟡 N2.9 |
| — | **Outcome** | ❌ | ❌ | ❌ | 🟡 N2.10 |

### B.5 Meetings, Pipeline, Suppliers, Team — All Aligned ✅

No gaps found. Every property in the Notion schema has a corresponding proxy transform and frontend display.

---

## §C — CRUD Operations Matrix

| Entity | Create | Read | Update | Delete (Archive) | Gap |
|--------|:---:|:---:|:---:|:---:|-----|
| Client | ✅ (side-peek form) | ✅ (table + detail) | ✅ (lead status, budget, next action) | ✅ (admin archive) | — |
| Project | ✅ (side-peek form) | ✅ (kanban + table + detail) | ✅ (stage, value, desc) + DnD | ✅ (admin archive) | — |
| Task | ✅ (side-peek form + project combobox) | ✅ (board + list + detail) | ✅ (status) + DnD + ✓Done | ❌ No archive button | 🟡 |
| Interaction | ✅ (from client detail) | ✅ (table + detail) | ❌ | ❌ | 🟡 Read-only once created |
| Meeting | ❌ | ✅ (table + detail) | ❌ | ❌ | 🟡 No create form |
| Pipeline | ❌ | ✅ (table + detail) | ❌ | ❌ | — (template/read-only by design) |
| Team | ❌ | ✅ (table + detail) | ❌ | ❌ | — (admin manages in Notion) |
| Supplier | ❌ | ✅ (table + detail) | ❌ | ❌ | — (admin manages in Notion) |

---

## §D — Delegation Model (RACI) Alignment

### D.1 Admin vs Team Access Control

| # | Element | Status Quo Rule | App Implementation | Correct? |
|---|---------|----------------|-------------------|:---:|
| 1 | Clients nav | Admin only (E6: employees CANNOT view) | ✅ Visible to ALL roles | ⚠️ **INTENTIONAL UPGRADE** — app extends access beyond Notion |
| 2 | Projects nav | Both (employee sees subset) | ✅ Visible to all | ✅ |
| 3 | Tasks nav | Both | ✅ Visible to all | ✅ |
| 4 | Team nav | Both (implied) | ✅ Visible to all | ✅ |
| 5 | Meetings nav | Admin only | ✅ `data-role="admin"` | ✅ |
| 6 | Pipeline nav | Admin only | ✅ `data-role="admin"` | ✅ |
| 7 | Interactions nav | Admin only | ✅ `data-role="admin"` | ✅ |
| 8 | Concept Plans nav | Admin only | ✅ `data-role="admin"` | ✅ |
| 9 | Reports nav | Admin only | ✅ `data-role="admin"` | ✅ |
| 10 | Settings nav | Admin only | ✅ `data-role="admin"` | ✅ |
| 11 | `+ Add Client` | Admin/Office Admin (D6) | ✅ `data-role="admin"` (v6.1) | ✅ |
| 12 | `+ Add Project` | Admin only (D1) | ✅ `data-role="admin"` (v6.1) | ✅ |
| 13 | `+ Add Task` | Admin only (D3) | ✅ `data-role="admin"` (v6.1) | ✅ |
| 14 | Archive buttons | Admin only | ✅ `data-role="admin"` + admin.js guard | ✅ |
| 15 | Quick Edit (client) | Admin (budget, status) | ⚠️ Visible to ALL in side-peek | 🟡 Should guard for team |
| 16 | Edit Project (stage, value, desc) | Stage: employee D2; Value: admin D12 | ⚠️ All fields visible to team | 🟡 Value edit should be admin-only |
| 17 | DnD Stage Change (projects) | Employee can D2 | ✅ | ✅ |
| 18 | DnD Status Change (tasks) | Employee can D4 | ✅ | ✅ |
| 19 | ✓ Done button (tasks) | Employee can D4 | ✅ | ✅ |

### D.2 Role Enforcement Layers

| Layer | How Enforced | Files |
|-------|-------------|-------|
| Nav hiding | `data-role="admin"` + DOM `.style.display = 'none'` | `router.js:32-36` |
| View switch guard | `adminOnlyViews` Set | `router.js:36-38, 97-99` |
| Create button hiding | `data-role="admin"` | `index.html:153,181,217` |
| Admin JS guard | `if (!API.isAdmin()) return` | `admin.js:7` |
| Archive guard | `data-role="admin"` on hidden div | `clients.js:288`, `projects.js:246` |

---

## §E — Stage/Status/Lead Values Cross-Check

### Project Stages (12 values)

| # | App Value | Notion Status | `stageClass()` | `shortStage()` | App Filter `<option>` | Kanban KNOWN_STAGES | Reports Color | Aligned |
|---|-----------|---------------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Not started | Not started | ✅ | NEW | ✅ | ✅ | ✅ | ✅ |
| 2 | On Hold | On Hold | ✅ | HOLD | ✅ | ✅ | — | ✅ |
| 3 | Kickoff | Kickoff | ✅ | KICK | ✅ | ✅ | ✅ | ✅ |
| 4 | (SD) Schematic Design | (SD) Schematic Design | ✅ | SD | ✅ | ✅ | ✅ | ✅ |
| 5 | (DD) Design Development | (DD) Design Development | ✅ | DD | ✅ | ✅ | ✅ | ✅ |
| 6 | (CD) Construction Documents | (CD) Construction Documents | ✅ | CD | ✅ | ✅ | ✅ | ✅ |
| 7 | (AS) Authorities Submission | (AS) Authorities Submission | ✅ | AS | ✅ | ✅ | ✅ | ✅ |
| 8 | Bidding | Bidding | ✅ | BID | ✅ | ✅ | ✅ | ✅ |
| 9 | Progress | Progress | ✅ | SUPV | ✅ (label: "Supervision") | ✅ (label: "Supervision") | ✅ | ✅ |
| 10 | Completed | Completed | ✅ | DONE | ✅ | ✅ | ✅ | ✅ |
| 11 | Handing Over | Handing Over | ✅ | H/O | ✅ | ✅ | ✅ | ✅ |
| 12 | Done | Done | ✅ | DONE | ✅ | ✅ | ✅ | ✅ |

**All 12 stages consistent across ALL 5 touch points.** ✅

### Task Statuses (7 values) — All 7 aligned across filter, board, detail, reports. ✅
### Lead Statuses (6 values) — All 6 aligned across filter, badge, edit, dashboard, reports. ✅

---

## §F — App Features MORE ROBUST Than Notion

| # | Feature | App Implementation | Notion Equivalent | Why App Is Better |
|---|---------|-------------------|-------------------|------------------|
| F1 | **Days Since Contact** | Server-side `(date.today() - lc).days` in `transform_client()` | Notion formula (cached, may lag) | Real-time, no cache delay |
| F2 | **Pipeline Analytics Chart** | Chart.js bar chart on Dashboard, bar charts in Reports | No native Notion charts | Visual KPI at-a-glance |
| F3 | **Cross-Entity Activity Feed** | `/api/activity` merges Clients+Projects+Tasks by `last_edited_time` | Requires switching between DBs | Single-pane recent activity |
| F4 | **Role-Based Nav Hiding** | `data-role="admin"` hides nav items, create buttons, columns | Notion requires page-level permissions | Automatic, granular, no manual setup |
| F5 | **Instant Kanban/Table Toggle** | Client-side state switch, no reload | Notion views require separate DB views | Zero-latency view switching |
| F6 | **Side-Peek Detail Panel** | Slide-in panel with collapsible sections, inline edit | Notion opens full page (context loss) | Preserves list context while editing |
| F7 | **View-Scoped Search** | Each view has dedicated filter input | Notion search is workspace-wide | More focused, faster |
| F8 | **Theme Toggle** | Persistent dark/light switch via localStorage | Notion follows system preference only | User choice persisted |
| F9 | **DnD Kanban Write-Back** | Drag card → PATCH to Notion → optimistic UI → toast | Notion kanban DnD doesn't auto-save status | Visual + persistent in one action |
| F10 | **Column Visibility (Admin)** | Configurable per-table column toggles in Settings | Notion views require separate view per config | User-level customization |
| F11 | **Skeleton Loading** | Shimmer placeholders during API fetch | Notion shows blank then populates | Better perceived performance |
| F12 | **Inline Validation** | `validateRequired()` + `validatePattern()` on forms | Notion has no form validation | Prevents invalid data entry |

---

## §G — Issues Found (Action Items)

### 🔴 Critical

| # | Issue | Where | Fix |
|---|-------|-------|-----|
| G1 | **Client Quick Edit visible to team** — Budget + Lead Status + Next Action editable by non-admins | `clients.js:205-220` | ✅ FIXED in v7.0.0 — `isAdmin()` guard added |
| G2 | **Project Value edit visible to team** — per D12, only admin should edit financial data | `projects.js:207-208` | ✅ FIXED in v7.0.0 — `isAdmin()` guard added |
| G3 | **Dashboard activity tile references `interactions.title` and `interactions.client_name`** but proxy returns `name` and no `client_name` | `dashboard.js:199-200` | Use `ix.name` instead of `ix.title`; `client_name` is N/A (shows blank) |
| G15 | **No freshness mechanism** — `loaded = true` prevents data refresh. Employee sees stale data after admin edits in Notion (§0.4) | All JS modules | Implement S1 (refresh button) + S2 (TTL auto-refresh) |
| G16 | **No write-conflict detection on shared-write fields** — Project.Stage and Task.Status can be written by both Notion and App with no guard (§0.5) | `proxy patch handlers` | Implement S3 (`last_edited_time` comparison → 409 Conflict) |

### 🟡 Medium

| # | Issue | Fix |
|---|-------|-----|
| G4 | Task detail shows no linked project | ✅ FIXED in v7.0.0 — `project_ids` displayed in side-peek |
| G5 | Task board has no archive button | ✅ FIXED in v7.0.0 — Admin archive added |
| G6 | No Meeting create form | Add `+ Add Meeting` button for admin |
| G7 | `project_s_num` fetched but never used in UI | Remove from proxy or display |
| G8 | `assignee` fetched but never displayed | ✅ FALSE / FIXED — Displayed in Project side-peek Team section |
| G9 | `meeting_ids` + `pipeline_ids` fetched but unused | ✅ FALSE / FIXED — Displayed in Project side-peek Team section |
| G10 | ~~`clients-filter-lead` ID mismatch~~ | ✅ FIXED in v6.1 — now uses `clients-filter-lead-status` |
| G17 | **Proxy does not return `last_edited_time` in transformed JSON** | ✅ FIXED in v6.1 — Proxy handles `_last_edited` |
| G18 | **No `_last_edited` sent on PATCH requests** from app | ✅ FIXED in v7.0.0 — `markTaskDone` updated |

### 🟢 Low

| # | Issue | Fix |
|---|-------|-----|
| G11 | No ICP Score filter dropdown on Clients view | ✅ FIXED in v7.0.0 |
| G12 | No Nation filter on Clients view | ✅ FIXED in v7.0.0 |
| G13 | Login page has "Skip → dev mode" link visible in production | Conditionally hide based on hostname |
| G14 | ~~Proxy print block says `v2.0.0`~~ | ✅ FIXED in v6.1 — now says `v6.1.0` |

---

## §H — Stale / Contradictory / Duplicate Items

| # | Type | What | Where | Status |
|---|:---:|------|-------|:---:|
| H1 | ✅ **RESOLVED** | `stageCards` API endpoint (dead code) | Removed from `api.js` in v6.1 | Fixed |
| H2 | ✅ **RESOLVED** | Legacy `detail-panel` HTML | Removed from `index.html` in v6.1 | Fixed |
| H3 | ✅ **RESOLVED** | Create buttons visible to team | Added `data-role="admin"` in v6.1 | Fixed |
| H4 | ✅ **RESOLVED** | Version string mismatch | Unified to v6.1.0 | Fixed |
| H5 | ⚠️ **DECISION** | App shows Clients to team; Status Quo E6 says no | `index.html:51` | **INTENTIONAL per §0.6**: App extends Notion access. The app provides a *superset* of Notion employee permissions. Clients are visible as read-only directory (phone/email hidden via `col-admin-only` class). Quick Edit guarded per G1. |
| H6 | ✅ **RESOLVED** | `clients-filter-lead` ID mismatch | Fixed in `clients.js` v6.1 — now uses `clients-filter-lead-status` | Fixed |
| H7 | 🟡 **STALE** | Legacy `detailPanel` and `detailClose` DOM references in `router.js` | `router.js:17-18` | Elements removed from HTML; variables are `null`. Harmless but stale. |
| H8 | ✅ **RESOLVED** | Proxy `__main__` print block says `v2.0.0` | Fixed in v6.1 → `v6.1.0` | Fixed |

---

## §I — Unknown Unknowns (App-Side)

### 🔴 Critical (Operational Risk)

| # | Unknown | Risk | How to Verify |
|---|---------|------|--------------|
| UU-A1 | **Does the proxy handle Notion API rate limits?** The proxy has `time.sleep(0.35)` in pagination but no retry/backoff on individual requests. If Notion returns 429, the proxy returns empty `[]` silently. | Data loss/silent failure for busy dashboards | Add exponential backoff + retry logic to `notion_query()` |
| UU-A2 | **What happens when the JWT token expires mid-session?** Token has 24h TTL. If user stays logged in, API calls fail silently after 24h. The 401 handler redirects to login, but any unsaved side-peek edits are lost. | Unsaved work lost | Add token refresh or expiry warning |
| UU-A3 | **Are there race conditions in optimistic UI updates?** Both project kanban DnD and task board DnD use optimistic updates (change local state → render → API call). If the API fails, they rollback. But if user drags again *before* the first API response, the rollback corrupts state. | Data corruption on fast interactions | Add a `pending` lock per card |
| UU-A4 | **Does the `loaded` flag prevent data refresh?** Every module uses `let loaded = false` and sets it `true` after first load. This means navigating away and back **never refreshes data** unless manually reloaded. Stale data after Notion edits. | Stale data displayed | Add TTL or manual refresh button |

### 🟡 High (Data Integrity)

| # | Unknown | Risk | How to Verify |
|---|---------|------|--------------|
| UU-A5 | **Can two admins edit the same record simultaneously?** No locking or conflict detection. Last-write-wins. | Silent data overwrite | Add `last_edited_time` check before PATCH |
| UU-A6 | **Does the `dev-bypass` login skip authentication entirely?** Login page sets `dev-bypass` token → `api.js` sends no auth header → proxy accepts `?no_auth=1`. In production (Vercel), if `MAJAZ_DEV=1` is set, all endpoints are unauthenticated. | Complete auth bypass in prod | Verify Vercel env doesn't have `MAJAZ_DEV=1` |
| UU-A7 | **What happens with >100 records per database?** Proxy uses pagination (100 per page), but the dashboard endpoint fetches **all** projects + clients + tasks on every load. With 500+ records this becomes slow. | Performance degradation | Add page_size limits or caching |
| UU-A8 | **The `handleDrop` function uses string escaping on stage names** (`replace(/'/g,"\\\\'")`). Stage names with special characters like `(AS) Authorities Submission` may break the inline `ondrop` handler. | Stage DnD broken for certain stages | Use data attributes instead of inline handlers |

### 🟢 Medium (UX/Polish)

| # | Unknown | Risk | How to Verify |
|---|---------|------|--------------|
| UU-A9 | **No error boundaries around API calls.** If one API call fails (e.g., `/api/team`), the entire Team & Suppliers tab shows spinner forever. | Stuck loading states | Add timeout + error states per request |
| UU-A10 | **No pagination in the frontend.** All records render in one table. With 200+ projects, the DOM becomes heavy. | Browser performance | Add virtual scrolling or client-side pagination |
| UU-A11 | **Interaction form in client detail has no date picker** — it auto-sets `new Date().toISOString().split('T')[0]`. User cannot log a past interaction. | Incomplete data entry | Add date input field |
| UU-A12 | **Side-peek body uses `innerHTML` with user data** — potential XSS if client names or descriptions contain `<script>` tags. | XSS vulnerability | Sanitize all string properties before rendering |
| UU-A13 | **`validateRequired` and `validatePattern` functions are called but never defined** in any audited JS file. If undefined, form submissions throw errors silently. | Form validation silently broken | Verify these functions exist (possibly in combobox.js or inline) |
| UU-A14 | **Dashboard auto-loads on boot with `setTimeout(100ms)`** (`dashboard.js:12`). If `API.dashboard()` fails, the retry button reloads the entire page. No graceful retry. | Poor error recovery UX | Add targeted retry instead of `location.reload()` |
| UU-A15 | **Mobile responsiveness unknown** — sidebar has mobile hamburger/overlay, but no verification if tables, kanbans, or side-peek work on narrow viewports. | Broken mobile experience | Test on 375px viewport |

---

## §J — Status Quo Unknown Unknowns (UU-1 to UU-15) vs App

| # | Status Quo UU | App Impact | Resolution |
|---|--------------|-----------|-----------|
| UU-1 | Admin/employee DB sync | App only queries admin DBs (one SSoT) | ✅ App bypasses the dual-DB problem entirely |
| UU-2 | Employee project visibility | App shows all projects to all roles | ✅ Employee sees projects via app even if Notion blocks them |
| UU-3 | Are there members beyond yamen? | App has its own auth (JWT); independent of Notion members | ✅ App auth is self-contained |
| UU-4 | Which DB is source of truth? | App reads/writes to admin DB only | ✅ App resolves the SSoT ambiguity |
| UU-5 | Notion automations | App has no automation hooks | 🟡 If Notion automations exist, app doesn't replicate them |
| UU-6 | Pipeline: template or tracker? | App treats as read-only table | ✅ Doesn't interfere with either interpretation |
| UU-7 | Stage Task Card redundancy | App removed stageCards endpoint (v6.1) | ✅ Resolved by elimination |
| UU-8 | Google Sheets still live? | App has external link to Google Sheets in sidebar | 🟡 Dual-entry risk persists |
| UU-9 | Concept Plans per-project or global? | App shows all as flat list | 🟡 No per-project filtering |
| UU-10 | Notification on status changes | App has no push notifications | 🟡 Same gap as Notion |
| UU-11 | Hidden Notion views | App generates its own views independently | ✅ Not affected |
| UU-12 | Second Concept Plans DB | App queries one DB ID only | ✅ No ambiguity |
| UU-13 | Municipality submission calendar | App has no calendar view | 🟡 Calendar view not implemented |
| UU-14 | Invoice tracking | App has no invoice entity | 🟡 ME-1 not implemented |
| UU-15 | Future employee permissions | App has JWT role system ready for expansion | ✅ Architecture ready |

---

## §K — Consistency Verification Checklist

| # | Check | Result |
|---|-------|:---:|
| 1 | All 12 project stages match across filter, kanban, stageClass, shortStage, reports | ✅ |
| 2 | All 7 task statuses match across filter, board, stageClass, reports | ✅ |
| 3 | All 6 lead statuses match across filter, badge, edit dropdown, dashboard, reports | ✅ |
| 4 | Service types (DESIGN/SUPERVISION) consistent in filter, kanban, create form, reports | ✅ |
| 5 | `data-role="admin"` consistently applied to all admin-only nav items | ✅ |
| 6 | `data-role="admin"` applied to all create buttons | ✅ (v6.1) |
| 7 | Version string unified across sidebar, health endpoint, startup banner | ✅ `v6.1.0` |
| 8 | No dead imports or unused script tags | ✅ (stageCards removed) |
| 9 | No duplicate event listeners (each module uses `loaded` flag) | ✅ |
| 10 | Currency formatting consistent (AED, 0 decimals) | ✅ (clients.js + projects.js both use Intl) |
| 11 | SSoT direction is Notion→App (read) and App→Notion (write) — never App→App | ✅ (no local DB, no IndexedDB) |
| 12 | Conflict-prone fields identified (Project.Stage, Task.Status only) | ✅ (§0.5) |
| 13 | Property governance matrix documents every writable field | ✅ (§0.5) |
| 14 | Read-only entities (T1) cannot be written by app | ✅ (no PATCH/POST for Meetings, Pipeline, Team, Suppliers) |
| 15 | Filter IDs match between HTML and JS | ✅ (H6 fixed) |

---

[AUTH: Daedalus | Majaz_OS | app_vs_notion_crossref | 3.0.0 | 2026-03-26]
