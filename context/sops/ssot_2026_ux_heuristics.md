# SSoT: 2026 UX/UI Heuristics

This document is the absolute visual rulebook for the UX/UI Designer Agent (Project Daedalus). It defines the aesthetic laws, constraints, and tokens that govern the web interfaces generated and maintained within this workspace.

## 1. Interaction Design & Layout
*   **Bento Grids are Mandatory:** Avoid single, massive, monolithic content areas (unless scrolling long-form text). Break information into discrete, rounded cards (Bento boxes) governed by CSS Grid.
*   **Grid Gap > Margin:** Always use `gap` in Flexbox and Grid layouts. Hardcoded `margin` on individual elements is deprecated.
*   **Information Hierarchy:** Prioritize F-pattern and Z-pattern visual scanning. Place distinct KPI metrics at the top Left or top span.
*   **Touch Targets:** All interactive elements (buttons, toggles, links) MUST have a minimum dimension of `44x44px` on mobile screens.

## 2. Visual Aesthetic ("Liquid Glass" & Spatial UI)
*   **Glassmorphism (v2):** Dashboard panels should utilize `backdrop-filter: blur(12px)` with heavily desaturated, translucent backgrounds (e.g., `rgba(20, 20, 30, 0.4)` on dark mode).
*   **Sub-Pixel Borders:** Every glass element must have a 1px intrinsic border to define its edge: `border: 1px solid rgba(255, 255, 255, 0.05);` or similar, contrasting slightly with the background.
*   **Ambient Glow:** Active or hovered elements should cast a subtle, colored `box-shadow` rather than a flat background change.
*   **Rounding:** Border radii should be proportional. `var(--radius-lg)` (e.g., 24px) for outer containers, `var(--radius-md)` (e.g., 12px) for inner elements.

## 3. Typography (Fluid & Semantic)
*   **No Fixed Pixel Fonts for Headings:** Use `clamp()` for responsive text scaling without media queries. Example: `font-size: clamp(1.5rem, 4vw, 3rem);`
*   **Readability Constraints:** Line length (`max-width`) should never exceed `65ch` for reading blocks.
*   **Hierarchy:** `h1` through `h6` must have distinct visual weights. Do not rely entirely on size; use font-weight and color opacity (`var(--text-primary)`, `var(--text-secondary)`).

## 4. Motion & Micro-Interactions
*   **Spring Easing:** Interactive element transitions (button presses, card hovers, toggle switches) MUST use spring-based cubic beziers: `cubic-bezier(0.34, 1.56, 0.64, 1)` rather than simple `ease` or `linear`.
*   **Layout Transitions:** When elements appear/disappear (e.g., side-peek open, toast slide-in), use `transform: translateX()` or `translateY()` combined with `opacity` for GPU-accelerated animation. Never animate `width`, `height`, or `top`/`left` directly.
*   **Stagger Animation:** Lists of items (Kanban cards, table rows loading) should stagger their entrance: each child at `animation-delay: calc(var(--i) * 40ms)`.
*   **Reduced Motion:** Always wrap non-essential animations in `@media (prefers-reduced-motion: no-preference)` to respect accessibility preferences.
*   **Duration Budget:** No single UI transition should exceed `350ms`. Ideal range: `150ms–250ms`.

## 5. Color Theory (OKLCH & Perceptual Uniformity)
*   **OKLCH for New Palettes:** When generating new color schemes, use the `oklch()` color space instead of `hsl()` or `rgb()`. OKLCH provides perceptually uniform lightness, meaning colors at the same L value *actually look equally bright* to human eyes.
*   **Example:** `oklch(0.75 0.15 250)` = a vibrant, perceptually balanced blue. Compare and adjust the `C` (chroma) and `H` (hue) channels while keeping `L` (lightness) constant for consistent badge palettes.
*   **Fallback Strategy:** Always provide an `hsl()` or `rgb()` fallback for older browser compatibility: `color: hsl(210, 80%, 55%); color: oklch(0.65 0.18 250);`
*   **No Pure Black/White:** Never use `#000000` or `#FFFFFF`. Use near-blacks (e.g., `#0a0e17`) and near-whites (`#e5e7eb`) to reduce eye strain and maintain the spatial depth illusion.

## 6. Automation Directives (For the UX Agent)
1.  **Strict Extraction:** The agent must pull raw colors and exact layout metrics when running audits.
2.  **Mockups Before Code:** The agent must never push massive CSS refactors without first proposing a visual mockup.
3.  **Modular Overrides:** CSS changes must target specifically scoped `.classes`, avoiding global tag mutations (`div`, `span`) unless intentional resets.
4.  **Token Reference:** Before writing any new CSS rule, the agent MUST consult `ssot_design_system_tokens.md` for existing variables. Creating ad-hoc hex values when a token exists is a violation.

