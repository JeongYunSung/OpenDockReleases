# OpenDock Dock Repository

This repository is the source workspace for OpenDock catalog docks.

The catalog now keeps only focused Ultrawork quality gates. Each dock installs a small, domain-specific checklist, agent guidance, workflow adapters, hook metadata, and a runnable harness.

## Catalog

```text
docks/
  opendock/
        design-ultrawork/
        figma-ultrawork/
        creative-gen-ultrawork/
        frontend-ultrawork/
        backend-ultrawork/
        kotlin-spring-ultrawork/
        data-ultrawork/
        devops-ultrawork/
        docs-ultrawork/
        business-ultrawork/
        mobile-ultrawork/
        qa-ultrawork/
```

## Deploy

Use exact versions and platform-specific manifests:

```bash
opendock deploy opendock/design-ultrawork@1.0.0 --platform macos --file docks/opendock/design-ultrawork/dock.macos.yml
opendock deploy opendock/design-ultrawork@1.0.0 --platform windows --file docks/opendock/design-ultrawork/dock.windows.yml
```

Do not put release versions inside `dock.*.yml`; the deploy command owns the version.

## Review Rules

- Keep dock ids in `opendock/<domain>-ultrawork` form.
- Keep platform artifacts separate: `dock.macos.yml`, `dock.windows.yml`.
- Keep `DOCK.md` and `logo.png` next to the manifests.
- Keep generated agent files, workflows, commands, hooks, and harness files under `files/`.
- Deploy only from committed source whenever possible.
