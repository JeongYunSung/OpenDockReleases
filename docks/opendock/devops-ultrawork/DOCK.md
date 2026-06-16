# DevOps Ultrawork

DevOps quality gate for Terraform, Kubernetes, Helm, secrets, public exposure, image tags, resource limits, and runbooks.

## What It Checks

- Terraform must be fmt-checked and validated.
- Helm and Kubernetes manifests need lint/schema validation.
- Secret scan is mandatory before handoff.
- Public buckets, public security groups, and privileged containers require review.
- Image tags must not use latest.
- Rollback and runbook docs should exist for deployable changes.

Use this dock when the workspace needs a focused quality gate for DevOps and infrastructure quality gates.
