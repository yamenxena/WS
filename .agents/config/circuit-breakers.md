---
type: config
version: 1.0.0
last_updated: 2026-03-21
---

# Circuit Breakers

## Breaker 1: Session Length
- **Trigger:** session ≥ 20 messages
- **Action:** checkpoint → summarize state → push to WORKSPACE_LEDGER → HALT

## Breaker 2: Error Cascade
- **Trigger:** ≥ 3 consecutive failures (file write, API call, validation)
- **Action:** pause execution → report errors → wait for user

## Breaker 3: Model Conflict
- **Trigger:** Gemini and Claude produce contradictory outputs on the same task
- **Action:** present both → human decides → log resolution

## Breaker 4: Step Overflow
- **Trigger:** single task exceeds 50 steps
- **Action:** kill task → decompose → restart as sub-tasks

## Breaker 5: IDE/Quota Limit
- **Trigger:** Antigravity rate limit or quota warning
- **Action:** HALT → save state → resume when quota resets

## Checkpoint Protocol

When any breaker triggers:
1. Write current state to `WORKSPACE_LEDGER.md`
2. List: files modified, phase, pending actions
3. Push telemetry metrics
4. HALT with structured summary

## Recovery Path

On session restart after a breaker:
1. Read `WORKSPACE_LEDGER.md` (last checkpoint)
2. Read `CHANGELOG.md` (last governance version)
3. Verify files listed in checkpoint exist
4. Resume from last completed step

[AUTH: Majaz_OS | circuit-breakers | 1.0.0 | 2026-03-21]
