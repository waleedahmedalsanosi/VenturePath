# Design System — VenturePath

**Codename:** The Kinetic Sovereign
**Creative North Star:** The Digital Vault — a high-stakes environment where Gulf
capital meets modern tech velocity. Authoritative weight, fluid speed, deliberate
restraint.

---

## 1. Product Context

- **What this is:** Bilingual cap table + governance + valuation platform for KSA
  and MENA founders. Sharia-compliant equity instruments (iSAFE) are a primary
  differentiator.
- **Who it's for:** Saudi early-stage founders (Pre-Seed → Series A), their
  shareholders, and investors.
- **Space/industry:** Regulated finance + venture / startup operating systems.
  Peers: Carta, Pulley, Ledgy. Differentiator: Sharia-compliance, AR/RTL, SAR.
- **Project type:** Hybrid — dense data application (cap table, audit, valuation)
  with marketing surfaces (Public Profile, Explore).

---

## 2. Aesthetic Direction

- **Direction:** Kinetic Sovereign. Editorial layouts, optical depth via tonal
  shifts, glass refraction, ambient glow.
- **Decoration level:** Intentional. Glass and gradient as primary depth
  vocabulary. No decorative blobs, no icons-in-circles, no centered everything.
- **Mood:** Premium, secure, deliberate. The product should feel like a vault
  someone trusts with their company's equity, not a SaaS dashboard.

### Hard "No-Line Rule"
Do **not** use 1px solid borders to define sections. Boundaries are established by:
- **Tonal shifts** between surface tokens
- **Negative space** from the spacing scale
- **Glass refraction** (`backdrop-blur`) on floating elements
- **Ghost borders** at 20% opacity on input fields only

### Density Modes
Two spacing scales coexist. Apply them per surface, not per page.

- **Marketing density** (Public Profile, Explore, Hub Overview, Empty States):
  generous whitespace, lets the void feel premium.
- **Data density** (Cap Table, Audit Trail, ESOP Grants, Document Vault list):
  tight readable rows, sized for 30+ shareholders or 100+ audit events without
  scroll-fatigue.

---

## 3. Color

### Approach
Dark-first with a complementary light mode. Both modes preserve the Digital Vault
soul — never stark white, never neon black.

### Dark Palette (default)

#### Surfaces (depth via tonal stack)
| Token                       | Hex       | Use                                          |
|----------------------------|-----------|----------------------------------------------|
| `surface`                  | `#0D1322` | Deep base background                         |
| `surface_container_low`    | `#151B2B` | Large content sections                       |
| `surface_container_high`   | `#242A3A` | Cards, actionable widgets                    |
| `surface_bright`           | `#33394A` | Popovers, high-priority modals               |
| `surface_variant` @ 40%   | (glass)   | Floating elements, with `24px` backdrop-blur |

#### Text
| Token                   | Hex       | Use                                |
|------------------------|-----------|-------------------------------------|
| `on_surface`           | `#DDE2F8` | Primary text (never pure white)     |
| `on_surface_variant`   | `#8B92A8` | Secondary, muted, metadata          |
| `on_surface_disabled`  | `#4A5168` | Disabled states                     |

#### Brand & Accent
| Token                    | Hex       | Use                                          |
|--------------------------|-----------|----------------------------------------------|
| `primary`                | `#7AD4E3` | Brand teal — focus rings, active states      |
| `primary_container`      | `#0A7E8C` | Gradient start, deep teal                    |
| `tertiary`               | `#3CD7FF` | Gradient end, holographic data fills         |
| `outline_variant` @ 20% | `#3E494B` | Ghost borders on inputs                       |

### Light Palette

| Token                      | Hex       | Use                                          |
|----------------------------|-----------|----------------------------------------------|
| `surface`                  | `#F8F5EE` | Warm cream base — papyrus, never `#FFFFFF`   |
| `surface_container_low`    | `#EFEAE0` | Large content sections                       |
| `surface_container_high`   | `#FBFAF5` | Cards, actionable widgets                    |
| `surface_bright`           | `#FFFEFA` | Popovers, modals (with subtle inset shadow)  |
| `on_surface`               | `#0D1322` | Primary text (mirrors dark mode's surface)   |
| `on_surface_variant`       | `#4A5168` | Secondary, muted                             |
| `primary`                  | `#0A7E8C` | Brand teal (deeper for light mode contrast)  |
| `primary_container`        | `#C7E9EC` | Subtle teal background                       |
| `tertiary`                 | `#006B75` | Deeper teal for accents                      |
| `outline_variant` @ 20%   | `#C5CDD6` | Ghost borders                                 |

### Semantic
Same hex in both modes — these colors must read identically as status:

| Token       | Hex       | Use                                   |
|-------------|-----------|---------------------------------------|
| `success`   | `#00875A` | Compliance complete, vested, active   |
| `warning`   | `#FF8B00` | Due soon (≤30 days), pending action   |
| `error`     | `#DE350B` | Overdue, validation errors            |
| `info`      | `#0065FF` | Neutral notices, informational badges |

### Chart Palette
8 colors for shareholder donuts, time-series, dilution waterfalls. Verified
distinguishable against both `#0D1322` and `#F8F5EE`, and against deuteranopia
+ protanopia simulation.

| # | Hex       | Suggested role                              |
|---|-----------|---------------------------------------------|
| 1 | `#3CD7FF` | Primary teal (largest segment)              |
| 2 | `#00875A` | Saudi green (iSAFE — see §3.6)              |
| 3 | `#FFB627` | Amber                                       |
| 4 | `#C73E9D` | Magenta                                     |
| 5 | `#8A6FE8` | Lavender                                    |
| 6 | `#FF6B6B` | Coral                                       |
| 7 | `#6CB97C` | Sage                                        |
| 8 | `#5C6B7A` | Slate (fallback / "Other")                  |

### iSAFE Differentiator (intentional)
iSAFE is the product's wedge. It gets a permanent visual identity:

- **iSAFE chip / badge:** `#00875A` background (Saudi green), `#DDE2F8` text
- **iSAFE chart segment:** Always `#00875A` regardless of position
- **iSAFE row marker:** 2px left edge accent in `#00875A` on hover
- **SAFE chip:** `#3CD7FF` (teal) — Sharia-distinct from iSAFE
- **Convertible Note chip:** `#FFB627` (amber)
- **Ordinary Share chip:** `surface_bright` background, no accent

This encodes the differentiator visually without requiring users to read labels.

### Dark Mode Strategy
Light mode reduces saturation by 10–15% on accent colors. Surface contrast ratios
remain WCAG AA in both modes (verified against `on_surface`).

---

## 4. Typography

### Fonts

| Role             | Latin Font     | Arabic Font | Loading                                   |
|------------------|----------------|-------------|--------------------------------------------|
| Display / Hero   | **Inter**      | **Cairo**   | Google Fonts, `display=swap`               |
| Body             | **Inter**      | **Cairo**   | Same load, weights 400/500/600             |
| UI / Labels      | **Inter**      | **Cairo**   | Same                                       |
| Data / Tables    | **Inter** with `font-variant-numeric: tabular-nums` | **Cairo** | Same |
| Code / Technical | JetBrains Mono | —           | Optional, only for code blocks             |

**Note on Inter:** Inter is the chosen Latin font despite being the "safe default."
The Kinetic Sovereign aesthetic uses Inter intentionally — its neutrality lets the
glass/gradient/glow do the personality work. Do not switch to General Sans or
Geist unless Phase 2 design review confirms a change.

**Note on Cairo:** Cairo is a contemporary Arabic typeface designed in Egypt with
a modern feel that respects traditional Arabic letterforms. Pairs cleanly with
Inter at body sizes; at display sizes, increase Cairo size by ~10% relative to
Inter to balance optical weight (Arabic letterforms have different vertical
balance than Latin).

### Power Scale

| Step          | Size       | Weight  | Letter-spacing | Use                              |
|---------------|------------|---------|----------------|----------------------------------|
| `display-lg`  | 3.5rem     | 700     | `-0.02em`      | Hero numbers (cap, valuation)    |
| `display-md`  | 2.5rem     | 700     | `-0.015em`     | Public Profile name              |
| `display-sm`  | 2rem       | 600     | `-0.01em`      | Section heroes                   |
| `headline-lg` | 1.75rem    | 600     | `-0.005em`     | Page titles                      |
| `headline-md` | 1.375rem   | 600     | `0`            | Section headings                 |
| `headline-sm` | 1.125rem   | 600     | `0`            | Subsection / card titles         |
| `body-lg`     | 1.0625rem  | 400     | `0`            | Reading copy                     |
| `body-md`     | 0.9375rem  | 400     | `0`            | Workhorse body                   |
| `body-sm`     | 0.8125rem  | 400     | `0`            | Captions, helper text            |
| `label-lg`    | 0.875rem   | 500     | `0.02em`       | Buttons, primary labels          |
| `label-md`    | 0.75rem    | 500     | `0.05em UPPER` | Table headers, metadata          |
| `label-sm`    | 0.6875rem  | 500     | `0.05em UPPER` | Tiny chips, micro-labels         |

### Number Formatting (PRD US-20-01)
The Arabic number format toggle (Western: `1,234` vs Eastern: `١٬٢٣٤`) operates
at the CSS level via `font-feature-settings` and Unicode digit substitution.
Cairo handles Eastern Arabic numerals natively. Inter falls back to Cairo glyphs
when Eastern numerals are requested in mixed bilingual contexts.

### SAR Currency Display
- Latin: `SAR 1,234,567` — `SAR` prefix in `label-md` + space + figure
- Arabic: `١٬٢٣٤٬٥٦٧ ر.س.` — figure + space + `ر.س.` suffix
- Tabular numerals always on for cap table values, audit trail amounts, and
  valuation outputs. Never proportional digits in financial displays.

---

## 5. Spacing

### Base Unit: `4px`

### Scale — Marketing Density (Public Profile, Explore, Empty States)
| Token   | Value   |
|---------|---------|
| `2xs`   | `4px`   |
| `xs`    | `8px`   |
| `sm`    | `16px`  |
| `md`    | `24px`  |
| `lg`    | `32px`  |
| `xl`    | `48px`  |
| `2xl`   | `64px`  |
| `3xl`   | `96px`  |

### Scale — Data Density (Cap Table, Audit, ESOP, Vault)
| Token         | Value   |
|---------------|---------|
| `data-2xs`    | `4px`   |
| `data-xs`     | `8px`   |
| `data-sm`     | `12px`  |
| `data-md`     | `16px`  |
| `data-lg`     | `20px`  |
| `data-xl`     | `24px`  |
| `data-2xl`    | `32px`  |
| `data-3xl`    | `40px`  |

Apply data density to: table row padding, form field grids, audit log entries,
shareholder list rows, ESOP grant tables, document vault list view.

---

## 6. Layout

- **Approach:** Hybrid. Marketing surfaces (Public Profile, Explore, Landing) use
  creative-editorial. App surfaces (Cap Table, Vault, Audit) use grid-disciplined.
- **Grid:** 12 columns at desktop (≥1280px), 8 at tablet (768–1279px), 4 at
  mobile (<768px)
- **Max content width:** `1440px` for app, `1200px` for marketing
- **Border radius scale:**
  | Token  | Value      | Use                                |
  |--------|------------|------------------------------------|
  | `xs`   | `0.25rem`  | Chips inside dense rows            |
  | `sm`   | `0.5rem`   | Inputs, small buttons              |
  | `md`   | `0.625rem` | Cards in data views                |
  | `lg`   | `0.75rem`  | Primary CTAs, modals (the "xl" of original spec) |
  | `xl`   | `1rem`     | Hero containers, public profile cards |
  | `full` | `9999px`   | Status chips, tags ONLY            |

  No element should use `full` unless it's a chip/tag/status badge. No exceptions.

### Layering Principle
A card sitting on `surface_container_low` must be `surface_container_high` (one
step up). Never the same surface as the parent. Step-up creates lift without
borders.

---

## 7. Elevation

### Forbidden
- Standard `box-shadow` with grey/black opacity
- 1px solid borders for section separation

### Allowed

#### Ambient Glow (high-priority elements)
```css
box-shadow: 0 0 40px rgba(122, 212, 227, 0.10);  /* primary @ 10%, 40px blur */
```
Use sparingly: **maximum 1–2 glows per screen** to preserve impact.

#### Glass Refraction (floating elements)
```css
background: rgba(36, 42, 58, 0.40);  /* surface_container_high @ 40% */
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
```
Apply consistently — same blur across the application.

#### Ghost Border (input fields only)
```css
border: 1px solid rgba(62, 73, 75, 0.20);  /* outline_variant @ 20% */
```
On focus, transition to `primary` with a subtle 2px outer glow.

#### Inset Lift (light mode `surface_bright`)
```css
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);  /* warm highlight */
```
Light-mode equivalent of the dark mode's tonal step-up.

---

## 8. Components

### Buttons

#### Primary
- **Background:** Linear gradient `#0A7E8C → #3CD7FF` at `135deg`
- **Text:** `#0D1322` (always — high contrast against the bright gradient end)
- **Border-radius:** `0.75rem` (lg)
- **Padding:** `data-sm` vertical, `data-xl` horizontal
- **Hover:** Increase glow blur from `0px` to `24px`, no color change
- **Active:** Reduce glow to `12px`, slight scale `0.98`

> **Known cost:** Gradient buttons are a flagged AI-slop pattern. The Kinetic
> Sovereign uses them as the deliberate "teal gemstone" signature. Acceptable
> only because: (a) one accent color (teal) is consistent across the entire
> system, (b) the gradient is short-distance (analogous, not rainbow), (c) the
> button-as-jewel concept is product-aligned with "vault." Do not extend this
> pattern to other elements.

#### Secondary (Ghost)
- **Background:** Transparent
- **Border:** Ghost border at 20% `outline_variant`
- **Text:** `on_surface`
- **Hover:** Border opacity increases to 40%, no fill

#### Tertiary (Text-only)
- **No background, no border**
- **Text:** `primary` color
- **Hover:** Underline, no fill

### Input Fields
- **Background:** `surface_container_high` (dark) / `surface_container_low` (light)
- **No bottom line, no full border**
- **Ghost border** as described in §7
- **Padding:** `data-sm` vertical, `data-md` horizontal
- **Focus:** Ghost border transitions to `primary`, with `2px` outer glow at 30%
  opacity
- **Error state:** Ghost border becomes `error` at 60% opacity, helper text in
  `error` color below the field
- **Label:** Always visible above the field. Never use placeholder-as-label.

### Cards (Marketplace Listings, Dashboard Widgets)
- **No internal divider lines**
- **Background:** One step up from parent surface
- **Padding:** `md` vertical (marketing) or `data-md` (app)
- **Border-radius:** `md` for app, `xl` for marketing
- **Hover:** Subtle ambient glow (10% primary, 24px blur) — never lift via
  `transform`

### Chips / Status Badges
- **Border-radius:** `full`
- **Padding:** `2xs` vertical, `xs` horizontal
- **Typography:** `label-sm`, ALL CAPS, `0.05em` letter-spacing
- **Background:** Semantic color at 15% opacity, text at full color
- **Instrument badges (per §3.6):** iSAFE green, SAFE teal, Convertible amber,
  Ordinary neutral

### Marketplace "Pulse" (data viz primitive)
- **Line:** `tertiary` (#3CD7FF) at 2px stroke
- **Area fill:** `primary_container` at 10% opacity
- **Grid lines:** `outline_variant` at 8% opacity, dashed
- **Hover dot:** `tertiary` solid 6px circle with 12px ambient glow

### Donut Chart (Cap Table)
- **Stroke colors:** Chart palette in order, iSAFE always color #2 regardless of
  segment position
- **Center label:** `display-md` for the headline number, `label-md` below for
  the unit ("Total Issued Shares")
- **Legend:** `body-sm`, never inline labels on the donut itself
- **Hover:** Selected segment gains 2px outward stroke in matching color
- **Empty state:** Faded outline donut with "Add your first shareholder" CTA in
  the center

### Compliance Timeline
- **Time axis:** Horizontal, `outline_variant` at 20% opacity
- **Milestones:** Circles in semantic color (overdue red, due-soon amber,
  complete green, upcoming neutral)
- **Today marker:** Vertical `primary` line at 30% opacity, full height
- **Hover:** Milestone expands to show tooltip card (glass, blurred backdrop)

---

## 9. Motion

- **Approach:** Intentional. Motion serves hierarchy and state changes only.
  Never decorative.
- **Easing:**
  - Enter: `cubic-bezier(0.16, 1, 0.3, 1)` (decelerate-strong)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (accelerate)
  - Move: `cubic-bezier(0.4, 0, 0.2, 1)` (standard)
- **Duration:**
  | Type   | Range       | Use                                    |
  |--------|-------------|----------------------------------------|
  | micro  | 50–100ms    | Hover state changes, focus rings       |
  | short  | 150–250ms   | Modal open, toast appear, glow expand  |
  | medium | 250–400ms   | Page transitions, drawer slide         |
  | long   | 400–700ms   | Initial page load orchestration only   |

- **Reduced motion:** `prefers-reduced-motion: reduce` disables all entrance
  animations and reduces glow transitions to instant. Never block functionality.

---

## 10. Bilingual & RTL

### Direction
- `dir="rtl"` toggles full layout mirroring via CSS logical properties
  (`margin-inline-start`, `padding-inline-end`, etc.). Never use `left/right`
  directly — always `start/end`.

### Mirroring rules
- **Mirror:** layout, sidebar position, list ordering, forward/back arrows,
  progress bars (LTR fills right, RTL fills left)
- **Do not mirror:** clocks, charts (time always flows forward in the user's
  reading direction — RTL timelines flow right-to-left), brand logos, code
  snippets, video player controls

### Iconography
- Directional icons (arrows, chevrons) flip in RTL
- Universal icons (search, settings, user) do not flip
- Icon set: Lucide or Tabler — both have established RTL guidance

### Typography in RTL
- Cairo at 110% size of Inter for matched optical weight at headline sizes
- Line-height in RTL: 1.6 minimum (Arabic letterforms have more vertical
  variation than Latin)
- Avoid italics in Arabic — Arabic typography does not have a true italic
  tradition; use weight contrast instead

---

## 11. Accessibility

- **Contrast:** WCAG 2.1 AA in both modes. `on_surface` against `surface` ratio
  verified ≥7:1 (AAA) in dark, ≥7:1 in light.
- **Focus rings:** 2px `primary` outline, 2px offset, never removed without
  replacement
- **Touch targets:** Minimum 44×44px for any interactive element
- **Charts:** Color is never the only signal. Always paired with label, position,
  or pattern
- **Reduced motion:** Respect `prefers-reduced-motion`
- **Keyboard nav:** Tab order matches visual order in both LTR and RTL
- **Screen readers:** All charts have text equivalents available via
  `aria-describedby`. Cap table donut announces ownership percentages on focus.

---

## 12. Decisions Log

| Date       | Decision                                                  | Rationale |
|------------|-----------------------------------------------------------|-----------|
| 2026-05-15 | Initial design system — Kinetic Sovereign aesthetic       | User-supplied creative direction grounded in Gulf VC + modern tech |
| 2026-05-15 | Inter chosen as primary Latin font                        | User decision; convergence-trap risk acknowledged in §4 |
| 2026-05-15 | Cairo paired for Arabic                                   | Local Egyptian-designed feel preferred over IBM Plex Arabic for Sharia-context warmth |
| 2026-05-15 | Light mode added to honor PRD US-20-02                    | PRD requires both modes; user agreed to add complementary palette preserving Vault aesthetic |
| 2026-05-15 | Gradient CTAs retained despite AI-slop classification     | Deliberate "teal gemstone" signature aligned with vault concept; isolated to one element type |
| 2026-05-15 | iSAFE permanent visual identity (Saudi green #00875A)     | Reinforces product's strategic differentiator at the pixel level |
| 2026-05-15 | Dual density modes (marketing vs data) added              | Cap table density would suffocate under marketing-spec whitespace |
| 2026-05-15 | Chart palette of 8 colors specified                       | PRD requires donut + waterfall + time-series; no palette in original spec |
| 2026-05-15 | Semantic colors specified (success/warning/error/info)    | PRD Compliance Timeline requires status colors; no semantic tokens in original spec |
