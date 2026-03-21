---
type: workflow
version: 1.0.0
name: Site Supervision Report
trigger: field supervision notes received
---

# Supervision Report Workflow

## Steps

1. **READ** `context/sops/site_supervision.md` — follow inspection categories
2. **READ** `comms/notes_templates.md` — use structured field notes format
3. **STRUCTURE** field notes into report:
   - Date, Project, Inspector
   - Category (Structural / MEP / Finishing / Landscape / Safety)
   - Findings with severity (Critical / Major / Minor / Observation)
   - **Photo Ref** — GPS-timestamped photo reference (2026 standard)
   - Actions required + deadlines
4. **WRITE** report to `operations/supervision/YYYY-MM-DD_[ProjectName].md`
   - Include `[SOURCE: context/sops/site_supervision.md]` for inspection criteria
   - Include `[AUTH:]` footer
5. **UPDATE** `operations/projects.md` — update project completion %
6. **LOG** append to `operations/logs/YYYY-MM-DD.md`

## AP Guards
- AP02: never fabricate inspection results
- AP16: never hallucinate deadlines — use dates from field notes only
- AP68: cite `[SOURCE:]` for inspection criteria

[AUTH: Majaz_OS | workflow:supervision | 1.0.0 | 2026-03-21]
