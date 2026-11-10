---
name: Smart Split Bill
description: Ephemeral, zero-retention receipt parser and bill splitter with exact Largest Remainder math
colors:
  primary: "#0f172a"
  primary-hover: "#1e293b"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-border-subtle: "#cbd5e1"
  neutral-text: "#0f172a"
  neutral-text-muted: "#64748b"
  neutral-text-dim: "#94a3b8"
  accent-success: "#059669"
  accent-success-subtle: "#ecfdf5"
  accent-warning: "#d97706"
  accent-warning-subtle: "#fffbeb"
  accent-danger: "#e11d48"
  accent-danger-subtle: "#fff1f2"
typography:
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.025em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
    height: "32px"
  input-field:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "32px"
  card-container:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  badge-neutral:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-text-muted}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
---

# Design System: Smart Split Bill

## Overview

**Creative North Star: "The Clean Ledger"**

Smart Split Bill presents a disciplined, utilitarian interface designed for post-meal financial clarity. It replaces cumbersome spreadsheets and opaque calculation apps with a clean accounting workspace that feels transparent, trustworthy, and lightweight. Every visual element communicates mathematical precision, privacy, and speed.

The interface relies on high-contrast slate ink over pale canvas backgrounds, crisp 1px hairline dividers, and tightly spaced typography. Decorative gradients, heavy drop shadows, and whimsical embellishments are intentionally absent. Instead, aesthetic authority comes from strict typographic alignment, clear state communication, and restrained status accents.

**Key Characteristics:**
- Restrained monochrome foundation (deep slate ink on clean bone canvas) with purposeful semantic accents.
- Hairline geometry: 1px structural borders establish division without visual weight.
- Compact, responsive touch targets calibrated for mobile cafe tables and desktop keyboards.
- High-density data tables optimized for quick scanning of receipt items and individual allocations.

## Colors

The palette is anchored by deep slate ink over a crisp pale canvas, accented only by semantic status indicators.

### Primary
- **Deep Slate Ink** (`#0f172a`): Used for primary call-to-action buttons, active navigation indicators, branded glyph containers, and main headers. Represents finality and deliberate action.
- **Deep Slate Hover** (`#1e293b`): Subtle dark lift for interactive hover states on primary controls.

### Neutral
- **Bone Canvas** (`#f8fafc`): Page background providing a soft, glare-free backdrop for paper-like white cards.
- **Pure Surface** (`#ffffff`): Card containers, tables, dialogs, and navigation bar surfaces.
- **Hairline Border** (`#e2e8f0`): Structural separation for containers, table rows, and neutral chips.
- **Subtle Border** (`#cbd5e1`): Input borders and interactive unselected step controls.
- **Primary Text** (`#0f172a`): High-contrast text for headers, item names, and calculated totals.
- **Secondary Text** (`#64748b`): Explanatory labels, table column headers, and helper copy.
- **Muted Text** (`#94a3b8`): Disabled states, tertiary breadcrumbs, and placeholder indicators.

### Semantic Accents
- **Verified Emerald** (`#059669`) / **Subtle Emerald** (`#ecfdf5`): Used for OCR Ready badges, completed step markers, and zero-difference balance confirmations.
- **Caution Amber** (`#d97706`) / **Subtle Amber** (`#fffbeb`): Used for cold-start warnings, low OCR confidence scores, and unassigned item notices.
- **Error Rose** (`#e11d48`) / **Subtle Rose** (`#fff1f2`): Used for item deletion, server offline status, and invalid inputs.

### Named Rules
**The Ink and Canvas Rule.** Dark Slate (`#0f172a`) is reserved for authoritative elements—primary CTAs, active steps, and title text. Backgrounds remain strictly calm pale bone (`#f8fafc`) and crisp white (`#ffffff`). Accent colors never act as background fills for large surfaces.

**The Semantic Scarcity Rule.** Emerald, Amber, and Rose appear exclusively to convey factual state (operational readiness, confidence warnings, or destruction/removal). They are never applied as decorative badges.

## Typography

**Display Font:** Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
**Body Font:** Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
**Numeric/Data Font:** Tabular numerals enabled via `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'`

**Character:** Utilitarian, highly legible, and crisp. Typographic hierarchy relies on strict font weights and tight tracking rather than dramatic scale variations.

### Hierarchy
- **Headline** (Semi-bold 600, 1.25rem / 20px, line-height 1.3, letter-spacing -0.025em): Step view titles and major section introductions.
- **Title** (Semi-bold 600, 0.875rem / 14px, line-height 1.4, letter-spacing -0.015em): Card titles, participant summary headings, and table headers.
- **Body** (Medium 500, 0.75rem / 12px, line-height 1.5, letter-spacing 0em): Line item descriptions, participant names, and form inputs.
- **Label** (Semi-bold 600, 0.6875rem / 11px, line-height 1.2, uppercase, letter-spacing 0.025em): Status tags, step wizard numbers, and meta information badges.

### Named Rules
**The Tabular Precision Rule.** Every numeric price and quantity display must use monospaced or tabular numeral features to guarantee vertical decimal alignment across multi-item receipt tables.

## Layout

The spatial model uses a single-column, centered stack with strict horizontal padding and clear vertical rhythm:
- **Containers:** Max-width 768px (`max-w-3xl`) for data-heavy steps (Review Items, Assign Participants); max-width 576px (`max-w-xl`) for focused steps (Upload); max-width 1024px (`max-w-5xl`) for the top navigation bar.
- **Rhythm:** Consistent 24px (`py-6`, `mb-6`) vertical spacing between major structural cards; 12px-16px (`gap-3` to `gap-4`) spacing within form and participant collections.
- **Grid Layout:** Receipt item tables use a 12-column responsive grid (6 columns for description, 2 for quantity, 3 for line total, 1 for action triggers).

## Elevation & Depth

Smart Split Bill is flat by default. It rejects layered drop shadows, blur backdrops, and artificial skeumorphic depth.

Structural elevation is achieved purely through:
1. **Tonal separation:** `#f8fafc` canvas background under `#ffffff` card surfaces.
2. **Hairline borders:** 1px solid borders in `#e2e8f0` delineate cards, table headers, and badges.
3. **Restrained shadow:** A single minimal ambient shadow (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`) grounds primary white containers without floating them above the page.

### Named Rules
**The Hairline Boundary Rule.** No floating cards with heavy elevation. If two surfaces touch or nest, separate them using a 1px `#e2e8f0` border, not a drop shadow.

## Shapes

- **Controls & Badges:** Rounded-md (6px / 0.375rem) for buttons, inputs, step markers, and chips.
- **Containers & Cards:** Rounded-xl (12px / 0.75rem) for content cards, data tables, and modal dialogs.
- **Icon Glyphs & Circular Indicators:** Rounded-full (9999px) for status dots and completed check badges.
- **Form Controls:** Clean square-proportioned checkboxes and quantity controls with minimal inner radius.

## Components

### Buttons
- **Shape:** Rounded-md (6px radius).
- **Primary:** Dark Slate background (`#0f172a`), white text (`#ffffff`), height 32px, padding 6px 14px, font-size 12px, font-weight 500. Hover transitions to `#1e293b`.
- **Secondary / Outline:** White background (`#ffffff`), text `#1e293b`, 1px border in `#e2e8f0` or `#cbd5e1`, hover:bg `#f8fafc`.
- **Ghost / Destructive:** Transparent background, text `#94a3b8`, hover:text `#e11d48`, hover:bg `#fff1f2`.

### Chips and Badges
- **Style:** Compact pill (padding 2px 8px), rounded-md (6px radius), 11px font size.
- **Neutral:** `#f8fafc` background, `#e2e8f0` border, `#475569` text.
- **State Tags:** Muted tint backgrounds with colored text (e.g. `#ecfdf5` background with `#059669` text for verified states).

### Cards and Containers
- **Corner Style:** Rounded-xl (12px radius).
- **Surface:** Pure white (`#ffffff`).
- **Border:** 1px solid `#e2e8f0`.
- **Shadow:** Restrained `shadow-2xs` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`).
- **Internal Padding:** 16px to 24px.

### Inputs and Fields
- **Style:** 1px solid `#cbd5e1` stroke, pure white background, rounded-md (6px radius), height 32px, text-xs (12px) font size.
- **Focus:** Sharp border shift to `#0f172a`, zero fuzzy outer glow.
- **Error:** `#e11d48` border stroke with `#fff1f2` background tint.

### Step Wizard Navigation
- **Four-step grid:** Connected sequence with numbers 1 to 4.
- **Current Step:** Active dark slate fill (`#0f172a`) with white label and inverted circular number.
- **Passed Step:** White card with `#cbd5e1` border, dark checkmark icon, and hoverable state.
- **Future Step:** Muted `#f8fafc` card with `#e2e8f0` border and disabled cursor.

## Do's and Don'ts

### Do:
- **Do** format every currency amount using Indonesian locale (`id-ID`) with `Rp` prefix and period thousand separators (e.g. `Rp 45.000`).
- **Do** ensure individual portion splits sum exactly to the bill total down to Rp 0 difference using the Largest Remainder algorithm.
- **Do** keep cards grounded with 1px `#e2e8f0` borders and white backgrounds over the `#f8fafc` canvas.
- **Do** allow inline manual editing for all OCR-extracted values (names, quantities, prices, taxes).

### Don't:
- **Don't** use saturated bright accent colors for primary button backgrounds or page banners.
- **Don't** use heavy blur backdrops or multi-layered floating drop shadows.
- **Don't** hide tax, service charge, or item discounts inside opaque calculations; itemize every deduction transparently.
- **Don't** introduce user authentication modals, account creation prompts, or persistent database forms.
