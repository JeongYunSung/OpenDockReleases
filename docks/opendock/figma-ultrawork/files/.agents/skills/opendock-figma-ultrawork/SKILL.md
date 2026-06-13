---
name: opendock-figma-ultrawork
description: Use when a workspace needs Figma canvas quality gates before final handoff.
---

# Figma Ultrawork

Read `DESIGN.md`, inspect the Figma node through the official Figma MCP, and apply the checklist before final handoff.

## Checklist

- Typography, colors, layout, components, imagery, and do/don't rules must follow `DESIGN.md`.
- Fractional values and negative tracking are allowed only when `DESIGN.md` explicitly documents them.
- Use the official Figma MCP to inspect the node-specific Figma URL provided by the user.
- Do not ask the user for separate Figma credentials or offline design exports.
- Figma text layers must not overflow their boxes.
- Figma frames should be integer-aligned before handoff.
- Buttons/CTAs need focus and disabled state coverage.
- Component-like frames should use Auto Layout.

## Flow

1. Read `DESIGN.md`.
2. Use the official Figma MCP to inspect the provided node URL.
3. Fix violations through Figma MCP when edit access is available.
4. If Figma MCP is not connected or the URL lacks `node-id`, ask the user to connect Figma MCP and provide a node-specific Figma URL.
5. If Figma MCP reports that the file cannot be accessed, ask the user to share the file with the authenticated Figma account or switch Figma MCP authentication.
6. If edit access is not available, report exact node names, failing properties, expected values, and recommended fixes.
