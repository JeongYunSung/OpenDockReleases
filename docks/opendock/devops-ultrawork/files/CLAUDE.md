# DevOps Ultrawork

This workspace uses DevOps Ultrawork as an OpenDock-managed quality gate.

## Before Handoff

1. Apply the checklist in `HARNESS.md`.
2. Run `node .opendock/harness/check.mjs` when Node is available.
3. Fix failures before claiming the work is done.
4. If a failure is intentionally accepted, document the owner and reason.

## Focus

- Terraform must be fmt-checked and validated.
- Helm and Kubernetes manifests need lint/schema validation.
- Secret scan is mandatory before handoff.
- Public buckets, public security groups, and privileged containers require review.
- Image tags must not use latest.
- Rollback and runbook docs should exist for deployable changes.
