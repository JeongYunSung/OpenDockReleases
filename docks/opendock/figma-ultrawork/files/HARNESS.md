# Figma Ultrawork Harness

Figma MCP quality gate for Figma nodes, accessibility, interaction states, Auto Layout, and `DESIGN.md` alignment.

## Required Review

- Read `DESIGN.md` first. Treat it as the design contract for typography, color, layout, components, imagery, and do/don't rules.
- Use the official Figma MCP to read the node-specific Figma URL provided by the user.
- Do not ask the user for separate Figma credentials or offline design exports.
- Font size, line-height, spacing, radius, letter-spacing, font weight, and color choices must match `DESIGN.md`.
- Fractional values and negative tracking are allowed only when `DESIGN.md` explicitly documents them.
- Text layers must not overflow their boxes.
- Frame bounds should be integer-aligned before handoff.
- Buttons, chips, tabs, inputs, and cards should use Auto Layout when they contain children.
- Button/CTA sets must include focus and disabled states.
- Brand-specific don'ts in `DESIGN.md` are blockers, not suggestions.

## MCP Review Flow

1. Read `DESIGN.md`.
2. Use the official Figma MCP to inspect the provided node URL.
3. Compare typography, colors, spacing, radius, layout, component states, and Auto Layout against `DESIGN.md`.
4. Fix violations directly through Figma MCP when edit access is available.
5. If Figma MCP is not connected or the URL lacks `node-id`, ask the user to connect Figma MCP and provide a node-specific Figma URL.
6. If Figma MCP reports that the file cannot be accessed, ask the user to share the file with the authenticated Figma account or switch Figma MCP authentication.
7. If edit access is not available, report exact node names, failing properties, expected values, and recommended fixes.

Treat unresolved violations as blockers unless a human owner documents the exception.
