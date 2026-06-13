---
name: opendock-devops-ultrawork
description: Use when a workspace needs DevOps and infrastructure quality gates before final handoff.
---

# DevOps Ultrawork

Run the OpenDock-managed harness and apply the checklist before final handoff.

## Checklist

- Terraform must be fmt-checked and validated.
- Helm and Kubernetes manifests need lint/schema validation.
- Secret scan is mandatory before handoff.
- Public buckets, public security groups, and privileged containers require review.
- Image tags must not use latest.
- Rollback and runbook docs should exist for deployable changes.

## Command

```bash
node .opendock/harness/check.mjs
```
