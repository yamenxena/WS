---
type: workflow
version: 1.0.0
name: Concept Brief
trigger: new project brief request
---

# Concept Brief Workflow

## Steps

1. **READ** `context/GOALS.md` — verify project aligns with quarterly priorities
2. **READ** `context/sops/concept_design.md` — follow SOP sequence
3. **READ** `context/strategy.md` — align brief with firm differentiation
4. **WRITE** brief to `output/proposals/YYYY-MM-DD_Brief_[ProjectName].md`
   - Structure: Client → Site → Brief → Concept Direction → References → Next Steps
   - Include `[SOURCE: context/sops/concept_design.md]` for process steps
   - Include `[SOURCE: context/strategy.md]` for design philosophy
   - Include `[AUTH:]` footer
5. **UPDATE** `operations/tasks.md` — mark brief as complete
6. **LOG** append to `operations/logs/YYYY-MM-DD.md`

## AP Guards
- AP01: design philosophy from strategy.md, never invented
- AP06: stay within concept scope, don't extend to construction details
- AP68: cite `[SOURCE:]` for every claim

[AUTH: Majaz_OS | workflow:concept_brief | 1.0.0 | 2026-03-21]
