# Englishfully Design System Specification

## Visual design style

**Comic-book / bold UI** — The site uses a **comic-book inspired** visual language: flat, saturated colors; **thick black outlines** (4px–8px) on all major UI elements; **hard drop shadows** (no blur) offset in one direction (e.g. 5px 5px 0px black) to suggest ink or cut-out shapes. Typography mixes a **rounded display font (Fredoka)** for body and a **bold condensed font (Bungee)** for headings, with **Comic Neue** for body/paragraph text. Backgrounds use **subtle radial gradients** and optional **decorative patterns** (dots, stripes, zigzag). Buttons and cards use **scale and shadow changes on hover** (e.g. translateY(-2px), scale(1.02)) and **brightness on hover**. The result is **bold, playful, high-contrast**, with a clear hierarchy and no soft shadows or minimal borders — everything reads as “comic strip” or “poster” style.

---

## 1. Colors

### Primary colors
| Token | Hex | Usage |
|-------|-----|--------|
| `comic-primary` | `#ff4757` | Main brand, CTAs, hero, primary buttons |
| `comic-secondary` | `#00d2d3` | Secondary actions, cards, accents |
| `comic-accent` | `#3742fa` | Accent sections, nav blocks, tertiary emphasis |

### Secondary / semantic colors
| Token | Hex | Usage |
|-------|-----|--------|
| `comic-warning` | `#ffa502` | Warnings, highlights, decorative circles |
| `comic-success` | `#2ed573` | Success states, positive blocks |
| `comic-danger` | `#ff3838` | Errors, urgent sections, alerts |

### Extended palette (decorative / variants)
| Token | Hex |
|-------|-----|
| `comic-yellow` | `#ffdd59` |
| `comic-pink` | `#ff6b9d` |
| `comic-purple` | `#a55eea` |

### Background colors
| Token | Hex | Usage |
|-------|-----|--------|
| `comic-light` | `#f1f2f6` | Page background base, subtle panels |
| `comic-white` | `#ffffff` | Cards, inputs, header, modals |
| Body gradient | `linear-gradient(135deg, #f1f2f6 0%, #e9ecef 50%, #f1f2f6 100%)` | Main page background |
| Overlay pattern | Radial gradients with primary/secondary/warning at ~10% opacity | Ambient tint over body |

### Text colors
| Token | Hex | Usage |
|-------|-----|--------|
| `comic-dark` | `#2f3542` | Default body and UI text |
| `comic-white` | `#ffffff` | Text on colored backgrounds (hero, cards) |
| `comic-black` | `#000000` | Outlines, shadows, strong contrast (not body copy) |

### Border colors
| Token | Hex | Usage |
|-------|-----|--------|
| `comic-black` | `#000000` | All strokes/outlines (borders and shadow “ink”) |

---

## 2. Typography

### Font families
| Token | Family | Usage |
|-------|--------|--------|
| `--font-fredoka` | `'Fredoka', cursive` | Body default (layout), friendly rounded feel |
| `--font-bungee` | `'Bungee', cursive` | Headings (comic-title), buttons, nav labels |
| `--font-comic-neue` | `'Comic Neue', cursive` | Body text (comic-text), lists, paragraphs |

### Font weights
- **Fredoka:** 300, 400, 500, 600, 700 (from Google Fonts).
- **Bungee:** 400 only.
- **Comic Neue:** 300, 400, 700.
- **Usage:** Bold = headings and buttons; normal/light = body and lists.

### Font sizes (desktop)
- **Body / list:** 1rem (base) → 1.125rem (md) → 1.25rem (lg).
- **ComicText sizes:** sm/md/lg = `text-lg` → `md:text-xl` → `lg:text-2xl`; xl = `text-xl` → `md:text-2xl` → `lg:text-3xl`.
- **ComicTitle (headings):**
  - H1: `text-5xl` → `md:text-6xl`
  - H2: `text-4xl` → `md:text-5xl`
  - H3: `text-3xl` → `md:text-4xl`
  - H4: `text-2xl` → `md:text-3xl`
  - H5: `text-xl` → `md:text-2xl`
  - H6: `text-lg` → `md:text-xl`

### Mobile (≤768px)
- **Root:** `font-size: 1.125rem` (18px base).
- **Comic title:** `1.5rem`.
- **Comic text / list items:** `1.125rem`.

### Heading styles (comic-title)
- **Font:** Bungee, bold.
- **Text shadow (outline effect):** `3px 3px 0px var(--comic-black), 6px 6px 0px rgba(0,0,0,0.3)`.
- **Letter-spacing:** `0.05em`.
- Body/comic-text and list items: no text-shadow for readability.

---

## 3. UI style

### Button styles (comic-button)
- **Font:** Bungee, bold; size: `text-lg` (md), `text-base` (sm), `text-xl` (lg).
- **Padding:** sm `px-4 py-2`, md `px-6 py-3`, lg `px-8 py-4`.
- **Border:** `var(--comic-border)` (4px solid black).
- **Border radius:** `rounded-lg`.
- **Shadow:** default `comic-shadow-md`; hover `comic-shadow-lg`; active `comic-shadow-sm` + translate(2px, 2px) + scale(0.95).
- **Transition:** `transition-all duration-200`; hover `scale(1.02)` + `translateY(-2px)`; active `scale(0.98)`.
- **Variants:** primary, secondary, accent, warning, success, danger — each uses corresponding `comic-bg-*` and `text-white` (warning uses `text-black`). Hover: `brightness-110`.

### Border radius
- **Standard:** `rounded-lg` (buttons, inputs, cards, nav items).
- **Large:** `rounded-xl` (cards, sections, modals).
- **Small / pills:** `rounded-md` (compact toggles, badges).
- **Circles:** `rounded-full` (decorative dots, icon buttons).

### Stroke / outline usage
- **Default:** `--comic-border` = 4px solid black (buttons, inputs, cards, nav).
- **Thick:** `--comic-border-thick` = 6px solid black (header, dropdowns, hero accents).
- **XL:** `--comic-border-xl` = 8px solid black (optional emphasis).
- **Bottom only:** `comic-border-b-4` (4px bottom), `comic-border-b-2` (2px bottom) — used for header and nav dividers.
- **Focus:** No outline; focus indicated by `comic-shadow-md` and `border-color: comic-primary`.

### Shadows (all hard, no blur — “ink” style)
| Token | Value |
|-------|--------|
| `comic-shadow-sm` | `3px 3px 0px var(--comic-black)` |
| `comic-shadow-md` | `5px 5px 0px var(--comic-black)` |
| `comic-shadow-lg` | `8px 8px 0px var(--comic-black)` |
| `comic-shadow-xl` | `12px 12px 0px var(--comic-black)` |
| `comic-shadow-2xl` | `16px 16px 0px var(--comic-black)` |

**Mobile (≤768px):** Slightly reduced offset (xl→8px, lg→6px, md→4px) for proportion.

### Text outlines
- **Headings only:** Double shadow to simulate thick outline: `3px 3px 0px black`, `6px 6px 0px rgba(0,0,0,0.3)`.
- Body and lists: no text outline.

### Card styles (comic-card)
- **Padding:** `p-6`.
- **Border radius:** `rounded-xl`.
- **Border:** `var(--comic-border)` (4px solid black).
- **Shadow:** `comic-shadow-md`; hover: `comic-shadow-lg` + `translateY(-2px)`.
- **Background:** Default `comic-white`; variants: primary, secondary, accent use `comic-bg-*` + `text-white`.
- **Transition:** `transition-all duration-200` (or inherited).

### Hover effects
- **Buttons:** `translateY(-2px)` + `scale(1.02)`; shadow md→lg; active: translate(2px,2px) + scale(0.98), shadow→sm.
- **Cards:** `translateY(-2px)`; shadow md→lg.
- **Links / nav items:** `scale(1.05)` or `scale(1.02)`; shadow sm→md; brightness or background change where applicable.
- **Icon/social buttons:** `scale(1.1)`; shadow md→lg.

### Inputs (comic-input, comic-textarea)
- **Border:** `comic-border`; **shadow:** `comic-shadow-sm`.
- **Focus:** `comic-shadow-md`, `border-color: comic-primary`, outline none.
- **Padding:** `p-3`; **radius:** `rounded-lg`.

---

## 4. Layout

### Spacing scale
- **Tailwind default scale** used consistently: `space-y-2`, `space-y-4`, `gap-4`, `gap-6`, `gap-8`, `gap-12`; `px-4`, `px-6`, `px-8`; `py-3`, `py-6`, `py-12`, `py-24`.
- **Section vertical:** `py-24`; **section horizontal:** `px-4`.
- **List spacing:** `space-y-2` between list items; lists use `@apply space-y-2`.
- **Button padding:** 4/6/8 (x), 2/3/4 (y) for sm/md/lg.

### Container width
- **Content max-width:** `max-w-6xl` for main content; `max-w-4xl` for intro/lead text; `max-w-3xl` for narrow hero subtext; `max-w-md` for forms.
- **Centering:** `mx-auto` on constrained containers.

### Grid behavior
- **Common patterns:** `grid md:grid-cols-2`, `grid md:grid-cols-3`, `grid md:grid-cols-2 lg:grid-cols-3`, `grid md:grid-cols-2 lg:grid-cols-4`.
- **Gaps:** `gap-6`, `gap-8`, `gap-12` (section-level usually `gap-8`).
- **Flex:** Hero and CTAs use `flex flex-col sm:flex-row gap-4` for stacking on mobile.

### Z-index
- **Header/nav:** `z-50`; **mobile menu:** `z-[9999]`; **hero/content:** `z-0`; **body::before overlay:** negative or behind content.

---

## 5. Background gradients (comic-bg-*)

Used for buttons, cards, and section bands. All `linear-gradient(135deg, base 0%, darker 100%)`:

| Class | Gradient |
|-------|----------|
| comic-bg-primary | `#ff4757` → `#ff3742` |
| comic-bg-secondary | `#00d2d3` → `#00b8b9` |
| comic-bg-accent | `#3742fa` → `#2f3542` |
| comic-bg-warning | `#ffa502` → `#ff9500` |
| comic-bg-success | `#2ed573` → `#26d0ce` |
| comic-bg-danger | `#ff3838` → `#ff2d2d` |
| comic-bg-purple | `#a55eea` → `#8e44ad` |
| comic-bg-pink | `#ff6b9d` → `#e91e63` |
| comic-bg-yellow | `#ffdd59` → `#f39c12` |

---

## 6. Patterns (decorative)

- **comic-pattern-dots:** Radial dots (2px, 20px grid), black.
- **comic-pattern-stripes:** 45deg repeating stripes, 10px transparent / 10px rgba(0,0,0,0.1).
- **comic-pattern-zigzag:** Checker/zigzag 20px with black.

Used on header (stripes), section backgrounds (dots or stripes), and hero areas (zigzag).

---

## 7. Animation

- **comic-bounce:** Vertical bounce (translateY -10px / -5px), 2s infinite.
- **comic-wiggle:** Rotate ±1deg, 0.5s; can run infinite on hover.
- **fadeInUp:** Opacity 0→1, translateY(30px)→0, 0.6s ease-out (section reveal).
- **slideDown / slideUp:** Mobile menu enter/exit (opacity + translateY + scale).
- **Transitions:** `duration-200` or `duration-300` for hover/state changes.

---

## 8. Summary for recreation

To recreate this in another app:

1. **Colors:** Use the hex palette above; keep black for all borders and hard shadows.
2. **Typography:** Fredoka (body/default), Bungee (headings/buttons), Comic Neue (paragraphs/lists); bold for headings and CTAs.
3. **Outlines:** 4px solid black on interactive and card elements; 6px for header/dropdowns.
4. **Shadows:** Hard offset only (e.g. 5px 5px 0px black), no blur; scale shadow size with component size.
5. **Radius:** `rounded-lg` for buttons/inputs, `rounded-xl` for cards/sections.
6. **Layout:** Max-width 72rem (max-w-6xl) content, centered; responsive grids 2–3–4 columns with gap 8.
7. **Hover:** Slight lift (translateY -2px), scale up (~1.02–1.05), shadow one step larger, and brightness on colored buttons.

This yields a **comic-book / bold UI** look with thick outlines, flat color, and hard shadows.
