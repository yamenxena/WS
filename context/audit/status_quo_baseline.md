# Majaz CRM — Status Quo Baseline (Pre-Rewrite Snapshot)

> **Date:** 2026-03-25 · **Version:** v1.0 (Phase 6 Complete)  
> **Purpose:** Preserve the exact state of the CRM app before any rewrite begins.

---

## 1. Architecture Overview

```
┌─────────────────────────────────┐
│   Frontend (Vanilla JS + CSS)   │  Deployed: Vercel (auto from main)
│   web/crm/                      │  URL: https://ws-sandy.vercel.app/web/crm/
├─────────────────────────────────┤
│   Backend (Flask Proxy)         │  File: scripts/notion_web_proxy.py
│   Python 3 + Flask + flask-cors │  Deployed: Vercel Serverless
├─────────────────────────────────┤
│   SSoT: Notion API              │  10 databases
│   Auth: JWT (single password)   │  Env: NOTION_API_KEY, JWT_SECRET
└─────────────────────────────────┘
```

---

## 2. File Inventory

### Frontend — `web/crm/`

| File | Lines (approx) | Size | Purpose |
|------|:-:|:-:|---------|
| `index.html` | 288 | 12.7 KB | Main SPA shell — sidebar, all view sections, modals, script imports |
| `login.html` | ~150 | 8.1 KB | Login page with password form + JWT handshake |
| `css/design-system.css` | ~700 | 23.8 KB | Full design system: dark theme, glassmorphism, responsive media queries, badges, Kanban |
| `js/api.js` | 118 | 3.8 KB | API client — GET/POST/PATCH wrappers, JWT header injection, auth redirects |
| `js/router.js` | ~140 | 6.1 KB | SPA router — `data-view` click handling, `viewChange` event dispatcher |
| `js/dashboard.js` | ~130 | 5.0 KB | Dashboard KPI cards + Chart.js bar charts |
| `js/clients.js` | ~420 | 15.8 KB | Client table (11 cols) + detail panel (7 sections) + Add Client + Edit + Log Interaction |
| `js/projects.js` | ~470 | 17.5 KB | Project Kanban + detail panel (linked tasks, progress) + Add Project form |
| `js/tasks.js` | ~350 | 13.1 KB | Task Kanban + drag-and-drop status update + Add Task form |
| `js/reports.js` | ~160 | 6.1 KB | 7 KPI cards + 6 bar charts (Pipeline, Stages, Statuses, Services) |
| `js/team.js` | ~130 | 5.2 KB | Team + Suppliers table with detail panels |
| `js/meetings.js` | ~90 | 3.3 KB | Meetings table with attendees, linked projects |
| `js/pipeline.js` | ~100 | 3.8 KB | Pipeline table with stage filter + detail panel |
| `js/interactions.js` | ~100 | 4.0 KB | Interactions table with type badges + cross-links |
| `js/concept_plans.js` | ~110 | 4.3 KB | Concept plans checklist with progress bar + search |

### Backend — `scripts/notion_web_proxy.py`

| Metric | Value |
|--------|-------|
| Total lines | 786 |
| Size | 28.0 KB |
| Framework | Flask + flask-cors |
| Auth | JWT (PyJWT) |
| Notion databases connected | 10 |

---

## 3. Notion Databases (10 Connected)

| Key | Database Name | DB ID |
|-----|---------------|-------|
| `projects` | Projects | `32b39a01-a595-8031-b453-c18e335772fe` |
| `tasks` | Tasks | `32b39a01-a595-80cb-903a-d341d2ae9b49` |
| `clients` | Clients | `32b39a01-a595-802c-b37b-e4723f2e8994` |
| `interactions` | Interactions | `32c39a01-a595-81e9-9781-e4784472cacf` |
| `meetings` | Meetings | `32c39a01-a595-8049-b1da-dbbe89473309` |
| `pipeline` | Pipeline | `32c39a01-a595-806a-a8cd-eeeac94f31ba` |
| `stage_cards` | Stage Task Cards | `32c39a01-a595-80a3-b074-d9a3ebb810d7` |
| `suppliers` | Suppliers | `32c39a01-a595-80e4-8378-dec2b3542223` |
| `team` | Team Members | `32b39a01-a595-805d-9207-c50a008a280e` |
| `concept_plans` | (SD) Concept Plans | `32b39a01-a595-801b-ac03-c0ab854337c8` |

---

## 4. API Endpoints (Backend)

### Read (GET)
| Endpoint | Returns |
|----------|---------|
| `GET /api/dashboard` | Aggregated KPIs from all databases |
| `GET /api/clients` | All clients with 27 transformed properties |
| `GET /api/clients/<id>` | Single client detail |
| `GET /api/projects` | All projects with stage, service type, value |
| `GET /api/projects/<id>` | Single project + linked tasks |
| `GET /api/tasks` | All tasks (filterable by `?status=`) |
| `GET /api/meetings` | All meetings |
| `GET /api/pipeline` | All pipeline records |
| `GET /api/interactions` | All interactions |
| `GET /api/stage-cards` | Stage task cards |
| `GET /api/concept-plans` | Concept plan checklists |
| `GET /api/suppliers` | All suppliers |
| `GET /api/team` | Team members |
| `GET /health` | Health check |

### Write (POST / PATCH)
| Endpoint | Method | Action |
|----------|--------|--------|
| `POST /api/clients` | POST | Create new client in Notion |
| `PATCH /api/clients/<id>` | PATCH | Update client fields (next_action, budget, lead_status) |
| `POST /api/projects` | POST | Create new project in Notion |
| `PATCH /api/projects/<id>` | PATCH | Update project fields (stage, value, description) |
| `POST /api/tasks` | POST | Create new task in Notion |
| `PATCH /api/tasks/<id>` | PATCH | Update task fields (status, due_date, duration) |
| `POST /api/interactions` | POST | Create interaction in Notion |
| `POST /api/login` | POST | Authenticate + issue JWT |

---

## 5. Sidebar Navigation (10 Items)

| # | Label | View Key | Badge |
|---|-------|----------|-------|
| 1 | 📊 Dashboard | `dashboard` | — |
| 2 | 👥 Clients | `clients` | Count |
| 3 | 📐 Projects | `projects` | Count |
| 4 | ✅ Tasks | `tasks` | Count |
| 5 | 📅 Meetings | `meetings` | Count |
| 6 | 🔄 Pipeline | `pipeline` | Count |
| 7 | 💬 Interactions | `interactions` | Count |
| 8 | 👷 Team & Suppliers | `team` | — |
| 9 | 📈 Reports | `reports` | — |
| 10 | 📋 Concept Plans | `concept-plans` | — |
| — | 📗 Google Sheets | External link ↗ | — |

---

## 6. Current Feature Matrix

| Feature | Status | Notes |
|---------|:------:|-------|
| Dashboard KPIs | ✅ | 4 stat cards + Chart.js charts |
| Client table (11 cols) | ✅ | Click → side detail panel |
| Client detail (7 sections) | ✅ | Contact, Profile, Business, Status, Quick Edit, Projects, Interactions |
| Add Client form | ✅ | 6 fields → POST to Notion |
| Edit Client (Quick Edit) | ✅ | Next Action, Budget, Lead Status |
| Log Interaction | ✅ | Title, Type, Summary, Next Steps |
| Projects Kanban | ✅ | Dynamic stages, drag-and-drop |
| Project detail (linked tasks) | ✅ | Progress bar, task list, value |
| Add Project form | ✅ | 6 fields → POST to Notion |
| Tasks Kanban | ✅ | Dynamic statuses, drag-and-drop |
| Add Task form | ✅ | 5 fields → POST to Notion |
| Meetings table | ✅ | Attendees, linked projects |
| Pipeline table | ✅ | Stage filter, type, duration |
| Interactions table | ✅ | Type badges, cross-links |
| Team & Suppliers | ✅ | Tables + detail panels |
| Reports (7 KPIs + 6 charts) | ✅ | Aggregated from all modules |
| Concept Plans | ✅ | Progress bar, checklist, search |
| Mobile responsive | ✅ | Hamburger sidebar, stacked layout |
| JWT Authentication | ✅ | Single shared password |
| Drag-and-drop write-back | ✅ | Projects (stage), Tasks (status) |
| Role-based access | ❌ | Not implemented — all users see same view |
| Delete/archive records | ❌ | Not exposed in UI |
| Bulk actions | ❌ | Not implemented |
| Inline form validation | ❌ | Basic — no field-level errors |
| Side-peek (off-canvas) | ⚠️ | Partial — detail panels exist but not standardized |
| Dark/Light theme toggle | ❌ | Dark only |

---

## 7. Total Codebase Summary

| Metric | Value |
|--------|-------|
| **Total source files** | 16 |
| **Total lines of code** | ~3,786 |
| **Frontend files** | 15 (2 HTML + 1 CSS + 12 JS) |
| **Backend files** | 1 (Python Flask) |
| **Notion databases** | 10 |
| **API endpoints** | 22 (14 GET + 7 POST/PATCH + 1 health) |
| **External dependencies** | Flask, flask-cors, PyJWT, requests, Chart.js (CDN), Inter font (CDN) |
| **Build step required** | None (Vanilla JS) |
| **Deployment** | Vercel auto-deploy from `main` branch |
| **Live URL** | `https://ws-sandy.vercel.app/web/crm/` |

---
*Snapshot taken on 2026-03-25 at 05:50 UTC+3, prior to Phase 7 rewrite.*
