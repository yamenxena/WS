# Changelog

All notable changes to this workspace governance are documented here.
Format: [SemVer](https://semver.org/)

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
