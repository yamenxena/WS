# Deep Research: Agentic OS Architectures for the Majaz Workspace

**[AUTH: Krites EXTERNAL | KB-Deep-Research | Date: 2026-03-21]**

> **Purpose:** Extract governance, pipeline, function, and memory patterns from 2026 open-source AI OS projects. Identify what Majaz can adopt.

---

## 1. Source Inventory

| # | Source | Type | Key Contribution |
|---|--------|------|-----------------|
| 1 | **Daniel Canosa / Systemify** | YouTube + Skool | Dual-layer architecture (AI Layer + Human Layer), `CLAUDE.md` as persistent memory, background vs prompted tasks |
| 2 | **itseffi/agentic-os** | GitHub | 5-layer memory stack, verification-first completion, compaction-aware workflows, progressive skill disclosure |
| 3 | **MindStone** (Arnaldo de Lisio) | GitHub + Reddit | Personal AI OS for Claude via MCP, persona system, local markdown + Supabase sync for semantic search |
| 4 | **OpenClaw + Edict** | GitHub + Wikipedia | Hub-and-spoke agent gateway, SKILL.md governance, 9-agent pipeline with quality gate veto, multi-coordination modes |
| 5 | **AIOS** (agiresearch) | GitHub + arXiv | LLM kernel architecture, agent scheduler (FIFO/Round-Robin), 2-tier memory (RAM + persistent), context manager |
| 6 | **NIST AI Agent Standards** | nist.gov | Feb 2026: industry-led standards for agentic AI, security, identity, interoperability |
| 7 | **Singapore Model AI Governance** | Gov framework | Jan 2026: pre-deployment testing, tool whitelisting, auditable trace, human intervention |
| 8 | **AGENTS.md open standard** | agents.md | "README for agents" — nested configs, skill refs, self-verification, version-controlled |

---

## 2. Architecture Patterns

### 2A — Canosa / Systemify: 3-Layer Business OS

```
┌──────────────────────────────────────────┐
│         AUTOMATION LAYER                │
│  Windows Task Scheduler / n8n / cron    │
│  Background tasks (sync, log, remind)   │
├──────────────────────────────────────────┤
│         OPERATOR LAYER                  │
│  Agent (Claude Code / Gemini)           │
│  Reads AI Layer → Executes → Writes     │
│  Human Layer                            │
├──────────────────────────────────────────┤
│  AI LAYER          │  HUMAN LAYER       │
│  Local .md files   │  Notion / Sheets   │
│  strategy.md       │  CRM pipeline      │
│  icp.md            │  Task board        │
│  sops/             │  Project tracker   │
│  comms/            │  Content pipeline  │
│  (zero latency)    │  (visual, shared)  │
└──────────────────────────────────────────┘
```

**Majaz alignment:** Our `context/` = AI Layer. Our `operations/` + `sheets/` = Human Layer. Our `scripts/` + Task Scheduler = Automation Layer. **Full match.**

---

### 2B — itseffi/agentic-os: 5-Layer Memory Stack

This is the most structured open-source personal OS found. It defines memory as **5 layers** that the agent reads in order:

| Layer | File(s) | Purpose | Majaz Equivalent |
|-------|---------|---------|-----------------|
| **Instructions** | `AGENTS.md` | How the AI behaves — rules, boundaries, style | `.agents/GEMINI.md` (Constitution) |
| **Priority** | `GOALS.md` | What matters — OKRs, quarterly goals | `context/strategy.md` |
| **State** | `Tasks/**/*.md` | Current work — active tasks, status | `operations/tasks.md` + `operations/projects.md` |
| **Context** | `Knowledge/**/*.md` | Reference — notes, docs, domain knowledge | `context/sops/` + `operations/knowledge/` |
| **Capability** | `.agents/skills/*/SKILL.md` | How the agent executes specialized workflows | `.agents/workflows/*.md` + `scripts/*.md` |

**4 Long-Running Agent Principles:**
1. **Versioned skills** — procedures live in `SKILL.md` with YAML frontmatter
2. **Shell execution** — run real tasks, produce real artifacts
3. **Compaction-aware workflows** — structure long runs to preserve continuity (avoid context window collapse)
4. **Verification-first completion** — require fresh evidence before claiming work is done

**Progressive skill disclosure** — agents begin with metadata only (name, description). Full `SKILL.md` is loaded only when a skill is selected. This saves tokens.

**Privacy-first:** Tasks/, Knowledge/, Resources/, BACKLOG.md are all `.gitignored`. Only governance files (AGENTS.md, GOALS.md) are version-controlled.

> **Gap for Majaz:** We don't have `GOALS.md` as a separate file. Our strategy.md covers this, but extracting a lean `GOALS.md` (OKRs, quarterly priorities) could sharpen agent focus. We also don't use progressive skill disclosure — our workflows load fully each time.

---

### 2C — MindStone: Persona System + Semantic Search

MindStone turns Claude into a personal OS using MCP. Key innovations:

| Feature | How It Works | Majaz Relevance |
|---------|-------------|-----------------|
| **Persona system** | Define persona files pointing to specific context folders. Claude acts as a specialized agent per persona with full memory. | We could define personas: `Lead Qualifier`, `Supervisor`, `Municipality Consultant` — each loads a different subset of `context/` + `comms/` |
| **Skills vs MCP for token efficiency** | Skills load on-demand, reducing context overhead. MCP loads everything. For personal scale, skills are cheaper. | Our workflows are lightweight .md files — already skill-like. No change needed. |
| **Semantic search via Supabase** | Local markdown synced to Supabase for vector search. Allows "find by meaning" not just filename. | Future consideration for Phase 6. Not needed at Majaz scale now. |
| **Context layering** | Capture anything you might need to explain again in a context file for future reference. | Our `operations/knowledge/` serves this purpose. |

> **Gap for Majaz:** No persona system. Could be a Phase 6 enhancement — define persona files that pre-load a subset of context for specific task types.

---

### 2D — OpenClaw + Edict: Multi-Agent Quality Gates

OpenClaw is the largest open-source agent framework (196K+ GitHub stars, 600+ contributors). Edict builds on it with a **checks-and-balances pipeline**:

| Component | Function | Majaz Equivalent |
|-----------|----------|-----------------|
| **Gateway** | Hub-and-spoke control plane. Routes sessions, dispatches tools, manages events. | Our `WORKSPACE_LEDGER.md` serves as a phase-routing SSoT |
| **SKILL.md** | Each skill directory has a `SKILL.md` with metadata and instructions | Our `.agents/workflows/*.md` — same pattern |
| **Quality Gate** | An evaluator agent (or human) can **veto outputs** and force rework before pipeline advances | Our PLAN/PROCEED gate in `dialogue-protocol.md §2` — same pattern |
| **Audit Trail** | Full trace of every agent action for compliance | Our `CHANGELOG.md` + `operations/logs/` |
| **Security defaults** | Allowlist-based network access. Tool output treated as untrusted. Explicit review for generated artifacts. | Our `guardrails.md` §1-§8 — same pattern |

**Edict's 9 specialized agents** — each has a defined role (planner, researcher, implementer, reviewer, etc.) coordinated through sequential, hierarchical, or parallel modes.

> **Gap for Majaz:** We don't have formal multi-agent coordination. At Majaz scale (1 principal, 1 agent), this is unnecessary. But the **veto gate pattern** is critical and already implemented in our PLAN/PROCEED protocol.

---

### 2E — AIOS: LLM Kernel Architecture

AIOS (agiresearch/AIOS) is an academic project that embeds LLMs into the OS kernel. Its architecture provides conceptual clarity:

| Kernel Module | Function | Majaz Equivalent |
|---------------|----------|-----------------|
| **Agent Scheduler** | Centralized queue for all agent requests. FIFO or Round-Robin with time slices. | Our `circuit-breakers.md` — session ≥20 msg = checkpoint |
| **Context Manager** | Manages context window like RAM — what gets loaded, evicted, summarized | Our `guardrails.md §6` — 200KB file size gate + cognitive load limit |
| **Memory Manager** | RAM-tier: transient session data. Cleared after session. | Our `telemetry.md` — session metrics |
| **Storage Manager** | Persistent tier: evicted memory blocks stored long-term | Our `operations/logs/` — append-only daily logs |
| **Tool Manager** | Registry of available tools with access control | Our `guardrails.md §3` — 6-tool limit per agent role |
| **Access Manager** | Permissions: who can read/write what | Our `guardrails.md §5` — write discipline table |

> **Gap for Majaz:** We lack a formal **memory eviction strategy**. As `operations/logs/` and `tasks.md` grow, they will consume context windows. Consider a Phase 5 script: `archive_logs.py` — rolls completed tasks to `_legacy/tasks/` and summarizes old daily logs into weekly rollups.

---

## 3. 2026 Governance Standards

### NIST AI Agent Standards Initiative (Feb 2026)
- Industry-led standards for agentic AI
- Focus: **security**, **identity**, **interoperability**
- Open-source protocols for agent-to-agent communication
- **Majaz compliance:** Our `.agents/config/` stack already provides identity (constitution), security (guardrails), and interoperability (dialogue-protocol §5 handoff)

### Singapore Model AI Governance Framework (Jan 2026)
- Pre-deployment testing → our Phase 4 simulated tasks
- Tool whitelisting → our guardrails §3 (6-tool limit)
- Auditable trace trails → our CHANGELOG + logs
- Human intervention mechanisms → our PLAN/PROCEED gate + circuit breakers

### CLAUDE.md / AGENTS.md Best Practices (2026 consensus)
| Practice | Description | Majaz Status |
|----------|-------------|:---:|
| Simple, clear instructions | "Use single quotes" > "follow style guide" | ✅ Our configs are specific |
| Nested configuration | Sub-directory overrides for monorepos | ❌ Not needed at Majaz scale |
| Self-verification | Agent validates own output against tests/expected results | ✅ Phase 4 simulated tasks |
| Version-controlled | AGENTS.md in Git, reviewed by team | ✅ CHANGELOG tracks versions |
| Living documents | Regularly prune and update | ⚠️ Need UU-M1 enforcement |
| Skill integration | AGENTS.md references skills for on-demand loading | ✅ Workflows reference SOPs |

---

## 4. Gap Analysis → Actionable Recommendations

| # | Finding | Gap in Majaz | Recommendation | Priority |
|---|---------|-------------|----------------|:--------:|
| 1 | **5-Layer Memory Stack** (itseffi) | No standalone `GOALS.md` | Extract quarterly OKRs from `strategy.md` into a lean `GOALS.md` that agent reads before every session | Medium |
| 2 | **Progressive skill disclosure** (itseffi) | Workflows load fully each time | Low priority — our workflows are small (.md files). Only consider if context window becomes an issue | Low |
| 3 | **Verification-first completion** (itseffi) | Phase 4 validates outputs but no formal "evidence gate" | Add to `policies.md`: "Agent must cite source file path for every claim in output" | High |
| 4 | **Memory eviction / compaction** (itseffi + AIOS) | No archive strategy for growing logs/tasks | Add `scripts/archive_logs.py` — weekly rollup of daily logs, archive completed tasks | Medium |
| 5 | **Persona system** (MindStone) | No persona definitions | Future Phase 6: persona files that pre-load context subsets per task type | Low |
| 6 | **Quality Gate veto** (Edict/OpenClaw) | PLAN/PROCEED is human-gated but no formal "agent evaluator" step | Already sufficient for Majaz (1 principal). Keep PLAN/PROCEED. | ✅ Done |
| 7 | **Privacy-first gitignore** (itseffi) | We don't separate committed vs gitignored operational data | Add `operations/` and personal data to `.gitignore` if version control is used | Medium |
| 8 | **Evals as regression gate** (itseffi) | No evals for governance files | Consider a Phase 5 script: `validate_governance.py` — checks all config files have YAML frontmatter + `[AUTH:]` footer | High |

---

## 5. Summary

Our Majaz AI OS architecture is **highly aligned** with the 2026 open-source consensus. The dual-layer pattern, markdown governance, PLAN/PROCEED gating, and workflow-driven execution all match the leading frameworks.

**What we already do well:**
- Constitution as `.agents/GEMINI.md` ≡ `AGENTS.md` ≡ `SOUL.md` (universal pattern)
- 5-workflow system ≡ Canonical skills (itseffi pattern)
- PLAN/PROCEED ≡ Quality gate veto (Edict pattern)
- Write discipline + circuit breakers ≡ AIOS kernel access manager + scheduler
- `operations/logs/` ≡ Audit trail (OpenClaw/Singapore compliance)

**What we can adopt (in priority order):**
1. ✅ **Verification-first**: add evidence-citing requirement to policies.md
2. ✅ **Governance validation script**: `validate_governance.py` in Phase 5
3. ⬜ **Memory archival**: `archive_logs.py` for log compaction
4. ⬜ **GOALS.md**: lean quarterly priorities file
5. ⬜ **Persona system**: future Phase 6

---

**[AUTH: Krites EXTERNAL | KB-Deep-Research | COMPLETE | 2026-03-21]**
