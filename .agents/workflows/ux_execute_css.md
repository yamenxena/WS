---
description: How to safely refactor responsive CSS architectures via multi_replace_file_content
persona: agents/daedalus.yaml
---

# UX Execution Workflow (multi_replace_file_content implementation)

This workflow defines the operational protocol for the UX Designer Agent ("Daedalus") to surgically inject, transition, and update an existing CSS and HTML architecture into the 2026 UX/UI Heuristics. 

The primary rule is: **Do NOT replace the entire file.** Large DOM replacements risk breaking Javascript bindings, event listeners, or existing database proxy handlers.

## Execution Steps

1. **Map the Target Classes:**
   Read the `ux_audit_scorecard.md`, identifying the offending CSS token values (e.g. `margin-top: 20px`, pure `#121212` backgrounds).

2. **Query the System Map:**
   Execute a `grep_search` across `web/crm/` seeking the component's HTML class and any associated CSS variable references. Validate where the element physically exists.

3. **Deploy the Surgeon Engine:**
   Use the `multi_replace_file_content` tool exclusively, adhering strictly to:
   *   **StartLine/EndLine Arrays:** Identify exactly the specific CSS rule block or the single HTML surrounding `<div>` container to replace.
   *   **TargetContent:** Must identically match the exact whitespace and structure of the old element definition.
   *   **ReplacementContent:** Must inject the verified 2026 heuristics (e.g., swapping `margin/width/padding` with a `display: flex; gap: 12px;`).

4. **Verify The Injection:**
   Never assume success. Wait for the `multi_replace_file_content` response. 
   Optionally open a `browser_subagent` instance targeting the exact page component and verify that the layout/styles did not break `api.js` request mechanisms or event handlers linked to the `id` tags you touched.
