---
type: workflow
version: 1.0.0
name: Municipality Submission Checklist
trigger: project ready for municipality submission
---

# Municipality Checklist Workflow

## Steps

1. **READ** `context/sops/municipality_approval.md` — submission process + required docs
2. **READ** `operations/knowledge/municipality_codes.md` — Abu Dhabi codes
   - **CHECK** `last_verified` frontmatter → if >6 months old, flag as stale (AP67)
3. **PRE-COMPLIANCE SCAN** — check project documents against codes BEFORE submission
   - List all required documents
   - Flag any missing documents
   - Flag any non-compliance items with code reference
4. **WRITE** checklist to `output/reports/YYYY-MM-DD_Municipality_[ProjectName].md`
   - Structure: Project → Required Docs → Compliance Check → Flags → Next Steps
   - Include `[SOURCE: context/sops/municipality_approval.md]` for process
   - Include `[SOURCE: operations/knowledge/municipality_codes.md]` for codes
   - Include `[AUTH:]` footer
5. **UPDATE** `operations/tasks.md`
6. **LOG** append to `operations/logs/YYYY-MM-DD.md`

## AP Guards
- AP01: codes from municipality_codes.md only, never invented
- AP67: stale codes (>6 months) must be flagged
- AP68: cite `[SOURCE:]` for every code reference

[AUTH: Majaz_OS | workflow:municipality | 1.0.0 | 2026-03-21]
