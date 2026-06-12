# Ultrawork Quality Gate

Use this workflow before final handoff.

1. Identify changed files, affected domains, and user-visible behavior.
2. Read `HARNESS.md` and map the change to the relevant gates.
3. Run `node .opendock/harness/check.mjs` when Node.js is available.
4. Run project-native commands that apply: formatter, lint, typecheck, test, build, Gradle, Terraform, docs, or smoke checks.
5. Fix root causes for every failure.
6. Document justified exceptions with path, reason, owner, and follow-up.
7. Summarize evidence: commands run, failures fixed, remaining risk.
