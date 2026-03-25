---
description: How to perform a visual UX audit using browser_subagent
persona: agents/daedalus.yaml
---

# UX Audit Workflow (browser_subagent implementation)

This workflow defines the operational protocol for the UX Designer Agent ("Daedalus") to execute an aesthetic and structural audit of a given webpage. It forces the agent to use its "eyes" (the subagent) before making assumptions.

## Execution Steps

1. **Load the SSoT:**
   Read `context/sops/ssot_2026_ux_heuristics.md` using the `view_file` tool to initialize your visual rulebook.

2. **Deploy the Vision Engine:**
   Use the `browser_subagent` tool with the following specific configuration:
   - **TaskName:** "UX/UI Visual Audit [Target Component/Page]"
   - **TaskSummary:** "Capture screenshots and extract layout DOM data for heuristic analysis."
   - **Task:** "1. Navigate to the requested URL. 2. Verify all elements have loaded. 3. Take a full-page scroll screenshot using `capture_browser_screenshot`. 4. Query the DOM for any layout-breaking elements via `browser_get_dom`. 5. Record any console errors visually impacting the page. 6. Report findings back."

3. **Analyze Findings:**
   Compare the subagent's screenshot explicitly against the Bento Grid, Glassmorphism, and Touch Target rules in the heuristics document. Look for:
   - Unbalanced padding/margins.
   - Low-contrast text points without fluid typography.
   - Overly chaotic visual hierarchies.

4. **Generate Scorecard:**
   Write the audit results to `output/ux_audit_scorecard.md`, listing the raw CSS/HTML violations and the suggested modern token variables (e.g., `clamp()`, `oklch`).
