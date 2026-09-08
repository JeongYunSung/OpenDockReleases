# Workflow

## Scope levels

- `small`: one existing component or copy adjustment, no new route and no product decision. Inspect, implement, add or update the affected Story, verify and finish.
- `standard`: a new component, screen or user flow with several states. Run all phases once with bounded revision.
- `complex`: multiple routes, new design-system decisions, a migration or unclear business behavior. Persist a brief and scenario set before implementation.

## Phase gates

1. **Inspect**: identify project instructions, package manager, framework, route, existing tokens/components/stories, Storybook version and available browser/MCP capabilities.
2. **Decide**: ask only questions whose answers change behavior, scope or irreversible design direction. Maximum three questions per round and three rounds. Stop when actor, outcome, scope, constraints and references are known. Record assumptions instead of looping.
3. **Specify**: write observable scenarios from `SCENARIOS.md`. For complex work, save the agreed brief and scenarios under a user-approved project documentation location.
4. **System**: preserve the existing system. If a system is missing or the user requests a redesign, use `omd` and `DESIGN_SYSTEM.md`; inspect a command's help before executing a mutating action.
5. **Build**: implement real behavior and state-complete components. Prefer existing libraries and project patterns.
6. **Story**: document component and screen states with Storybook. Use MCP when available, otherwise inspect source and run repository commands.
7. **Verify**: test behavior, accessibility, responsive layout and visual output. Apply at most three focused repair rounds to the same failing scope.
8. **Polish**: remove unsupported visual conventions and revise Korean user-facing copy without changing meaning.
9. **Handoff**: list changed files, covered scenarios, commands and evidence. Separate passed, failed and unavailable checks.

## Ownership order

User-approved requirements > existing product behavior > existing design system and Storybook contracts > accessibility and test evidence > new system proposals > visual-taste suggestions > copy suggestions.

Do not let a later phase silently rewrite an earlier approved decision. Return to the owning phase and make the conflict explicit.
