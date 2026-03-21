---
type: workflow
version: 1.0.0
name: New Lead Qualification
trigger: incoming lead (WhatsApp, email, referral)
---

# New Lead Workflow

## Steps

1. **READ** `context/GOALS.md` — check if lead aligns with current quarter priorities
2. **READ** `context/icp.md` — score lead against ICP criteria
3. **READ** `comms/whatsapp_samples.md` or `comms/email_samples.md` — match tone
4. **SCORE** — assign ICP Score (1-5):
   - 5: Perfect match (HNW, villa, Abu Dhabi, bespoke)
   - 4: Strong match (3/4 criteria)
   - 3: Moderate match (2/4)
   - 2: Weak match (1/4)
   - 1: No match
5. **WRITE** update `operations/crm.md` — add lead with score + status
6. **WRITE** reply to `output/communications/YYYY-MM-DD_Lead_Reply_[Name].md`
   - Include `[SOURCE: context/icp.md]` for scoring rationale
   - Include `[AUTH:]` footer
7. **LOG** append to `operations/logs/YYYY-MM-DD.md`

## AP Guards
- AP01: never invent client data
- AP13: never bleed names across leads
- AP35: all output goes through PLAN/PROCEED
- AP68: cite `[SOURCE:]` for every claim

[AUTH: Majaz_OS | workflow:new_lead | 1.0.0 | 2026-03-21]
