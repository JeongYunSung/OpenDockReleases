# Figma Ultrawork

Figma MCP quality gate for Figma nodes, accessibility, interaction states, Auto Layout, and `DESIGN.md` alignment.

## Run Scope

Create `.opendock/runs/figma/<run-id>/manifest.md` from `.opendock/templates/figma/FIGMA_RUN.md`. The run manifest records the current node-specific Figma URL, node id, MCP evidence, findings, and review notes. The local harness checks that run record; actual canvas inspection still happens through official Figma MCP.

## What It Checks

- Reads `DESIGN.md` as the source of truth for typography, colors, layout, components, imagery, and do/don't rules.
- Reads a node-specific Figma URL through the official Figma MCP.
- Allows fractional values and negative tracking only when the design contract documents them.
- Blocks unmanaged colors, arbitrary font weights, unsupported radius choices, fractional bounds, text overflow, and brand-specific don't violations.
- Requires button/CTA state coverage and Auto Layout on component-like frames before handoff.

## Use

Copy a Figma URL that includes `node-id`, then ask your agent to run Figma Ultrawork on that node.

Use this dock when Figma work needs to prove it follows the project's `DESIGN.md` before handoff.
