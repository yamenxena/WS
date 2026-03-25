---
description: CRM agent workflows for Notion-native lead and project management
type: workflow
version: 1.0.0
last_updated: 2026-03-23
---

# CRM Agent Workflows

## Notion Database References

| Database | ID | Role |
|----------|:--:|------|
| LIST OF LANDLORDS | `32b39a01-a595-802c-b37b-e4723f2e8994` | Client/CRM |
| PROJECTS | `32b39a01-a595-8031-b453-c18e335772fe` | Project tracker |
| TASKS | `32b39a01-a595-80cb-903a-d341d2ae9b49` | Task management |
| Suppliers | `32c39a01-a595-80e4-8378-dec2b3542223` | Contractor directory |

---

## WF-CRM-01: Lead Intake

**Trigger:** New lead contact received (Instagram DM, WhatsApp, referral, website)

**Steps:**
1. Create page in LIST OF LANDLORDS with: Name, Phone, Email, Nation
2. Set ICP Score (1-5) based on `context/icp.md` criteria
3. Set Lead Source (Instagram / Referral / Website / Direct / LinkedIn)
4. Set Status → New
5. Set Next Action + Due Date (response within 24h)
6. Log to `operations/logs/YYYY-MM-DD.md`

**ICP Scoring Criteria:**
- 5: Budget ≥ AED 4M, Saadiyat/Reem/Yas, new villa, ready to start
- 4: Budget AED 2-4M, AD prime area, clear brief
- 3: Budget AED 1-2M, any AD location, some clarity
- 2: Budget < AED 1M or Al Ain/remote, unclear needs
- 1: Out of scope (renovation, commercial, outside UAE)

---

## WF-CRM-02: Pipeline Stage Advancement

| From | To | Criteria |
|------|----|----------|
| New | Contacted | First response sent (WhatsApp/email/call) |
| Contacted | Qualified | ICP ≥ 3, budget confirmed, location confirmed |
| Qualified | Proposal | Design brief received, fee estimate sent |
| Proposal | Won | Consultancy agreement signed + upfront payment |
| Any | Lost | Client declined / out of scope / no response 14 days |

**On stage change:** Update Status property in LIST OF LANDLORDS.

---

## WF-CRM-03: Invoice Follow-Up Escalation

| Days Overdue | Action | Assignee |
|:------------:|--------|----------|
| 0-7 | WhatsApp reminder | Admin |
| 8-14 | Email with invoice attachment | Waseem |
| 15-30 | Phone call + payment plan offer | Waseem |
| 30+ | Formal letter + work suspension warning | Waseem |

---

## WF-CRM-04: Monthly CRM Health Report

**Trigger:** First of each month
**Output:** `output/reports/YYYY-MM_CRM_Health.md`

**Contents:**
1. Pipeline summary (count per stage)
2. Response latency audit (any > 24h?)
3. Overdue invoices summary
4. Win/loss ratio (last 30 days)
5. ICP distribution of active leads
6. Revenue forecast (sum of Values in Pipeline + Qualified stages)

---

## WF-CRM-05: Project Onboarding (Won → PROJECTS)

**Trigger:** Lead status → Won

**Steps:**
1. Create PROJECTS page with: Project Name (`{SN}-{Client}`), Stage → SD
2. Link to LIST OF LANDLORDS via relation
3. Create initial TASKS: Consultancy Agreement, Planning, Concept Layout
4. Link Work Pipeline stages (SD → DD → CD → AS)
5. Set Service Type (DESIGN / SUPERVISION)
6. Request title deed + plot info from client

[AUTH: Majaz_OS | crm_agent_workflows | 1.0.0 | 2026-03-23]
