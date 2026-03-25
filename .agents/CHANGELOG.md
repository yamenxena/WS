# Changelog

All notable changes to this workspace governance are documented here.
Format: [SemVer](https://semver.org/)

## [2.0.0] — 2026-03-23

### Phase 0: Deep Audit
- Queried all 12 Notion databases via MCP API
- Inventoried 27 unique projects, 50 tasks, 4 standalone pages
- Saved full status quo to `workflows/changelog.md`
- Identified 17 missing CRM properties, Stage group misalignment, no views

### Phase 1: Schema Extension (Automated ✅)
- **LIST OF LANDLORDS:** 8 → 23 properties (+14 added, +1 renamed)
  - P0 (Critical): ICP Score, Lead Source (6 options), Referred By
  - P1 (Important): Next Action, Due Date, Location (9 options), Budget (AED), Project Type (6 options), Service Interest (3 options)
  - P2 (Nice-to-have): Last Contacted, Preferred Language (3), Preferred Channel (3), Lost Reason (5), Assigned To
- **Renamed:** `REPRESINTITAVE (IF ANY)` → `Representative`
- **Created:** INTERACTIONS database (ID: `32c39a01-a595-81e9`) with 8 properties: Interaction (title), Date, Type (Call/WhatsApp/Email/Meeting/Site Visit/Proposal Sent), Summary, Next Steps, Logged By (people), Client (→ Landlords), Project (→ Projects)
- **⚠️ Lead Status:** `status` property type cannot be added via API v2022-06-28 — requires human UI (1 min)

### Phase 2: Data Backfill (Automated ✅)
- **38 landlords** processed, **38 updated**, 0 skipped
- **Fields auto-populated:**
  - ICP Score: base 3 for clients with projects, +1 if value >200K, +1 if multiple projects; 2 for unknowns
  - Location: inferred from project names (Al Rahba, Aljubail, Reem, etc.)
  - Project Type: inferred from project names (Villa default, Building, Renovation, Landscape, Commercial)
  - Service Interest: from PROJECTS Service Type (DESIGN/SUPERVISION/BOTH)
  - Lead Source: `Direct` (default — user to update with real source)
  - Preferred Language: `Arabic` for EMIRATES nation clients
  - Preferred Channel: `WhatsApp` (default)
- **⚠️ Manual follow-up needed:** Verify ICP scores, add real Lead Sources (Referral/Instagram), update project Stages, add Budget estimates

### Phase 4: Views (👤 Human UI Required)
- View creation API endpoint does not exist (tested v2022-06-28 and v2025-09-03)
- **Create in Notion UI:** Pipeline Board (group by Lead Status), Response Overdue table, High-Priority table, This Week calendar, Won/Lost Board, All Clients table
- **Set up 3 automations:** Status change → notify, Due Date → reminder, New page → default Lead Status

### Phase 5: Python Automation Scripts (Automated ✅)
- **`scripts/crm_daily_check.py`** — queries overdue leads, missing next actions, high-priority alerts, pipeline summary → saves to `output/reports/`. Tested: produces live report from 38 landlords.
- **`scripts/compute_crm_fields.py`** — computes Urgency (🔴🟡🟢), CLV backfill, Days Silent detection
- **`scripts/notion_crm_automations.py`** — Flask webhook listener + CLI modes: Lead Won → auto-create Project, overdue flagging, interaction logging

### Phase 6: Web Dashboard (Automated ✅)
- **`web/js/data.js`** — Refactored to fetch data from Notion via a local proxy instead of Google Sheets.
- **`scripts/notion_web_proxy.py`** — Created a local Flask server to read data directly from the Notion API and expose it to the frontend via endpoints (`/api/crm`, `/api/projects`).

---

## [1.7.0] — 2026-03-23

### Changed (Notion-First Pivot)
- **Paradigm shift:** Notion is now SSoT. Filesystem `operations/` files are generated FROM Notion, not the reverse.
- Deleted `scripts/google_sheets_api.js`, `scripts/google_sheets_theme.js` (violated Python-only rule §2)
- Archived 5 simulated Phase 4 outputs to `_legacy/simulated_outputs/`
- Deprecated `operations/crm.md` → `_legacy/crm.md` (superseded by Notion LIST OF LANDLORDS)
- Deprecated `operations/projects.md` → `_legacy/projects.md` (superseded by Notion PROJECTS)

### Added
- Agent Specialization §8: CRM Expert (Notion-native operations)
- CRM agent workflows (`crm_agent_workflows.md`)
- Heuristics SSoT (`context/heuristics.md`)
- Notion deep audit: 12 databases, 100+ pages, 27+ client projects

## [1.6.0] — 2026-03-21

### Changed (Realistic Simulation — replaces all fictional content)
- `context/GOALS.md` → 5 OKRs: cash flow (AED 180K overdue), delegation (Waseem bottleneck), latency (48-72h response), Estidama code gap
- `context/strategy.md` → honest SWOT, dual-city (AD+Dubai), fee structure (250K-500K/villa), referrals 60% of leads
- `context/company_context.md` → team gaps (junior + admin TBD), capacity limits, outsourced MEP/structural, Dubai registration in process
- `operations/projects.md` → 5 active projects (4 AD + 1 Dubai), payment tracking, 3 overdue invoices, municipality notes AD vs Dubai
- `operations/crm.md` → 10 leads across 6 stages, 3 latency alerts (overdue responses), 2 lost leads with reasons
- `operations/tasks.md` → 24 tasks with overdue/bottleneck/delegation analysis dashboard
- `operations/content_pipeline.md` → behind schedule (0/3 March), missed posts with blocked-by reasons, delegation plan

## [1.5.1] — 2026-03-21

### Fixed
- `requirements.txt`: `google-generativeai` → commented out (package not available yet). Made optional for when Gemini API is activated.

### Verified
- `pip install -r requirements.txt` — all core deps installed: python-dotenv 1.0.1, gspread 6.2.1, google-auth 2.49.0
- `validate_governance.py` — PASS 19/19

## [1.5.0] — 2026-03-21

### Added (Phase 5: Automation Layer)
- `scripts/daily_log.py` + `.md` — idempotent daily log creation
- `scripts/generate_report.py` + `.md` — template-fill supervision reports, atomic write, CLI
- `scripts/validate_governance.py` + `.md` — regression gate: YAML frontmatter, AUTH footers, workflow refs (19/19 PASS)
- `scripts/archive_logs.py` + `.md` — weekly log compaction + task archival

## [1.4.0] — 2026-03-21

### Added (Phase 4: Simulated Tasks)
- 6 end-to-end workflow test outputs (lead reply, concept brief, supervision, municipality, competitor, bilingual status)
- `operations/logs/2026-03-21.md` — session log
- `operations/tasks.md` updated with task results (6 Done, 3 To Do, 2 In Progress)

## [1.3.0] — 2026-03-21

### Added (Phase 2A: Gemini API + Phase 3: Obsidian Vault)
- `scripts/gemini_client.py` + `.md` — portable Gemini API helper, 3-retry circuit breaker
- `scripts/sheets_sync.py` + `.md` — bidirectional CRM↔Sheets sync, atomic writes
- `operations/` — Dataview dashboard, CRM Kanban (6-stage), task Kanban (4-stage), projects, content pipeline
- `operations/knowledge/municipality_codes.md` — setbacks, FAR, parking with `last_verified` TTL
- `operations/supervision/_template.md` — Templater template with GPS photo-ref
- `views/DASHBOARD.canvas` — Obsidian canvas

## [1.2.0] — 2026-03-21

### Added (Phase 2: Google Sheets)
- `sheets/crm_pipeline.csv` — CRM template with ICP Score column
- `sheets/project_tracker.csv` — project phases matching SOP lifecycle
- `sheets/supervision_log.csv` — with Photo Ref (GPS) column

## [1.1.0] — 2026-03-21

### Added (Phase 1: Context Layer)
- `context/GOALS.md` — Q2 2026 OKRs (lean, <50 lines)
- `context/strategy.md`, `company_context.md`, `icp.md` (ICP scoring 1-5)
- 4 SOPs: concept_design, municipality_approval, site_supervision, client_handover
- 4 comms: README, whatsapp_samples (AR/EN), email_samples, notes_templates

## [1.0.0] — 2026-03-21

### Added (Phase 0: Governance Skeleton)
- Constitution `.agents/GEMINI.md` (§1-§7 including evidence-first)
- Root pointer `GEMINI.md`
- Config layer: guardrails, policies, dialogue-protocol, circuit-breakers, telemetry, AP_catalog
- AP68 Evidence Omission (new anti-pattern)
- WORKSPACE_LEDGER, WORKSPACE_ONTOLOGY
- 5 workflows: new_lead, concept_brief, supervision, municipality, content_post
- `.gitignore`, `.editorconfig`, `requirements.txt`
- Directory scaffolding for all phases

[AUTH: Majaz_OS | changelog | 1.5.1 | 2026-03-21]
