# Storybook Integration

## Detect first

Inspect the package manager, Storybook packages, `.storybook/`, story patterns and existing scripts. Preserve the installed major version and framework adapter. If Storybook is absent, explain the exact files and dependencies the setup will change and obtain authorization before running an initializer.

Storybook AI and MCP capabilities are preview features. Detect tools instead of assuming names. When an available server exposes component documentation, inspect the component list and documented props before composing UI. Never invent a prop from memory. If the docs toolset is unavailable, use source, types and existing stories as evidence.

Adding `@storybook/addon-mcp`, enabling component manifests or writing project MCP settings requires explicit permission. Configure a project-local server URL for the actual Storybook port; do not hard-code credentials or a global client configuration.

## Story contract

Create stories for meaningful states, not arbitrary prop permutations. Include default and every applicable loading, empty, error, success, disabled, focus-visible, narrow viewport and long-content case. Use deterministic data, dates and animation settings. Multi-step outcomes need play-function assertions or existing test helpers.

Build screens by composing documented production components. Do not create a parallel component library only for stories. Stories must import the production implementation.

Run the repository's supported Storybook build and test commands. Use MCP `test-run` or equivalent only when the live server and tools are available. Report interaction and accessibility results separately from visual regression.
