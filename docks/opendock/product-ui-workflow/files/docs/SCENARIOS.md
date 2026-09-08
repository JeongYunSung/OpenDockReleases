# Independent Product Scenarios

Write scenarios from the current product evidence. Do not copy or fetch external user-story templates.

## Scenario contract

For each meaningful user outcome, record:

- `ID`, actor and context
- job to accomplish and user value
- preconditions and trigger
- primary flow
- alternative, cancellation and recovery flows
- default, loading, empty, error, success and disabled states that actually apply
- keyboard, screen-reader, narrow viewport and long-content behavior
- data boundaries, permissions and relevant performance constraints
- non-goals and unresolved assumptions

Write acceptance conditions as observable Given-When-Then statements. Do not prescribe a framework, hook or component unless it is itself a product constraint.

## INVEST review

Use INVEST as a diagnostic, not a numeric score. A scenario should be independently testable, negotiable in implementation, valuable to a named actor, estimable from known constraints, small enough for the current delivery slice and testable through observable outcomes. Split it by workflow step, role, business rule, data variation or happy path versus recovery when one condition fails.

## Required coverage

Cover the happy path and only the edge states relevant to the feature. Never manufacture empty, loading or error UI for a purely static component. For forms and remote data, explicitly cover validation, retry, duplicate action, slow response, no result and lost permission where applicable.

Every implemented Story and interaction test should identify the scenario or state it proves. A rendered static story does not prove a multi-step behavior.
