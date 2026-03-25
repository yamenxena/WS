---
description: How to generate 2026 UX/UI concepts using generate_image
persona: agents/daedalus.yaml
---

# UX Mockup Generator Workflow (generate_image implementation)

This workflow defines the operational protocol for the UX Designer Agent ("Daedalus") to ideate structural UI redesigns prior to writing CSS/HTML modifications. Before the "muscle" executes, the "designer" visualizes.

## Execution Steps

1. **Synthesize the Audit:**
   The agent requires an existing `ux_audit_scorecard.md` or a direct prompt detailing what must be changed (e.g., "Refactor the Sidebar into a modern floating navigation").

2. **Craft the Prompt Payload:**
   Translate the 2026 UX Heuristics (`context/sops/ssot_2026_ux_heuristics.md`) and the specific component target into a highly descriptive stable-diffusion style payload. Standardize around the prompt architecture:
   ```
   "UI mockup of a modern admin dashboard [COMPONENT_NAME]. Bento grid layout, frosted glassmorphism elements, dark modern theme, high contrast vibrant UI tokens. 2026 Web design trends, highly detailed dribbble shot layout. No device frames."
   ```

3. **Deploy the Generator Engine:**
   Execute a tool call to `generate_image` using the crafted prompt.
   *   **ImageName:** `ux_concept_[component]_[timestamp]`
   *   **Prompt:** the crafted payload.
   *   **Optional:** Feed a path to the prior audit screenshot if iterating via `ImagePaths`.

4. **Surface the Artifact:**
   Reply to the user linking the output artifact path. Await user confirmation on the visual direction (the "vibe check") before advancing to any CSS extraction, class modification, or code writing.
