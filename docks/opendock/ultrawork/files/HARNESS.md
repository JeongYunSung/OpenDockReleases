# Ultrawork Harness

All-in-one quality gate for design, frontend, backend, Kotlin/Spring, data, DevOps, docs, product, marketing, mobile, security, and QA work.

## Definition Of Done

- Design/UI changes must pass typography, spacing, responsive layout, state, and accessibility checks.
- Frontend changes must pass formatter, lint, typecheck, test, build, accessibility, route smoke, and UI state expectations when applicable.
- Backend changes must pass formatter, lint, test, build, API contract, validation, migration, auth, logging, and readiness expectations when applicable.
- Kotlin/Spring changes must pass Gradle wrapper, ktlint, detekt, test, build, bootJar, config, DTO validation, transaction, and blocking-call checks when applicable.
- Data work must avoid destructive queries, SELECT *, ambiguous timezone/null handling, undocumented metrics, costly dashboards, and unmasked PII.
- DevOps/Infra work must pass Terraform/Kubernetes/Helm safety expectations, secret scan, no latest tags, resource limits, rollback, and runbook checks.
- Docs must stay linkable, current, language-tagged, command-accurate, quick-startable, and synchronized across translations.
- Product, founder, and marketing work must include measurable outcomes, acceptance criteria, GTM/ICP/pricing/channel/CTA/proof where relevant.
- Mobile work must review permissions, offline/error/loading states, dynamic text, platform lint/test, signing, and release readiness.
- Security and QA gates must block secrets, unsafe commands, auth gaps, injection risks, sensitive logs, skipped tests, missing repro notes, and weak release evidence.

## Automated Static Checks

- `trailing-whitespace`: Remove trailing whitespace.
- `tab-indentation`: Use spaces for indentation unless the project explicitly requires tabs.
- `decimal-font-size`: Decimal font-size is not allowed.
- `decimal-line-height`: Decimal line-height is not allowed.
- `decimal-radius`: Decimal border-radius is not allowed.
- `viewport-font-size`: Viewport-based font-size is not allowed.
- `negative-letter-spacing`: Negative letter-spacing is not allowed.
- `important-style`: Avoid !important.
- `large-z-index`: Large arbitrary z-index values need review.
- `large-radius`: Large radius values should be intentional.
- `console-log`: console.log must not remain.
- `debugger`: debugger statement must not remain.
- `explicit-any`: any usage needs review or replacement.
- `href-hash`: Avoid href="#" placeholders.
- `img-without-alt`: Images need alt text.
- `button-without-type`: Buttons should declare type.
- `hardcoded-secret`: Hardcoded secret-like value.
- `log-sensitive-data`: Logs should not include sensitive data.
- `sql-concat`: SQL string concatenation needs injection review.
- `dangerous-shell`: Dangerous shell command needs review.
- `application-secret`: Application config appears to contain a literal secret.
- `blocking-in-coroutine`: runBlocking requires review in production paths.
- `missing-validation-import`: Controller request bodies should use validation where appropriate.
- `select-star`: Avoid SELECT * without justification.
- `destructive-sql`: Destructive SQL requires review.
- `pii-column`: PII fields require masking/access review.
- `latest-image-tag`: Avoid latest image tags in deployable infrastructure.
- `public-cidr`: Public network exposure requires review.
- `privileged-container`: Privileged containers require review.
- `missing-k8s-resource-limits`: Kubernetes deployments should define resource requests/limits.
- `empty-code-fence-language`: Code fences should declare a language when practical.
- `stale-registry-url`: Use registry.opendock.app for API/registry references.
- `versionless-install`: Install examples should include @version.
- `unsupported-superlative`: Strong claims need proof.
- `missing-cta-copy`: Conversion copy should include a CTA.
- `permission-without-rationale`: Permission usage needs user-facing rationale.
- `flutter-print`: print() should not remain in production Dart code.
- `test-only-or-skip`: Committed tests must not use .only or .skip.

## Project Command Expectations

- If `package.json` exists: `format`, `lint`, `typecheck`, `test`, and `build` scripts are expected.
- If Gradle files exist: `gradlew`, `ktlintCheck`, `detekt`, `test`, `build`, and `bootJar` are expected.
- External tools such as markdownlint, Playwright, Lighthouse, Terraform, tflint, checkov, tfsec, helm, kubeconform, and secret scanners should be wired into project scripts or CI when relevant.

## Run

```bash
node .opendock/harness/check.mjs
```

macOS/Linux:

```bash
sh .opendock/harness/check.sh
```

Windows PowerShell:

```powershell
.opendock/harness/check.ps1
```
