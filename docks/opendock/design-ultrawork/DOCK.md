# Design Ultrawork

Design and UI quality gate for visual polish, accessibility, responsive layout, interaction states, and `DESIGN.md` alignment.

## StyleSeed Loop

For UI work, read https://styleseed-demo.vercel.app/llms-full.txt and apply StyleSeed alongside `DESIGN.md`.

Reusable instruction:

```text
Read https://styleseed-demo.vercel.app/llms-full.txt and apply StyleSeed's design rules to every UI in this project. First, in plan mode, lock my key color and motion style with me — then build to the rules and self-check coherence (one accent, one radius) after.
```

Before building, lock or update `STYLESEED.md` with the user: app type, key color/accent, radius personality, shadow language, motion style, type direction, and density.

## Run Scope

Create `.opendock/runs/design/<run-id>/manifest.md` from `.opendock/templates/design/DESIGN_RUN.md` and list only the files created or changed for the current task. The harness validates those target files only. It does not scan the whole project by default.

## What It Checks

- Reads `DESIGN.md` as the source of truth for typography, colors, layout, components, imagery, and do/don't rules.
- Adds StyleSeed coherence: one accent, one radius personality, one shadow language, one icon set, semantic tokens over hardcoded hex, visible focus rings, and touch targets at least 44px.
- Allows fractional values and negative tracking only when the design contract documents them.
- Blocks viewport-based font-size, unmanaged colors, arbitrary font weights, unsupported radius choices, pure black, emoji-as-icons, Tailwind `text-[var(...)]` font-size patterns, and brand-specific don't violations.
- Buttons, chips, tabs, and compact controls must not overflow text.
- Mobile viewport must not create horizontal scroll.
- Hover, focus, disabled, loading, empty, and error states must be represented.
- Color contrast must target WCAG AA and typography scale must stay restrained unless `DESIGN.md` is stricter.

Use this dock when implementation files need to prove they follow the project's `DESIGN.md`.
