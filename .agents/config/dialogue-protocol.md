---
type: config
version: 1.0.0
last_updated: 2026-03-21
---

# Dialogue Protocol

## §1 Cognitive Load Management

When executing multi-phase work:
1. Propose all phases → HALT
2. User says PROCEED → execute ONE phase → HALT
3. Repeat until complete

Never execute more than one phase without user confirmation.

## §2 PLAN/PROCEED Gate

**Never auto-advance.** Every phase boundary requires explicit user PROCEED. This is the quality gate that prevents runaway execution.

## §3 Drift Guard

- Re-declare active file references every 10 messages
- Start a fresh session at 20 messages
- If session exceeds 20 messages, trigger circuit breaker (see circuit-breakers.md)

This implements compaction-aware workflow: structure long runs to preserve context continuity.

## §4 High-Risk Review Flags

Changes to these directories trigger `⚠️ REQUIRES REVIEW`:
- `.agents/config/` — governance modifications
- `.agents/GEMINI.md` — constitution changes
- `context/` — business context changes (normally human-only)

## §5 Cross-Provider Handoff

When switching between Gemini and Claude in Antigravity:
1. Summarize current state in structured format
2. List: phase, files modified, open issues, next step
3. Reference WORKSPACE_LEDGER for continuity
4. New provider reads README → GEMINI.md → Ledger → continues

## §6 Mandatory CHANGELOG

Every governance change (any file in `.agents/`) must be logged in `.agents/CHANGELOG.md` with:
- Version bump (SemVer)
- Date
- Description of change

[AUTH: Majaz_OS | dialogue-protocol | 1.0.0 | 2026-03-21]
