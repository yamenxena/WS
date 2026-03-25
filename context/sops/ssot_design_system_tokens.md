# SSoT: Design System Tokens — Majaz CRM v5.0.0

This document is the centralized registry of all CSS custom properties (tokens) currently active in the Majaz CRM design system. The UX Agent (Daedalus) must reference this file before proposing any color, spacing, or typography changes to ensure consistency.

> **Rule:** No hardcoded hex/rgb values in component CSS or JS templates. Always reference a `var(--token)`.

**Living Artifact:** `web/crm/css/design-system.css`
**Governing Agent:** Daedalus (`.agents/agents/daedalus.yaml`)

---

## 1. Color Palette — Dark Theme (`:root`)

### Backgrounds
| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0D0D1A` | App-level background |
| `--bg-surface` | `#1A1A2E` | Card/panel backgrounds |
| `--bg-surface-2` | `#16213E` | Secondary surface |
| `--bg-surface-3` | `#0F3460` | Tertiary/accent surface |
| `--bg-hover` | `#252545` | Hover state background |
| `--bg-overlay` | `rgba(13, 13, 26, 0.85)` | Modal/overlay backdrop |

### Brand (Gold)
| Token | Hex Fallback | OKLCH Override | Usage |
|---|---|---|---|
| `--gold` | `#D4A853` | `oklch(0.76 0.12 75)` | Primary accent |
| `--gold-light` | `#E8C97A` | `oklch(0.84 0.10 80)` | Light accent |
| `--gold-dark` | `#B8892E` | `oklch(0.62 0.13 70)` | Dark accent |
| `--gold-glow` | `rgba(212, 168, 83, 0.15)` | — | Hover backgrounds |
| `--gold-border` | `rgba(212, 168, 83, 0.25)` | — | Subtle highlights |

### Text
| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#F0F0F0` | Main readable text |
| `--text-secondary` | `#8A8A9A` | Labels, metadata |
| `--text-muted` | `#5A5A6A` | Disabled, tertiary |

### Status (OKLCH L=0.68 for equal visual weight)
| Token | Hex Fallback | OKLCH Override | Usage |
|---|---|---|---|
| `--success` | `#4CAF50` | `oklch(0.68 0.17 145)` | Success actions |
| `--warning` | `#FF9800` | `oklch(0.68 0.17 60)` | Warning states |
| `--danger` | `#E53935` | `oklch(0.68 0.22 25)` | Error/danger |
| `--info` | `#29B6F6` | `oklch(0.68 0.14 230)` | Informational |

### Pipeline Stages (OKLCH L=0.58)
| Token | Hex | OKLCH | Mapping |
|---|---|---|---|
| `--stage-sd` | `#7C4DFF` | `oklch(0.58 0.22 280)` | Schematic Design |
| `--stage-dd` | `#29B6F6` | `oklch(0.58 0.14 230)` | Design Development |
| `--stage-cd` | `#FF9800` | `oklch(0.58 0.17 60)` | Construction Documents |
| `--stage-as` | `#D4A853` | `oklch(0.58 0.12 75)` | As-Built / Supervision |
| `--stage-done` | `#4CAF50` | `oklch(0.58 0.15 145)` | Completed |
| `--stage-progress` | `#E53935` | `oklch(0.58 0.22 25)` | In Progress |
| `--stage-hold` | `#78909C` | `oklch(0.58 0.03 240)` | On Hold |
| `--stage-kickoff` | `#26A69A` | `oklch(0.58 0.12 170)` | Kickoff |
| `--stage-bidding` | `#AB47BC` | `oklch(0.58 0.18 310)` | Bidding |
| `--stage-handover` | `#5C6BC0` | `oklch(0.58 0.14 260)` | Handing Over |
| `--stage-notstart` | `#607D8B` | `oklch(0.58 0.03 230)` | Not Started |

### Lead Statuses (OKLCH L=0.65)
| Token | Hex | OKLCH | Mapping |
|---|---|---|---|
| `--lead-inquiry` | `#29B6F6` | `oklch(0.65 0.14 230)` | Inquiry |
| `--lead-qualified` | `#AB47BC` | `oklch(0.65 0.18 310)` | Qualified |
| `--lead-proposal` | `#FF9800` | `oklch(0.65 0.17 60)` | Proposal |
| `--lead-negotiation` | `#D4A853` | `oklch(0.65 0.12 75)` | Negotiation |
| `--lead-won` | `#4CAF50` | `oklch(0.65 0.15 145)` | Won |
| `--lead-lost` | `#E53935` | `oklch(0.65 0.22 25)` | Lost |

---

## 2. Color Palette — Light Theme (`[data-theme="light"]`)

| Token | Light Value | Notes |
|---|---|---|
| `--bg-primary` | `#FFFFFF` | White background |
| `--bg-surface` | `#F6F8FA` | GitHub-style surface |
| `--bg-surface-2` | `#EFF1F3` | Secondary surface |
| `--bg-surface-3` | `#DDE1E6` | Tertiary surface |
| `--bg-hover` | `#E8ECF0` | Hover state |
| `--bg-overlay` | `rgba(255, 255, 255, 0.85)` | Modal overlay |
| `--gold` | `#9A6C1E` / `oklch(0.55 0.12 70)` | Darker gold for contrast |
| `--gold-light` | `#B8892E` / `oklch(0.62 0.10 75)` | Light accent |
| `--gold-dark` | `#7A5418` / `oklch(0.48 0.13 65)` | Dark accent |
| `--text-primary` | `#1F2328` | Dark text on light bg |
| `--text-secondary` | `#636C76` | Muted labels |
| `--text-muted` | `#8B949E` | Disabled text |
| `--glass-bg` | `rgba(255, 255, 255, 0.72)` | Light glassmorphism |
| `--glass-border` | `rgba(0, 0, 0, 0.08)` | Dark border on light |

---

## 3. Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | `4px` | Tight inner padding |
| `--space-sm` | `8px` | Default inner padding |
| `--space-md` | `16px` | Standard gap |
| `--space-lg` | `24px` | Card padding |
| `--space-xl` | `32px` | Major separators |
| `--space-2xl` | `48px` | Page-level rhythm |

---

## 4. Typography Scale (Fluid `clamp()`)

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `'Inter', system-ui, sans-serif` | Global typeface |
| `--font-mono` | `'JetBrains Mono', monospace` | Code, IDs, serials |
| `--text-xs` | `clamp(0.7rem, 0.7rem + 0.1vw, 0.75rem)` | Badges, metadata |
| `--text-sm` | `clamp(0.8rem, 0.8rem + 0.2vw, 0.875rem)` | Table cells, labels |
| `--text-base` | `clamp(0.95rem, 0.95rem + 0.3vw, 1rem)` | Body text |
| `--text-lg` | `clamp(1.1rem, 1.1rem + 0.5vw, 1.25rem)` | Subheadings |
| `--text-xl` | `clamp(1.35rem, 1.35rem + 0.8vw, 1.5rem)` | Section titles |
| `--text-2xl` | `clamp(1.6rem, 1.6rem + 1.2vw, 2rem)` | Page titles |
| `--text-3xl` | `clamp(1.85rem, 1.85rem + 1.5vw, 2.5rem)` | Hero headings |
| `--text-4xl` | `clamp(2rem, 2rem + 3vw, 3.5rem)` | Hero titles |

---

## 5. Border Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Badges, small chips |
| `--radius-md` | `10px` | Cards, inputs, buttons |
| `--radius-lg` | `16px` | Panels, modals, side-peek |
| `--radius-xl` | `24px` | Dashboard hero sections |

---

## 6. Glass & Effects

| Token | Value | Usage |
|---|---|---|
| `--glass-bg` | `rgba(26, 26, 46, 0.65)` | Panel backgrounds |
| `--glass-border` | `rgba(255, 255, 255, 0.06)` | Sub-pixel borders |
| `--glass-blur` | `16px` | Backdrop blur radius |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.2)` | Subtle elevation |
| `--shadow-md` | `0 4px 20px rgba(0,0,0,0.3)` | Default card |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.4)` | Modal/overlay |
| `--shadow-gold` | `0 0 20px rgba(212,168,83,0.15)` | Gold hover glow |
| `--shadow-glow-gold` | `0 0 30px rgba(212,168,83,0.12)` | Ambient gold |
| `--shadow-glow-subtle` | `0 0 20px rgba(255,255,255,0.03)` | Neutral ambient |

---

## 7. Motion & Transitions

| Token | Value | Usage |
|---|---|---|
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing |
| `--transition-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring micro-interactions |
| `--duration` | `0.25s` | Standard duration |

---

## 8. Iconography

| Property | Value |
|---|---|
| **Icon Library** | Lucide Icons v0.468+ |
| **CDN** | `https://unpkg.com/lucide@latest` |
| **Format** | SVG via `data-lucide="icon-name"` + `lucide.createIcons()` |
| **Sizing** | `width: 18px; height: 18px` (sidebar), `16px` (inline) |
| **Color** | Inherits `currentColor` from parent |
| **Emojis** | ❌ **Forbidden** — G4 guardrail |

---

## 9. Theme Switching

| Property | Value |
|---|---|
| **Attribute** | `data-theme="light"` on `<html>` |
| **Persistence** | `localStorage.getItem('majaz-theme')` |
| **Default** | Dark (no `data-theme` attribute) |
| **Toggle** | `#theme-toggle` button in header |
| **Guardrail** | G5 — every `:root` token must have `[data-theme="light"]` override |
