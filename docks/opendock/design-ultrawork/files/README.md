# Design Ultrawork

Design and UI quality gate for visual polish, accessibility, responsive layout, interaction states, and `DESIGN.md` alignment.

## What It Checks

- Reads `DESIGN.md` as the source of truth for typography, colors, layout, components, imagery, and do/don't rules.
- Allows fractional values and negative tracking only when the design contract documents them.
- Blocks viewport-based font-size, unmanaged colors, arbitrary font weights, unsupported radius choices, and brand-specific don't violations.
- Buttons, chips, tabs, and compact controls must not overflow text.
- Mobile viewport must not create horizontal scroll.
- Hover, focus, disabled, loading, empty, and error states must be represented.
- Color contrast must target WCAG AA and typography scale must stay restrained unless `DESIGN.md` is stricter.

## Run

```bash
node .opendock/harness/design/check.mjs
```

Use this dock when implementation files need to prove they follow the project's `DESIGN.md`.
