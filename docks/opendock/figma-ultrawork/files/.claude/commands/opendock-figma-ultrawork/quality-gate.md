# Figma Ultrawork Quality Gate

1. Read `DESIGN.md` and `HARNESS.md`.
2. Use the official Figma MCP to read the node-specific Figma URL provided by the user.
3. Review the canvas against the design contract and hard quality checklist.
4. Fix violations through Figma MCP when edit access is available.
5. Do not ask the user for separate Figma credentials or offline design exports.
6. If Figma MCP is not connected or the URL lacks `node-id`, ask the user to connect Figma MCP and provide a node-specific Figma URL.
7. If Figma MCP reports that the file cannot be accessed, ask the user to share the file with the authenticated Figma account or switch Figma MCP authentication.
8. If edit access is not available, report exact node names, failing properties, expected values, and recommended fixes.
9. Document any explicit human-approved exception.
10. Report what passed, what failed, and what was not tested.
