---
type: artifact
version: 1.0.0
last_updated: 2026-03-21
---

# Workspace Ontology

## Dependency Graph

Every file in the workspace and its connections. No orphans.

### .agents/ (Instructions Layer)
| File | Reads From | Written By | Referenced In |
|------|-----------|------------|---------------|
| `.agents/GEMINI.md` | All config files | Phase 0 | Root GEMINI.md, README |
| `.agents/CHANGELOG.md` | — | Every governance change | Constitution §4 |
| `.agents/config/guardrails.md` | — | Phase 0 | Constitution §3, §5 |
| `.agents/config/policies.md` | dialogue §5 (fwd ref) | Phase 0 | Constitution §2 |
| `.agents/config/dialogue-protocol.md` | — | Phase 0 | policies §3 |
| `.agents/config/circuit-breakers.md` | — | Phase 0 | guardrails §2 |
| `.agents/config/telemetry.md` | — | Phase 0 | Constitution §4 |
| `.agents/config/AP_catalog.md` | — | Phase 0 | All phases |
| `.agents/artifacts/WORKSPACE_LEDGER.md` | telemetry | Every session end | Constitution §4 |
| `.agents/artifacts/WORKSPACE_ONTOLOGY.md` | All files | Phase 0 + updates | Constitution §4 |
| `.agents/workflows/new_lead.md` | icp, comms | Phase 0E | crm.md |
| `.agents/workflows/concept_brief.md` | sops/concept_design | Phase 0E | proposals |
| `.agents/workflows/supervision.md` | sops/site_supervision | Phase 0E | supervision/ |
| `.agents/workflows/municipality.md` | sops/municipality | Phase 0E | reports |
| `.agents/workflows/content_post.md` | strategy, comms | Phase 0E | content_pipeline |

### context/ (Context Layer — Phase 1)
| File | Reads From | Written By | Referenced In |
|------|-----------|------------|---------------|
| `context/GOALS.md` | — | Human | All workflows, root GEMINI |
| `context/strategy.md` | — | Human | All workflows |
| `context/company_context.md` | — | Human | README, proposals |
| `context/icp.md` | — | Human | new_lead.md |
| `context/sops/concept_design.md` | — | Human | concept_brief.md |
| `context/sops/municipality_approval.md` | — | Human | municipality.md |
| `context/sops/site_supervision.md` | — | Human | supervision.md |
| `context/sops/client_handover.md` | — | Human | proposals, reports |

### operations/ (State Layer — Phase 3)
| File | Reads From | Written By | Referenced In |
|------|-----------|------------|---------------|
| `operations/crm.md` | new_lead.md | Agent | sync_crm.py, Dataview |
| `operations/tasks.md` | All workflows | Agent | README dashboard |
| `operations/projects.md` | — | Agent | project_tracker.csv |
| `operations/content_pipeline.md` | content_post.md | Agent | Dataview |
| `operations/knowledge/municipality_codes.md` | — | Human | municipality.md |

### Other
| File | Purpose | Referenced In |
|------|---------|---------------|
| `deep_research.md` | 2026 OS research | ONTOLOGY |
| `sheets/*.csv` | Google Sheets templates | sync_crm.py |
| `scripts/*.py` | Automation scripts | requirements.txt |

[AUTH: Majaz_OS | workspace_ontology | 1.0.0 | 2026-03-21]
