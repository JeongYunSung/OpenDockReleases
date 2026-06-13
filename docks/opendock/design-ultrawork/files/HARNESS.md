# Design Ultrawork Harness

Design and UI quality gate for visual polish, accessibility, responsive layout, interaction states, and `DESIGN.md` alignment.

## Required Review

- Read `DESIGN.md` first. Treat it as the design contract for typography, color, layout, components, imagery, and do/don't rules.
- Font size, line-height, spacing, radius, letter-spacing, font weight, and color choices must match `DESIGN.md`.
- Fractional values and negative tracking are allowed only when `DESIGN.md` explicitly documents them.
- No viewport-based font-size.
- Buttons, chips, tabs, and compact controls must not overflow text.
- Mobile viewport must not create horizontal scroll.
- Hover, focus, disabled, loading, empty, and error states must be represented.
- Color contrast must target WCAG AA and typography scale must stay restrained unless the contract is stricter.
- Brand-specific don'ts in `DESIGN.md` are blockers, not suggestions.

## Commands

```bash
node .opendock/harness/design/check.mjs
sh .opendock/harness/design/check.sh
```

On Windows PowerShell:

```powershell
.opendock/harness/design/check.ps1
```

Treat failures as blockers unless a human owner documents the exception.
