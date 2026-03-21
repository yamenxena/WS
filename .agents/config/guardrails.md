---
type: config
version: 1.0.0
last_updated: 2026-03-21
---

# Guardrails

## §1 Path Boundary

Agent may access:
- `D:\YO\WS\` — workspace (primary)
- `D:\YO\.venv` — Python environment (read + execute)
- `D:\YO\.env` — environment variables (read-only)

Agent MUST NOT access any path outside these three.

## §2 Circuit Thresholds

See `circuit-breakers.md` for detailed thresholds and recovery paths.

## §3 Tool Limit

Maximum 6 tools per agent role per session. If a task requires more, decompose into sub-tasks.

## §4 Review Flags

Any change to files in `.agents/config/` must be flagged with `⚠️ REQUIRES REVIEW` and presented to the user before committing.

## §5 Write Discipline

| Directory | Permission | Who |
|-----------|-----------|-----|
| `context/` | Read-only | Agent reads, human writes |
| `comms/` | Read-only | Agent reads, human writes |
| `operations/` | Read-write | Agent writes, human reads via Obsidian |
| `output/` | Write-only | Agent writes |
| `.agents/config/` | Human-only | Only user modifies governance |
| `.agents/artifacts/` | Read-write | Agent updates ledger + ontology |
| `.agents/workflows/` | Read-only | Agent reads, human writes |
| `scripts/` | Read-only | Agent reads, human writes. Scripts are portable. |

## §6 Cognitive Load

- Maximum file size for agent to read in one pass: 200KB
- Files larger than 200KB must be split or summarized

## §7 Environment Variables

All secrets and API keys live in `D:\YO\.env` (gitignored). Never store secrets in workspace files. `.env.example` is committed as a template.

## §8 Atomic Writes

All file writes use the `.tmp → rename` pattern. Never leave partial files. If a write fails, the original file must remain intact.

[AUTH: Majaz_OS | guardrails | 1.0.0 | 2026-03-21]
