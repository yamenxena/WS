# Majaz Engineering Consultancy — AI OS Workspace

> **Architect:** Waseem AlShalabi · **Firm:** Majaz Engineering Consultancy, Abu Dhabi  
> **Stack:** Antigravity Ultra (Gemini Pro 3.1 / Claude 4.6 Opus) · Obsidian · Google Sheets

---

## How This Workspace Works

This workspace is an **AI Operating System** — a structured set of markdown files that give an AI agent (via Antigravity) full context about your business, rules to follow, and workflows to execute. You chat with the agent, and it reads these files to produce high-quality, on-brand outputs.

```
  YOU (WhatsApp / Email / Field Notes)
   │
   ▼
┌─────────────────────────────────────────────┐
│  ANTIGRAVITY CHAT SESSION                  │
│  Gemini Pro 3.1 / Claude 4.6 Opus         │
│                                             │
│  Agent reads:                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ GOALS.md │→│strategy.md│→│  SOP     │ │
│  │(priorities)│ │(context) │ │(process)  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│         │              │             │      │
│         ▼              ▼             ▼      │
│  ┌──────────────────────────────────────┐  │
│  │  WORKFLOW (new_lead / supervision /  │  │
│  │  municipality / concept / content)   │  │
│  └──────────────────────────────────────┘  │
│                    │                        │
│                    ▼                        │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
│  │ output/ │  │ tasks.md│  │  logs/   │  │
│  │(results)│  │(updated)│  │(recorded)│  │
│  └─────────┘  └─────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
   │                │               │
   ▼                ▼               ▼
  Files you        Obsidian        Google
  send/use         Dashboard       Sheets
```

---

## Inputs — What You Provide

| Input Type | Where It Goes | Example |
|-----------|---------------|---------|
| **New lead inquiry** | Paste in chat → agent runs `new_lead` workflow | "Got a WhatsApp from Ahmed about a villa on Reem Island, budget 4.5M" |
| **Field notes** | Paste in chat → agent runs `supervision` workflow | "Visit #14, Villa Saadiyat, found rebar spacing issue on column C7" |
| **Brief request** | Tell agent → runs `concept_brief` workflow | "Start a concept brief for Villa Al-Reem, 500sqm modern villa, Reem Island" |
| **Municipality check** | Tell agent → runs `municipality` workflow | "Run pre-compliance check for Villa Al-Reem before submission" |
| **Content idea** | Tell agent → runs `content_post` workflow | "Draft an Instagram post showcasing Villa Al-Reem concept render" |
| **Ad-hoc question** | Just ask in chat | "Write a bilingual status update for Villa Saadiyat" |

---

## Outputs — What You Get

| Output Type | Location | Format |
|------------|----------|--------|
| **Lead replies** (WhatsApp/email) | `output/communications/` | `.md` — copy-paste ready (AR/EN) |
| **Concept briefs** | `output/proposals/` | `.md` — design narrative + setback check |
| **Supervision reports** | `operations/supervision/` | `.md` — findings table, GPS photo-refs, severity |
| **Municipality checklists** | `output/reports/` | `.md` — compliance status, flags, required docs |
| **Competitor research** | `output/research/` | `.md` — positioning matrix, recommendations |
| **Content drafts** | `output/communications/` | `.md` — social post with hashtags, CTA |
| **Updated CRM** | `operations/crm.md` | Kanban board with ICP scores |
| **Updated tasks** | `operations/tasks.md` | Task board with priorities |
| **Session log** | `operations/logs/` | `.md` — what was done, what changed |

Every output includes:
- `[SOURCE: filepath]` — evidence for every claim
- `[AUTH: Agent | Majaz_OS | date]` — provenance stamp

---

## How to Run — Day-to-Day Usage

### 1. Start a Chat Session (Antigravity)

Open Antigravity → the agent automatically reads `GEMINI.md` → which loads the constitution, goals, and rules.

**Just tell it what you need in plain language:**

```
"I got a WhatsApp from Fatima asking about a villa design 
 in Khalifa City. Budget around 3M. She found us on Instagram."
```

The agent will:
1. Read your ICP scoring criteria
2. Score the lead (1-5)
3. Draft a reply in your tone
4. Add to CRM
5. Log the session

### 2. Review Output

Check `output/` folder — or open Obsidian to see:
- CRM Kanban (drag leads between stages)
- Task board (see what's pending)
- Dashboard (Dataview auto-queries)

### 3. Sync to Google Sheets (optional)

```powershell
# Push CRM from Obsidian → Google Sheets
python scripts/sheets_sync.py push --sheet "Majaz CRM"

# Pull updates from Sheets → Obsidian
python scripts/sheets_sync.py pull --sheet "Majaz CRM"
```

### 4. Generate Reports (optional)

```powershell
# Generate supervision report from CLI
python scripts/generate_report.py --project "Villa Saadiyat" --inspector "Waseem" --visit 15 --findings '[{"item":"crack in beam","severity":"Major","photo_ref":"GPS:24.54,54.43"}]'
```

### 5. Ask Gemini API directly (optional)

```powershell
python scripts/gemini_client.py "Summarize Abu Dhabi villa setback requirements"
```

---

## Obsidian Setup

**Open Obsidian → "Open folder as vault" → select `D:\YO\WS`**

### Required Plugins
| Plugin | Purpose | Install |
|--------|---------|---------|
| **Kanban** | CRM pipeline + task board (drag-and-drop) | Community plugins → search "Kanban" |
| **Dataview** | Auto-refreshing dashboard queries | Community plugins → search "Dataview" |
| **Templater** | Supervision report templates | Community plugins → search "Templater" |
| **Calendar** | Daily log navigation | Community plugins → search "Calendar" |

### What You'll See

**Sidebar:** Navigate folders → `operations/` has your live data.

**CRM Kanban** (`operations/crm.md`):
- 6 columns: New → Contacted → Qualified → Proposal Sent → Won → Lost
- Drag cards between columns as leads progress
- Each card shows: client name, ICP score, budget, next action

**Dashboard** (`operations/README.md`):
- Active Leads table (auto-sorted by ICP score)
- Active Projects table (completion %)
- Recent Tasks (due date sorted)
- Content Pipeline (scheduled posts)

**Task Board** (`operations/tasks.md`):
- 4 columns: To Do → In Progress → Waiting → Done
- Tasks auto-created by workflows

---

## Google Sheets Setup

### Step 1: Import CSVs

1. Open [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet → name: **"Majaz CRM"**
3. File → Import → Upload `sheets/crm_pipeline.csv`
4. Repeat for `project_tracker.csv` and `supervision_log.csv` (as separate sheets/tabs)

### Column Layout

**CRM Pipeline:**
| Lead ID | Client | Source | Type | Status | ICP Score | Budget (AED) | Location | Next Action | Date Added |
|---------|--------|--------|------|--------|:---------:|:------------:|----------|-------------|------------|
| L001 | Ahmed K. | Instagram | Villa | Qualified | 5 | 4,500,000 | Reem Island | Schedule meeting | 2026-03-21 |

**Supervision Log:**
| Date | Project | Inspector | Category | Finding | Severity | Photo Ref | Action | Deadline | Status |
|------|---------|-----------|----------|---------|----------|-----------|--------|----------|--------|
| 2026-03-21 | Villa Saadiyat | Waseem | Structural | C7 rebar spacing | Major | GPS:24.54,54.43 | Verify calc | 2026-03-23 | Open |

### Step 2: Sync (optional)

Set up Google Service Account → add creds path to `D:\YO\.env` → run `sheets_sync.py push`.

---

## Python Environment

All dependencies live in `D:\YO\.venv`. Scripts are portable — no hardcoded paths.

```powershell
# Activate venv
D:\YO\.venv\Scripts\activate

# Install deps
pip install -r requirements.txt

# Run governance check
python scripts/validate_governance.py

# Run daily log
python scripts/daily_log.py

# Archive old logs (weekly)
python scripts/archive_logs.py --all
```

---

## Agent Re-Entry Path

On every new session, the agent reads in this order:

1. **Ledger** → `.agents/artifacts/WORKSPACE_LEDGER.md` — current phase
2. **Constitution** → `.agents/GEMINI.md` — rules and boundaries
3. **Config** → `.agents/config/` — guardrails, policies, protocol
4. **Goals** → `context/GOALS.md` — quarterly priorities
5. **Tasks** → `operations/tasks.md` — active work
6. **Workflows** → `.agents/workflows/` — execution recipes
7. **Output** → `output/` — where to write results

---

## Quick Links

- [Constitution](.agents/GEMINI.md) · [Guardrails](.agents/config/guardrails.md) · [Policies](.agents/config/policies.md)
- [CHANGELOG](.agents/CHANGELOG.md) · [Ledger](.agents/artifacts/WORKSPACE_LEDGER.md)
- [Goals](context/GOALS.md) · [Strategy](context/strategy.md) · [ICP](context/icp.md)
- [CRM](operations/crm.md) · [Tasks](operations/tasks.md) · [Projects](operations/projects.md)

---

## ⚠️ Fictional Content — Replace With Real Data

The following files were generated with **realistic but fictional** content. Replace with your actual data:

| File | What's Fictional | Action |
|------|-----------------|--------|
| `context/GOALS.md` | Q2 2026 OKRs | Replace with your real quarterly priorities |
| `context/strategy.md` | Vision, service lines, target market | Adjust to your actual positioning |
| `context/company_context.md` | `[Year]`, `[website]`, `[email]`, `[phone]` | Fill in real values |
| `context/icp.md` | Budget ranges, scoring weights | Verify against your real client profile |
| `context/sops/*.md` | 4 SOPs (generic) | Adjust to your actual processes |
| `comms/*.md` | Sample replies (AR/EN) | Replace with your real tone/templates |
| `operations/projects.md` | "Villa Al-Reem", "Villa Saadiyat" | Replace with real projects |
| `operations/content_pipeline.md` | 4-week calendar | Replace with real schedule |
| `operations/knowledge/municipality_codes.md` | Setback/FAR values (indicative) | Verify with latest ADM circulars |
| `output/` (all files) | 6 simulated task outputs | Keep as examples or delete |

### Files That Are Ready (no changes needed)
- `.agents/` — Constitution, configs, workflows ✅
- `scripts/` — All automation scripts ✅
- `.gitignore`, `.editorconfig`, `requirements.txt` ✅

[AUTH: Majaz_OS | readme | 2.0.0 | 2026-03-21]
