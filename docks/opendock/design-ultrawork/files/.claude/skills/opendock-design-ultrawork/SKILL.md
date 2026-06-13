---
name: opendock-design-ultrawork
description: Use when a workspace needs design and UI quality gates before final handoff.
---

# Design Ultrawork

Read `DESIGN.md`, run the OpenDock-managed harness, and apply the checklist before final handoff.

## Checklist

- Typography, colors, layout, components, imagery, and do/don't rules must follow `DESIGN.md`.
- Fractional values and negative tracking are allowed only when `DESIGN.md` explicitly documents them.
- No viewport-based font-size.
- Buttons, chips, tabs, and compact controls must not overflow text.
- Mobile viewport must not create horizontal scroll.
- Hover, focus, disabled, loading, empty, and error states must be represented.
- Color contrast must target WCAG AA and typography scale must stay restrained unless the contract is stricter.

## Command

```bash
node .opendock/harness/design/check.mjs
```
