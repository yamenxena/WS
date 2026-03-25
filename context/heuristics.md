---
type: context
version: 2.0.0
last_updated: 2026-03-23
research_date: 2026-03-23
---

# Heuristics — 2025-26 SSoT

> Single Source of Truth for operational heuristics across CRM, architecture, business, AI engineering, and Notion-native tooling.
> [SOURCE: Web research 2026-03-23 — HubSpot, Monograph, Notion docs, capsulecrm, boldtech, streak, prospeo, dhrp, qltech, retyn, treblehook, archivinci]

---

## §1 CRM / RCM Heuristics

### 1.1 Lead Response Time
- **5-minute rule (2026 benchmark):** Leads contacted within 5 minutes are 21× more likely to convert than those contacted after 30 minutes. [SOURCE: prospeo.io 2025 Sales Benchmarks]
- **24-hour ceiling:** Architecture/engineering firms MUST respond within 24h maximum. Beyond 48h → lose ~40% of prospects.
- **WhatsApp-first (UAE):** 85%+ open rate vs 20% email. UAE market prefers WhatsApp for initial contact.
- **Bilingual default:** All client communication in AR/EN unless client explicitly prefers one.

### 1.2 ICP Scoring (Architecture-Specific)
| ICP | Budget (AED) | Location | Readiness | Signal |
|:---:|:------------:|----------|-----------|--------|
| 5 | ≥ 4M | Saadiyat, Reem, Yas | Plot + title deed + budget confirmed | Ready to start, came via referral |
| 4 | 2-4M | Abu Dhabi prime | Plot identified, brief emerging | Clear project, realistic timeline |
| 3 | 1-2M | Any AD location | Some clarity, exploring options | Shows intent, asks questions |
| 2 | < 1M or remote | Al Ain, remote areas | Vague idea, no plot | Browsing, price-shopping |
| 1 | Out of scope | Outside UAE | N/A | Renovation, commercial, not a fit |

**Scoring enrichment signals (2026):**
- Has an existing consultant relationship → higher ICP (knows the process, realistic expectations)
- Client came via referral from won client → +1 ICP boost
- Client is comparing with ≥ 3 other firms → -1 ICP (price-shopping)
- Client demands discount before brief discussion → red flag, ICP cap at 2

### 1.3 Pipeline Management
| Metric | Benchmark | Majaz Current | Gap |
|--------|:---------:|:-------------:|:---:|
| Pipeline coverage ratio | 3:1 to 4:1 (qualified:active) | ~2:1 (8 leads / 5 projects) | 🔴 Under target |
| Win rate | 25-35% (boutique architecture) | ~20% (2 won / 10 total) | 🔴 Below benchmark |
| Lead response time | < 24h (ideal < 5 min) | 48-72h (CRM alerts show >2 day latency) | 🔴 Critical gap |
| Stage velocity: SD→DD | 4-6 weeks | Unknown (no tracking) | 🟡 No data |
| Stage velocity: DD→CD | 6-8 weeks | Unknown | 🟡 No data |
| Payment cycle | < 30 days | 45 days avg, AED 180K overdue | 🔴 Cash flow risk |
| Data quality | 100% field completeness | ~60% (missing ICP, source, dates) | 🔴 Critical gap |

### 1.4 Pipeline Stages (A&E-Specific, 2026 Best Practice)
Best practice for architecture firms: use **project-centric stages**, not generic sales stages.

| Stage | A&E Definition | Exit Criteria |
|-------|---------------|---------------|
| **Inquiry** | New contact, initial conversation | ICP scored, first response sent |
| **Qualified** | Budget, location, scope confirmed | ICP ≥ 3, site identified |
| **Proposal** | Design brief received, fee estimate shared | Agreement draft sent |
| **Negotiation** | Scope/fee discussion ongoing | Terms agreed |
| **Won** | Agreement signed, upfront payment received | Project created in PROJECTS DB |
| **Lost** | Declined, out of scope, or no response 14+ days | Reason logged |

> **Gap in Majaz:** Current LIST OF LANDLORDS has NO pipeline stage tracking. Clients go from "contact" to "project" with no intermediate CRM stages.

### 1.5 Churn & Risk Signals
| Signal | Risk Level | Action |
|--------|:----------:|--------|
| No client response > 5 days during active design | 🟡 At risk | WhatsApp check-in + call |
| Client requesting scope reduction | 🟡 50% retain rate | Re-scope meeting, document |
| Client comparing with other firms mid-process | 🔴 High churn | Urgent attention, value reinforcement |
| Client delays payment > 2 milestones | 🔴 Cash flow | Formal letter, pause deliverables |
| Referral client lost | 🔴 Reputation | Root cause analysis, referrer notification |

### 1.6 Relationship & Referral Management (2026)
- **Post-project nurture:** 60% of Majaz leads come from referrals. Every completed project needs a 30/60/90-day check-in cycle.
- **Referral tracking:** Log referral source (who referred), outcome (won/lost), and referral-to-close time.
- **Client lifetime value (CLV):** Track total revenue per client across projects. UAE HNWIs often have multiple properties.
- **Decision-maker mapping:** In luxury villa projects, track who actually decides (owner, spouse, representative).
- **Communication preference:** Log preferred channel (WhatsApp/call/email) and preferred language per client.

---

## §2 Architectural SME Heuristics

### 2.1 Abu Dhabi Municipality (ADM)
- Submission via ADM e-services portal; Waseem handles directly.
- Estidama compliance mandatory for all new residential (Pearl Rating 1+).
- **Jan 2026 update:** Setback requirements changed — must verify before any new submission.
- NOC chain: Civil Defense → TRANSCO → Etisalat → Municipality → ADDC.
- First-pass approval achievable if: all NOCs complete, Estidama checklist passed, no encroachments.
- Typical ADM review cycle: 2-3 weeks (straightforward) to 6-8 weeks (complex/revision needed).

### 2.2 Dubai Municipality (NEW — First Project 2026)
- Different authority: Dubai Municipality / DLD / TRAKHEES (depending on zone).
- Green building regulations (Al Safat) replacing older codes.
- Different submission format from AD — must research per-project.
- Villa Jumeirah = first learning case.
- **Unknown unknowns:** Fee submission structure, approval timeline, contractor registration requirements.

### 2.3 Project Phase Lifecycle (Aligns to Notion PROJECTS Stage)
| Majaz Stage | Project Phase | Key Deliverables | Duration |
|-------------|-------------|-----------------|:--------:|
| SD | Schematic Design | 3 concept options, site analysis, sun study | 4-6 weeks |
| DD | Design Development | Full BIM model, MEP coordination, structural concept | 6-8 weeks |
| CD | Construction Documents | Contractor-ready drawings, BOQ, specifications | 4-6 weeks |
| AS | Authorities Submission | Municipality package, NOCs, Estidama compliance | 2-6 weeks |
| Bidding | Contractor Selection | BOQ distribution, bid evaluation, recommendation | 3-4 weeks |
| Progress | Construction | Supervision, weekly reports, progress monitoring | 6-18 months |
| Handing Over | Completion | Final walkthrough, snag list, documentation | 2-4 weeks |

### 2.4 Supervision Standards
- Minimum 2 site visits/week during active construction.
- Photo documentation with GPS coordinates mandatory.
- Weekly reports: progress %, issues, contractor compliance, safety.
- Critical hold points: foundation, column rebar, slab pre-pour, MEP rough-in.

---

## §3 Majaz Notion CRM — Gap Analysis

### 3.1 Current Database: LIST OF LANDLORDS

| Property | Present | Type | Assessment |
|----------|:-------:|------|------------|
| Name | ✅ | Title | OK |
| Phone 1 | ✅ | Phone | OK |
| Phone | ✅ | Phone | ⚠️ Rename to "Phone 2" for clarity |
| Email | ✅ | Email | OK |
| Nation | ✅ | Multi-select | OK |
| PROJECTS | ✅ | Relation | OK — links correctly |
| PROJECT/S NUM | ✅ | Rollup | OK — auto-counts |
| REPRESINTITAVE | ✅ | Rich Text | ⚠️ Fix typo → "REPRESENTATIVE" |

### 3.2 Missing Properties (2026 CRM Standard)

> [!IMPORTANT]
> These are the properties needed to make Majaz's CRM competitive with 2026 best practices.

| Property | Type | Why Needed | Priority |
|----------|------|-----------|:--------:|
| **ICP Score** | Number (1-5) | Lead qualification — determines response priority and resource allocation | P0 |
| **Lead Status** | Status | Pipeline tracking (Inquiry → Qualified → Proposal → Negotiation → Won → Lost) | P0 |
| **Lead Source** | Select | Attribution — track where leads come from (Referral, Instagram, Website, Direct, LinkedIn) | P0 |
| **Referred By** | Rich Text | Referral tracking — critical since 60% of leads are referrals | P0 |
| **Next Action** | Rich Text | What needs to happen next — prevents leads going cold | P1 |
| **Due Date** | Date | Deadline for next action — enforces 24h response rule | P1 |
| **Location** | Select | Plot/area (Reem, Saadiyat, Yas, Khalifa, Jumeirah, AlAin, Other) | P1 |
| **Budget (AED)** | Number | Estimated construction budget — drives ICP score + revenue forecast | P1 |
| **Project Type** | Select | Villa, Townhouse, Commercial, Renovation, Landscape, Addition | P1 |
| **Service Interest** | Select | DESIGN / SUPERVISION / BOTH — matches PROJECTS Service Type | P1 |
| **Preferred Language** | Select | Arabic / English / Both — communication preference | P2 |
| **Preferred Channel** | Select | WhatsApp / Call / Email — response channel preference | P2 |
| **Last Contacted** | Date | Tracks recency — flags stale leads | P2 |
| **CLV (Lifetime Value)** | Rollup | Sum of all project Values — identifies high-value repeat clients | P2 |
| **Communication Log** | Rich Text | Page body for detailed notes — each contact page becomes a log | P2 |
| **Lost Reason** | Select | Budget, Competition, Scope, Timing, No Response — analytics | P2 |
| **Assigned To** | People | Who manages this lead — delegation tracking | P2 |

### 3.3 Missing Database: INTERACTIONS

A key 2026 CRM best practice is a separate **Interactions database** to log every touchpoint:

| Property | Type | Notes |
|----------|------|-------|
| Date | Date | When the interaction happened |
| Type | Select | Call, WhatsApp, Email, Meeting, Site Visit |
| Summary | Rich Text | What was discussed |
| Next Steps | Rich Text | What was agreed |
| Client | Relation | → LIST OF LANDLORDS |
| Project | Relation | → PROJECTS |
| Logged By | People | Who logged it |

> **Without this**, communication history is scattered across WhatsApp, email, and memory. This is Majaz's #1 risk for lost context and dropped follow-ups.

### 3.4 Missing Database Views

Notion databases need multiple views for different workflows:

| View | Type | Filters | Purpose |
|------|------|---------|---------|
| **Pipeline Board** | Board by Lead Status | Active leads only | Sales pipeline kanban |
| **Response Overdue** | Table | Due Date < today | Catch dropped leads |
| **High-Priority Leads** | Table | ICP ≥ 4 | Focus attention |
| **Referral Source** | Table grouped by Lead Source | All | Attribution analytics |
| **Won/Lost Analysis** | Board by Lead Status | Won + Lost | Win rate tracking |
| **This Week's Actions** | Calendar | Due Date = this week | Weekly planning |

---

## §4 Business & Policy Heuristics

### 4.1 UAE SME Regulations
- Engineering consultancy license: Department of Economic Development (DED) Abu Dhabi.
- Dubai practice: separate DED registration required (Majaz in process).
- Professional Engineer registration: Society of Engineers UAE.
- Professional liability insurance: recommended AED 1M minimum coverage.

### 4.2 Fee Benchmarking (2025-26 UAE Boutique Architecture)
| Project Type | Fee Range (AED) | % of Construction | Market Position |
|-------------|:--------------:|:-----------------:|:--------------:|
| Villa 500-800 sqm | 250K-500K | 5-8% | Boutique premium |
| Townhouse | 120K-200K | 4-6% | Competitive |
| Supervision only | 8K-15K/month | — | Retainer |

### 4.3 Cash Flow Management
- **Payment milestone standard (A&E 2026):** 30% upfront / 30% at drawings / 40% at handover.
- **Risk threshold:** 3+ overdue invoices = cash flow crisis for boutique firm.
- **Invoice follow-up:** Automate with 7/14/30-day escalation (see WF-CRM-03).
- **Financial KPIs to track:** Revenue per project stage, outstanding receivables aging, monthly burn rate.

### 4.4 Delegation Strategy
| Task Area | Waseem (Founder) | Junior Engineer | Office Admin |
|-----------|:----------------:|:---------------:|:------------:|
| Concept design | ✅ Primary | ❌ | ❌ |
| Municipality submission | ✅ Primary | 🟡 Preparation | ❌ |
| Site supervision | 🟡 Critical only | ✅ Primary | ❌ |
| Client meetings | ✅ Primary | 🟡 Observer | ❌ |
| Lead responses | 🟡 ICP 4-5 only | ❌ | ✅ ICP 1-3 |
| Invoice follow-up | 🟡 Escalation | ❌ | ✅ Primary |
| Supervision reports | 🟡 Review | ✅ Primary | ❌ |
| Social media content | 🟡 Approval | ❌ | ✅ Scheduling |

---

## §5 AI Engineering Heuristics

### 5.1 Notion API (2025-26)
- **Rate limits:** 3 requests/second per integration. Batch operations when possible.
- **⚠️ Sept 2025 breaking change:** API version `2025-09-03` introduced `data_source_id` replacing `database_id` for multi-source databases. Existing integrations may break if users add another data source.
- **Relation pagination:** Relations return max 25 items per page. Must paginate to get full list.
- **Rollup depth:** Single-level only. Nested rollups (A→B→C) may return inaccurate results.
- **Formula limits:** Max depth 10 referenced tables. Max chain of 15 referenced formula properties.
- **Status property:** Case-sensitive — "Not started" ≠ "not started". Must match exactly.
- **Cannot update via API:** Formula properties, Select/Status option values (can remove, not rename).
- **Rich text:** Max 2000 characters per block. Split longer content.
- **File uploads:** Supported as of May 2025.
- **Bulk updates:** Limited to ~1000 pages at a time natively.

### 5.2 MCP Integration Patterns
- **Notion MCP:** Provides search, CRUD, query tools. Best for structured data operations.
- **Tool chaining:** Query database → process results → create/update pages in sequence.
- **Error handling:** 404 = integration not connected. 429 = rate limit (wait 1s). 400 = bad request (check property types).
- **Idempotency:** Always search for existing page before creating to avoid duplicates.
- **data_source_id migration:** Use `retrieve-a-data-source` and `query-data-source` tools (new API).

### 5.3 Agent-Operated CRM (SOTA 2025-26)
- **Read-heavy pattern:** Most CRM operations are reads (pipeline view, search, reports). Optimize for query speed.
- **Write-light pattern:** Creates (new lead) and updates (stage change) are infrequent. Validate before writing.
- **AI-powered lead scoring (2026 standard):** CRMs now use AI for predictive lead scoring, next-best-action, and churn prediction. Majaz can approximate with ICP + rule-based scoring.
- **Unified customer profile:** Single view of all client touchpoints (calls, emails, meetings, project status). Requires Interactions database.
- **Automated follow-up:** Notion automations can trigger reminders on Due Date, but complex multi-step workflows need external tools (n8n, Zapier, Make).
- **Context window management:** For large CRM (27+ clients), load only active pipeline. Archive completed projects.

### 5.4 Dashboard Design (2026)
- **CRM dashboard KPIs to display:** Active leads count, pipeline value, response latency, overdue invoices, win/loss ratio.
- **Pipeline visualization:** Board (kanban) view is standard. Calendar view for due dates.
- **Real-time sync:** Notion API query on page load → render latest data. Cache for 5 minutes.
- **Mobile-responsive:** A&E professionals work on-site. Dashboard must work on mobile.
- **Dark mode with high contrast:** Architecture firm aesthetic. Use brand colors.

### 5.5 Python Automation
- **notion-client:** Official Python SDK (`pip install notion-client`). Preferred over community forks.
- **gspread:** Google Sheets integration (retained for reporting, superseded for CRM).
- **python-dotenv:** Environment variable management.
- **Atomic writes:** Always write to `.tmp` then rename. Never leave partial files.

---

## §6 Notion-Native Resources & References

### 6.1 CRM Database Design Patterns
- **Modular 4-DB model (2026 standard):** Contacts ↔ Companies ↔ Deals ↔ Interactions.
- **Majaz equivalent:** Landlords ↔ (no Companies — direct B2C) ↔ Projects ↔ (no Interactions — **GAP**).
- **Status as pipeline:** Use Status property type for kanban-compatible stages (not Select).
- **Rollups for metrics:** Aggregate task completion → project progress, project values → CLV.
- **Formulas for alerts:** Due date formulas can flag overdue items: `if(prop("Due Date") < now(), "⚠️ OVERDUE", "")`.

### 6.2 Recommended Views per Database

| Database | Board View | Table View | Calendar View | Gallery View |
|----------|:----------:|:----------:|:-------------:|:------------:|
| Landlords (CRM) | By Lead Status | High ICP / Overdue | Due Dates | — |
| Projects | By Stage | By Service Type | Timeline | — |
| Tasks | By Status | By Assignee | Due Dates | — |
| Interactions | — | By Type | By Date | — |

### 6.3 External Tool Integration
- **Notion → Python (via API/MCP):** Query, create, update pages. Primary automation layer.
- **Notion → Google Sheets (via Zapier/Make):** Financial reporting, invoice tracking.
- **WhatsApp → Notion (via n8n):** Auto-log incoming messages as Interactions.
- **Email → Notion (via Zapier):** Auto-create leads from inquiry emails.

### 6.4 GitHub Resources
- `notion-sdk-py` → Official Python SDK
- `notion2md` → Convert Notion blocks to markdown
- `awesome-notion` → Curated list of Notion API tools
- `n8n` → Workflow automation (self-hosted, free tier)

[AUTH: Majaz_OS | heuristics | 2.0.0 | 2026-03-23]
