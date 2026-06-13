# Design Ultrawork

This workspace uses Design Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Read `DESIGN.md` and treat it as the design contract.
2. Apply the checklist in `HARNESS.md`.
3. Run `node .opendock/harness/design/check.mjs` when Node is available.
4. Fix failures before claiming the work is done.
5. If a failure is intentionally accepted, document the owner and reason.

## Focus

- Typography, colors, layout, components, imagery, and do/don't rules must follow `DESIGN.md`.
- Fractional values and negative tracking are allowed only when `DESIGN.md` explicitly documents them.
- No viewport-based font-size.
- Buttons, chips, tabs, and compact controls must not overflow text.
- Mobile viewport must not create horizontal scroll.
- Hover, focus, disabled, loading, empty, and error states must be represented.
- Color contrast must target WCAG AA and typography scale must stay restrained unless the contract is stricter.
