# Design System Ownership

The existing project system is authoritative. Inspect `DESIGN.md`, theme files, CSS variables, component libraries and representative production screens before creating tokens.

Use the installed `omd` CLI when the project needs a new system, a documented extension or an explicitly requested migration. Check `omd --help` and the relevant subcommand help first because the CLI contract can differ by version. Do not overwrite an existing `DESIGN.md`, accept a generated system or migrate tokens without showing the impact and receiving authorization.

Every new visual decision should name its product reason and tradeoff. Tokens must trace to an approved decision; components consume semantic tokens rather than isolated literal values. Component contracts cover anatomy, allowed variants, states, keyboard behavior, accessibility relationships and content limits.

Avoid generic aesthetic defaults. Derive visual direction from audience, task frequency, information density, brand assets and references. Accessibility, regulated constraints and established product patterns override novelty.

Use one owner per concern:

- product brief owns outcomes and scope
- `DESIGN.md` and project tokens own visual decisions
- component source owns implementation
- Storybook owns documented component examples and states
- accepted visual baselines own regression expectations

Visual review may identify a problem but must change the owning source, not introduce a competing token or undocumented local override.
