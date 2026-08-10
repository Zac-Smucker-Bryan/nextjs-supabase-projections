---
version: "alpha"
name: "Projections"
description: "A calm, structured financial-modeling workspace."
colors:
  primary: "hsl(0 0% 9%)"
  primary-foreground: "hsl(0 0% 98%)"
  background: "hsl(0 0% 100%)"
  foreground: "hsl(0 0% 3.9%)"
  muted: "hsl(0 0% 96.1%)"
  muted-foreground: "hsl(0 0% 45.1%)"
  border: "hsl(0 0% 89.8%)"
  destructive: "hsl(0 84.2% 60.2%)"
typography:
  display:
    fontFamily: Geist
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: 1.2
  heading:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.25
rounded:
  sm: 6px
  md: 8px
  lg: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.sm}"
    height: 36px
  card:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview

Projections should feel like an organized financial workbook, not a dense spreadsheet. The visual language is restrained, readable, and professional so the numbers, assumptions, and relationships remain the focus.

The product is aimed at someone building or reviewing a financial model: a founder, analyst, consultant, lender, or investor. It should communicate structure and confidence without looking overly corporate or decorative.

## Colors

Use high-contrast neutral colors as the foundation. The primary color is reserved for primary actions and key text. Muted surfaces distinguish navigation, secondary panels, metadata, and empty states without competing with model content.

Use destructive red only for irreversible actions, such as deleting a project or collection. Do not introduce a brand accent color until there is a deliberate visual-identity decision.

Dark mode uses the same semantic roles through the CSS variables in `app/globals.css`; do not hardcode light-mode colors in components.

## Typography

The application uses Geist. Keep page titles clear and compact, section headings practical, and supporting text subdued. Monetary figures, percentages, and other comparable values should use tabular numerals when displayed in lists or tables.

## Layout

Authenticated views use a persistent left sidebar and a flexible main content area. The sidebar organizes the workspace; it should not become a second content panel.

Use generous whitespace between sections. Prefer a simple one- or two-column layout over dense dashboards. Forms and settings belong in a constrained column. Empty states should explain the next useful action.

## Elevation & Depth

Cards use a subtle border and soft shadow. Use elevation sparingly: cards group related content, while active menus and dialogs may sit above surrounding content. Avoid heavy shadows and layered glass effects.

## Shapes

Use small rounded corners for controls and larger rounded corners for cards. Borders are quiet separators, not a primary design feature. Use dashed borders only for empty or setup states.

## Components

- **Sidebar navigation:** icon and label are a single selectable target. Keep labels short and task-oriented.
- **Buttons:** one primary action per local area. Secondary actions use outline or ghost styling.
- **Cards:** use for collections, projects, forms, and focused settings—not as decoration around every paragraph.
- **Badges:** identify project types and lightweight statuses. Do not use badges for long descriptions.
- **Tables/lists:** prioritize the model driver or item name first, followed by value, source/context, and metadata.

## Do's and Don'ts

Do make relationships understandable, provide context for assumptions, and show helpful empty states.

Do keep financial data visually scannable and avoid forcing people to decode color alone.

Don't imitate a spreadsheet grid for every screen.

Don't use bright color, charts, or animation unless they communicate a specific financial relationship or state.

Don't replace semantic Tailwind classes and the existing CSS variables with one-off hex colors.
