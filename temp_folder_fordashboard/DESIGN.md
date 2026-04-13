# Design System Strategy: The Academic Curator

## 1. Overview & Creative North Star
The core philosophy of this design system is **"The Academic Curator."** Moving away from the cluttered, utilitarian nature of traditional student portals, this system treats academic data with the same reverence as a high-end editorial publication or a curated museum gallery.

The "Curator" aesthetic is achieved through **Soft Minimalism** and **Intentional Asymmetry**. We break the rigid, boxy grid by using exaggerated whitespace and overlapping elements (like floating search bars and layered cards) to create a sense of depth and focus. This system rejects "standard" UI patterns in favor of a bespoke, premium experience that feels calm, authoritative, and deeply intentional.

---

## 2. Colors: Tonal Depth over Borders
Our palette is rooted in a biophilic foundation: the growth and stability of `primary` forest green against the breathing room of a `background` mint wash.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. Use `surface-container-low` sections sitting on a `surface` background to denote change in context. This creates a "soft-edge" world that feels organic rather than mechanical.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper.
- **Base Layer:** `surface` (#f2fcf8) for the main canvas.
- **Sectioning:** `surface-container-low` (#ecf6f3) for large layout blocks like the side navigation.
- **Actionable Containers:** `surface-container-lowest` (#ffffff) for high-priority cards and interactive modules.
- **The "Glass & Gradient" Rule:** For floating elements or top-level navigation, use Glassmorphism (semi-transparent `surface` with a 20px-30px backdrop-blur). For primary CTA modules, use a subtle radial gradient transitioning from `primary` (#003624) to `primary_container` (#124e38) to give the UI "soul" and visual depth.

---

## 3. Typography: Editorial Authority
The typography is a dialogue between the tradition of academia and the efficiency of modern technology.

- **Display & Headlines (`newsreader`):** Used for student greetings and section headers. The high-contrast serif evokes a sense of prestige and storytelling. Use `headline-lg` for "Welcome back" messages to make the student feel like the protagonist of their journey.
- **Body & Labels (`manrope`):** A clean, geometric sans-serif that ensures maximum readability for data-heavy views.
- **Intentional Scale:** Use `display-lg` sparingly to create a "Signature Editorial" moment on the dashboard. The contrast between a massive `display-lg` serif and a tiny, tracked-out `label-sm` sans-serif is what creates the high-end feel.

---

## 4. Elevation & Depth
We eschew "Material" shadows in favor of **Tonal Layering** and **Ambient Light**.

- **The Layering Principle:** Softness is paramount. Achieve lift by placing a `surface-container-lowest` card on a `surface` background. The slight shift in brightness is enough for the eye to perceive depth without visual noise.
- **Ambient Shadows:** For floating headers or hover states, use a custom shadow: `0px 12px 32px rgba(20, 29, 28, 0.06)`. Note the use of `on-surface` (#141d1c) as the shadow tint rather than pure black; this mimics natural, indoor ambient lighting.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (#c0c9c2) at **15% opacity**. A 100% opaque border is a failure of the system.
- **Rounding Scale:** Follow the `xl` (1.5rem) token for main dashboard cards to maintain the "Soft-Edge" aesthetic. Circular iconography should always be encased in `md` (0.75rem) squares with subtle backgrounds.

---

## 5. Components

### Navigation & Identity
- **Side Navigation:** Uses `surface-container-low`. Active states should use the `primary` color for the container with `on_primary` text. The navigation should feel like a sidebar in a luxury magazine.
- **The "SWAFO" Brand Mark:** Always rendered in `primary` with high breathing room.

### Actionable Elements
- **Buttons:**
    - **Primary:** Gradient fill (`primary` to `primary_container`), `xl` roundedness, white text. No border.
    - **Secondary:** Transparent with `outline-variant` at 20% opacity.
- **Input Fields:** Search bars should be `surface-container-lowest` with `xl` rounding. Forbid square corners. Use `on-surface-variant` for icons to keep them secondary to the text.
- **Cards:** Forbid divider lines. Separate content blocks within cards using `body-md` spacing (0.875rem) or a subtle shift to `surface-variant`.

### Academic Modules
- **Status Chips:** Use `secondary_container` for positive states (e.g., "Good Standing") and `error_container` for warnings.
- **AI Curator Input:** A dark-mode exception. Use `primary` (#003624) as the container background with a `surface-container-lowest` text input inside to create a focused, "Night Mode" focus area within the light dashboard.

---

## 6. Do's and Don'ts

### Do:
- **Do** use negative space as a functional tool. If a section feels crowded, increase the padding rather than adding a divider.
- **Do** use the `tertiary` (#462700) and `tertiary_fixed` tokens for highlights or alerts to provide a sophisticated "Gold/Amber" contrast to the greens.
- **Do** ensure all iconography is contained within a background square with `md` rounded edges.

### Don't:
- **Don't** use 100% black (#000000). Use `on_surface` (#141d1c) for all "black" text to maintain the soft, organic feel.
- **Don't** use sharp corners. Everything in this system—from buttons to the AI input bar—must have at least a `sm` (0.25rem) radius, but ideally `lg` (1rem) or higher.
- **Don't** use "Drop Shadows" on every card. Only the most important, floating interactive elements should have an ambient shadow. Let the background color shifts do the heavy lifting.