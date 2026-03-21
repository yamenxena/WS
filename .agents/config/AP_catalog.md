---
type: config
version: 1.0.0
last_updated: 2026-03-21
---

# Anti-Pattern Catalog

## Active APs (16)

| ID | Name | Description | Phase |
|----|------|-------------|:-----:|
| AP01 | Hallucination | Agent invents facts not sourced from context files | 1, 4 |
| AP02 | Fabricated Execution | Agent claims to have run a script it didn't run | 4, 5 |
| AP04 | Session Drift | Agent loses track of current phase/context after many messages | 0 |
| AP05 | Constitution Amnesia | Agent forgets governance rules mid-session | 0 |
| AP06 | Overreach | Agent modifies files outside its write permissions | 0 |
| AP13 | Client Confusion | Agent bleeds client names or data across separate tasks | 1, 4 |
| AP14 | Status Drift | Obsidian dashboard shows stale data | 3 |
| AP16 | Schedule Hallucination | Agent invents deadlines not in project data | 4 |
| AP27 | Non-Atomic Write | Agent writes partial files that corrupt state | 5 |
| AP32 | UU Blindness | Agent ignores Unknown Unknowns listed in UU registry | 0 |
| AP35 | Unvalidated Output | Agent produces output that bypasses PLAN/PROCEED gate | 4 |
| AP46 | Undocumented Deps | Script uses a package not in requirements.txt | 5 |
| AP55 | Schema Drift | CSV schema changes without updating sync scripts + Dataview queries | 2 |
| AP59 | Silent Mode Switch | Agent switches between Gemini/Claude without structured handoff | 0 |
| AP67 | Municipality Code Staleness | Agent uses outdated municipality codes (>6 months old) | 3, 4 |
| AP68 | Evidence Omission | Agent output lacks `[SOURCE:]` citations (v4) | All |

## Reference APs (15 — inactive, for future activation)

AP03, AP07-AP12, AP15, AP17-AP20, AP25, AP28, AP30

These are documented for completeness. Activate by moving to the Active table and assigning a Phase.

[AUTH: Majaz_OS | AP_catalog | 1.0.0 | 2026-03-21]
