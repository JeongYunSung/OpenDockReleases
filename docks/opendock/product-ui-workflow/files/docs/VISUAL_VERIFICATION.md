# Visual Verification

Reference matching and regression testing answer different questions.

## Reference matching

Compare a Figma frame or supplied image with the same implemented route, state, viewport, font readiness and content. Capture with an available authorized browser tool. Stabilize dates, random data, animation and network responses. Inspect layout, typography, color, assets and responsive behavior; a single pixel percentage is supporting evidence, not a design verdict.

## Regression testing

Compare current stories with a previously human-approved baseline. Storybook's official visual-test path uses Chromatic and sends stories to its cloud. Require explicit authorization, an externally supplied project token and a human decision for new baselines. Never print, write into source or package that token.

Without Chromatic, use the project's existing local screenshot framework if present. Do not silently install browser binaries or a new test service. If no comparison capability exists, capture what is possible and mark regression as unverified.

## Checkpoints and bounds

Capture after a component state is complete, after screen composition and after the final focused repair. Do not recapture on every file save. Test the agreed desktop and mobile viewports plus narrow content stress where relevant.

Apply no more than three focused repair rounds to the same visual defect. Stop when required inputs are unavailable, the difference is an unresolved product decision or fixing it would regress an already passing behavior. Report the evidence and owner decision needed.

Passing requires zero unexplained interaction failures, no serious known accessibility regression and no unapproved visual difference in the tested scope. Skipped checks are unavailable, never passing.
