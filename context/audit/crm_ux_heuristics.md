# Majaz CRM — UX/UI Design Constitution (v2)

> **Scale:** SME (≤20 users) · **SSoT:** Notion · **Posture:** Full rewrite authorized  
> **Design Philosophy:** Simplicity without compression loss — every Notion property surfaced, but only when needed.

---

## 1. The Two Personas

The entire CRM is built around two distinct user archetypes. Every screen, every button, every data field answers the question: *"Who needs this, and when?"*

### 👷 The Team (Employees)
**Goal:** Get in, do the task, get out.  
**Mindset:** "Show me my work. Let me update it. Don't make me think."

| They NEED | They DON'T need |
|-----------|-----------------|
| Their assigned Tasks (filtered by owner) | Bulk database operations |
| Active Projects they're working on | Financial summaries or pipeline stage counts |
| Client contact info for calls/site visits | Lead source analytics or conversion funnels |
| Quick status updates (drag-and-drop) | Schema management or property editing |
| Mobile-first, thumb-friendly interface | Admin audit logs |

**UX Rule:** The Team should never see more than **5-7 data columns** on any table view. All secondary data lives behind a click (side-peek).

---

### 🛡️ The Admin (Waseem)
**Goal:** Full operational visibility. Steer the business, audit data quality, manage the pipeline.  
**Mindset:** "Show me everything — but let me choose what to focus on."

| They NEED | How to deliver it |
|-----------|-------------------|
| All 27 Client properties | Collapsible section groups (Contact / Profile / Business / Status) with **show/hide toggles** |
| Full Pipeline with stage analytics | Kanban board + expandable stage summary cards |
| Financial data (project values, budgets) | Dedicated Admin-only "Finance" tab or KPI row |
| Ability to add/edit/archive any record | Full CRUD access with confirmation dialogs on destructive actions |
| Audit trail (who changed what, when) | Activity log panel (sourced from Notion's `last_edited_by` + `last_edited_time`) |
| Database-level configuration | Admin Settings page (property visibility toggles, default filters) |

**UX Rule:** The Admin sees every data field that exists in Notion — but grouped, collapsible, and filterable. **Never a wall of raw data.** Clarity through progressive disclosure with expand/collapse controls.

---

## 2. Core Design Heuristics (Adapted from Nielsen + Open-Source Leaders)

These 8 rules govern every screen in the CRM. Sourced from Twenty CRM, EspoCRM, ERPNext, and Nielsen's 10 Usability Heuristics.

| # | Heuristic | CRM Implementation |
|---|-----------|-------------------|
| 1 | **Progressive Disclosure** | Show 5-7 columns on list views. All secondary data accessed via a side-peek panel that slides from the right — never navigate away from the list. |
| 2 | **Role-Based Views** | Team sees a filtered, simplified dashboard. Admin sees the full operational view. Same underlying data, different presentation layers. |
| 3 | **1-Click Core Actions** | Add Client, Log Task, Update Status — always accessible via a floating action button (FAB) or inline quick-edit. Never more than 2 clicks for key workflows. |
| 4 | **Visibility of System Status** | After every write-back, show an inline toast: `✅ Client updated` / `⚠️ Save failed — retry`. Never leave the user wondering if their action worked. |
| 5 | **Error Prevention over Error Recovery** | Use relational dropdowns (fetching live Projects from API) instead of free text. Structurally prevent orphaned data. |
| 6 | **Real-World Language** | Use `(SD) Schematic Design` not `Phase 1`. Use `Client` not `Contact Record`. Match terminology to what the team says on-site. |
| 7 | **Admin: Show/Hide Toggles** | Admin can toggle visibility of data sections and columns. Collapsed state is remembered per-session so the Admin's custom view persists. |
| 8 | **Mobile-First, Touch-Ready** | All interactive elements ≥44px. Horizontal-scroll Kanban. Hamburger sidebar. Stacked cards on narrow screens. |

---

## 3. Data Visibility Matrix (No Compression Loss)

Every Notion property is surfaced in the CRM — nothing is hidden permanently. The question is *where* it appears for each persona.

### Clients (27 Notion Properties)

| Property | Team View (Table) | Team View (Side-Peek) | Admin View |
|----------|:-:|:-:|:-:|
| Name | ✅ Column | ✅ Header | ✅ Always |
| Phone / Email | ✅ Column | ✅ Contact section | ✅ Always |
| Location | ✅ Column | ✅ Contact section | ✅ Always |
| Lead Status | ✅ Badge | ✅ Status section | ✅ Editable |
| Service Type | — | ✅ Profile section | ✅ Editable |
| ICP / Urgency / Budget | — | ✅ Business section | ✅ Editable |
| Next Action / Next Action Date | — | ✅ Quick Edit | ✅ Editable |
| Lead Source / Referral | — | — | ✅ Collapsible |
| Projects (relation) | — | ✅ Linked list | ✅ Linked list |
| Interactions (relation) | — | ✅ Linked list | ✅ Linked list |
| Created/Edited timestamps | — | — | ✅ Audit section |

### Projects / Tasks / Pipeline
Same principle applies: **Team sees Name + Status + Owner on the table.** Everything else (Value, Duration, Description, Linked Client) is revealed in the side-peek or available on Admin views.

---

## 4. Reference Architecture & Best GitHub Sources

### Component Ecosystems (Ordered by Relevance to Majaz)

| Library | GitHub Stars | Why It's Relevant | Use Case |
|---------|:-----------:|-------------------|----------|
| [**TailAdmin**](https://github.com/TailAdmin/TailAdmin) | 10K+ | **Supports Vanilla HTML** — no React required. Gives us modern component aesthetics (sidebar, cards, tables, charts) without a framework. Closest fit to our current stack. | Dashboard layout, sidebar, data tables, form elements |
| [**Twenty CRM**](https://github.com/twentyhq/twenty) | 25K+ | The gold-standard for CRM side-peek UX and relational data navigation. Study for UX patterns, not codebase adoption. | UX reference for side-peeks, inline editing, Kanban |
| [**shadcn/ui**](https://github.com/shadcn-ui/ui) | 80K+ | Best-in-class accessible components. If we ever migrate to React/Next.js, this is the non-negotiable starting point. | Future migration reference |
| [**Tremor**](https://github.com/tremorlabs/tremor) | 16K+ | Best dashboard chart/KPI components. Even without React, we can study their chart patterns and replicate with Chart.js. | KPI card design patterns, chart layouts |
| [**EspoCRM**](https://github.com/espocrm/espocrm) | 2K+ | Clean, minimalist CRM with fast contextual menus and role-based layouts. The closest open-source CRM to our SME scale. | Workflow speed patterns, Admin layout reference |

### CSS-Only Patterns We Can Adopt Immediately
These require zero framework migration:
- **CSS `details`/`summary`** for collapsible Admin sections (show/hide property groups)
- **CSS Grid + `@container` queries** for responsive card layouts
- **CSS `:has()` selectors** for state-driven styling (highlight rows with overdue tasks)
- **`backdrop-filter: blur()`** for glassmorphic modal overlays (already in our design system)

---

## 5. Architectural Decision: Full Rewrite Strategy

> [!IMPORTANT]
> The user has authorized a **full app rewrite** if it produces the best possible UX matching top GitHub standards. The question is not "should we rewrite?" but "what is the smartest rewrite path?"

### Recommended Rewrite Path

| Phase | Scope | Approach |
|:-----:|-------|----------|
| **R1** | **Design System Overhaul** | Rebuild `design-system.css` from scratch using TailAdmin's layout patterns. Implement CSS custom properties for theme switching (dark/light). Add the show/hide toggle system for Admin sections. |
| **R2** | **Dual-Persona Router** | Implement a role-based login (`admin` vs `team`) that controls which sidebar modules and data columns are visible. Same backend, different frontend presentation. |
| **R3** | **Side-Peek Architecture** | Replace all current detail panels with a standardized Side-Peek component that slides from the right, preserves the list view underneath, and uses collapsible sections with show/hide toggles. |
| **R4** | **Data Entry Excellence** | Rebuild all forms with relational ComboBox dropdowns, inline validation, and auto-save. Every form field should prevent bad data structurally. |
| **R5** | **Admin Power Tools** | Build the Admin-only views: Activity Audit Log, Financial Summary, Column Visibility Settings, and Bulk Actions (archive, reassign). |

### What We Keep
- **Python Flask Proxy** — proven, stable, zero issues
- **Notion as SSoT** — no database migration
- **Vercel deployment** — instant CI/CD from GitHub push
- **Chart.js** for data visualization — lightweight, no React required

### What We Rebuild
- **All frontend HTML/CSS/JS** — rebuilt with modern heuristics from day one
- **Sidebar navigation** — role-aware, collapsible, mobile-first
- **All data tables** — with column toggle controls for Admin
- **All detail views** — standardized Side-Peek pattern
- **Login system** — role-based (`admin`/`team`) instead of single shared password

---

## 6. Design QA Checklist (Every Screen Must Pass)

- [ ] A Team user can complete their most common task in ≤2 clicks
- [ ] An Admin can access any Notion property without leaving the CRM
- [ ] No data is permanently hidden — everything is accessible via toggle, side-peek, or Admin view
- [ ] Destructive actions (delete, bulk change) are gated behind a confirmation dialog and only visible to Admin
- [ ] Every list view shows ≤7 columns and has a side-peek for full details
- [ ] All mobile touch targets are ≥44px
- [ ] System status is visible after every action (toast, inline badge change, or loading spinner)
- [ ] All form inputs use relational dropdowns where applicable (no free-text for linked records)

---
*Majaz CRM Design Constitution v2 — Prepared for Waseem & the Majaz Engineering Team*
