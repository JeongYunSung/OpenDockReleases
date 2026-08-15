import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import {
  assertProductDesignerOutput,
  assertProductDesignerResumeCompatibility,
  assertProductDesignerSessionCore,
} from "./workspace-collection.codex-acceptance.ts";

const root = join(import.meta.dir, "..");
const template = readFileSync(
  join(
    root,
    "docks/opendock/product-designer/files/.opendock/templates/product-designer/DESIGN_SESSION.md",
  ),
  "utf8",
);

const canonicalAccessAndData =
  "create/write; SCENARIO.md non-sensitive product-design metadata and text prototype";

function templatePayload(): string {
  const lines = template.split(/\r?\n/);
  const first = lines.findIndex((line) => line.trim().length > 0);
  let last = lines.length - 1;
  while (last >= 0 && lines[last].trim().length === 0) last--;
  const hasStart = /^<!-- OPENDOCK:START\b/.test(lines[first]?.trim() ?? "");
  const hasEnd = /^<!-- OPENDOCK:END\b/.test(lines[last]?.trim() ?? "");
  if (hasStart !== hasEnd) {
    throw new Error("template has an incomplete OpenDock managed envelope");
  }
  return (
    hasStart ? lines.slice(first + 1, last) : lines.slice(first, last + 1)
  ).join("\n");
}

function table(
  markdown: string,
  heading: string,
  rows: readonly string[],
): string {
  const start = markdown.indexOf(heading);
  const next = markdown.indexOf("\n# ", start + heading.length);
  const section = markdown.slice(start, next < 0 ? undefined : next);
  const lines = section.split(/\r?\n/);
  const separator = lines.findIndex((line) =>
    /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(line),
  );
  if (start < 0 || separator < 1)
    throw new Error(`table not found: ${heading}`);
  let rowEnd = separator + 1;
  while (rowEnd < lines.length && /^\|.*\|$/.test(lines[rowEnd])) rowEnd++;
  const replacement = [
    ...lines.slice(0, separator + 1),
    ...rows,
    ...lines.slice(rowEnd),
  ].join("\n");
  return `${markdown.slice(0, start)}${replacement}${next < 0 ? "" : markdown.slice(next)}`;
}

function frontMatter(markdown: string): Record<string, unknown> {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error("front matter missing");
  return YAML.parse(match[1]);
}

function setFront(markdown: string, values: Record<string, unknown>): string {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error("front matter missing");
  return markdown.replace(
    match[0],
    `---\n${YAML.stringify({ ...frontMatter(markdown), ...values }).trimEnd()}\n---\n`,
  );
}

function tableRows(markdown: string, heading: string): string[][] {
  const start = markdown.indexOf(heading);
  const next = markdown.indexOf("\n# ", start + heading.length);
  const section = markdown.slice(start, next < 0 ? undefined : next);
  const lines = section.split(/\r?\n/);
  const separator = lines.findIndex((line) =>
    /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(line),
  );
  if (start < 0 || separator < 1)
    throw new Error(`table not found: ${heading}`);
  const rows: string[][] = [];
  for (
    let index = separator + 1;
    index < lines.length && /^\|.*\|$/.test(lines[index]);
    index++
  ) {
    rows.push(
      lines[index]
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    );
  }
  return rows;
}

function formatRow(row: readonly string[]): string {
  return `| ${row.join(" | ")} |`;
}

function mapTableRows(
  markdown: string,
  heading: string,
  mapper: (row: string[]) => string[],
): string {
  return table(
    markdown,
    heading,
    tableRows(markdown, heading).map(mapper).map(formatRow),
  );
}

function setTableCell(
  markdown: string,
  heading: string,
  subjectColumn: number,
  subject: string,
  valueColumn: number,
  value: string,
): string {
  let found = false;
  const result = mapTableRows(markdown, heading, (row) => {
    if (!found && row[subjectColumn] === subject) {
      found = true;
      row[valueColumn] = value;
    }
    return row;
  });
  if (!found)
    throw new Error(`table subject not found: ${heading} / ${subject}`);
  return result;
}

function appendBeforeHeading(
  markdown: string,
  heading: string,
  content: string,
): string {
  const marker = `\n${heading}\n`;
  if (!markdown.includes(marker))
    throw new Error(`heading not found: ${heading}`);
  return markdown.replace(marker, `\n${content.trimEnd()}\n\n${heading}\n`);
}

function approvalRow(
  eventId: string,
  status: string,
  supersedes: string,
  overrides: Partial<{
    resource: string;
    subjectRevision: string;
  }> = {},
): string {
  return formatRow([
    eventId,
    "1",
    "2026-08-13T00:00:00.000Z",
    "AP-ACCEPT-001",
    "capability",
    "create_or_update_checkpoint",
    overrides.resource ??
      ".opendock/runs/product-designer/acceptance/SESSION.md",
    "write non-sensitive design metadata",
    overrides.subjectRevision ?? "fixture revision",
    "single_use for this response",
    status,
    "current user",
    supersedes,
  ]);
}

function withAdditionalApprovalEvent(session: string, row: string): string {
  let result = table(session, "# Approval Log", [
    ...tableRows(session, "# Approval Log").map(formatRow),
    row,
  ]);
  result = table(result, "# Change Log", [
    "| evt-00000001-0099 | 1 | 2026-08-13T00:00:00.000Z | Product Designer | Created validated checkpoint | Acceptance fixture | fixture revision |",
  ]);
  return setFront(result, { last_event_id: "evt-00000001-0099" });
}

function replaceChangeEvent(
  session: string,
  eventId: string,
  occurredAt = "2026-08-13T00:00:00.000Z",
): string {
  const result = table(session, "# Change Log", [
    `| ${eventId} | 1 | ${occurredAt} | Product Designer | Created validated checkpoint | Acceptance fixture | fixture revision |`,
  ]);
  return setFront(result, { last_event_id: eventId, updated_at: occurredAt });
}

function replaceApprovalScope(
  session: string,
  column: number,
  value: string,
): string {
  return mapTableRows(session, "# Approval Log", (row) => {
    row[column] = value;
    return row;
  });
}

function strictAcceptanceContext(scenarioSha256: string) {
  return {
    scenarioSha256,
    sessionId: "acceptance",
    sessionPath: ".opendock/runs/product-designer/acceptance/SESSION.md",
    accessAndData: canonicalAccessAndData,
    humanApprover: "current user",
    requireStateChangingAction: true,
    requireUnprovenOutcomeAcceptance: true,
    unprovenOutcomeTokens: ["30"],
    requireConfirmedTerminalSuccess: true,
    requireAccessibilityContract: true,
    workflowSha256: "a".repeat(64),
    protocolSha256: "a".repeat(64),
    skillSha256: "a".repeat(64),
  };
}

function strictBoundSession(scenarioSha256: string): string {
  return mapTableRows(validSession(), "# Approval Log", (row) => {
    row[7] = canonicalAccessAndData;
    row[8] = `SCENARIO.md SHA-256 ${scenarioSha256}`;
    row[9] = "single_use";
    return row;
  });
}

function relocateStateTableAfterResponsiveHeading(session: string): string {
  const rows = tableRows(session, "## State Matrix").map(formatRow).join("\n");
  const withoutRows = table(session, "## State Matrix", []);
  return withoutRows.replace(
    "## Responsive and Accessibility\n\n390px and 1440px, keyboard and WCAG AA.",
    `## Responsive and Accessibility\n\n390px and 1440px, keyboard and WCAG AA.\n\n${rows}`,
  );
}

function validSession(): string {
  const now = "2026-08-13T00:00:00.000Z";
  let session = templatePayload();
  const values = frontMatter(session);
  for (const key of ["workflow_sha256", "protocol_sha256", "skill_sha256"]) {
    values[key] = "a".repeat(64);
  }
  Object.assign(values, {
    session_id: "acceptance",
    session_path: ".opendock/runs/product-designer/acceptance/SESSION.md",
    checkpoint_revision: 1,
    status: "paused",
    current_stage: "HANDOFF",
    current_gate: "G6",
    gate_state: "waiting_approval",
    last_passed_gate: "G5",
    last_event_id: "evt-00000001-0007",
    checkpoint_write_approval_id: "AP-ACCEPT-001",
    created_at: now,
    updated_at: now,
  });
  session = setFront(session, values);
  session = session.replace(
    "- One-line goal:\n",
    "- One-line goal: Retry flow design\n",
  );
  session = session.replace(
    "- User approval: pending\n",
    "- User approval: status=approved_in_request; evidence=EVD-001; subject_revision=fixture-revision\n",
  );
  session = session.replace("- Source:\n", "- Source: fixture\n");
  session = session.replace(
    "- Target surface:\n",
    "- Target surface: failed transactions\n",
  );
  session = session.replace(
    "- Approved write scope: none\n",
    "- Approved write scope: session path\n",
  );
  for (const [field, value] of [
    ["Problem", "Slow failed-transaction retry"],
    ["Primary user", "Settlement operator"],
    ["Core task or job to be done", "Review and escalate retry"],
    ["Desired outcome", "30 percent faster handling"],
    ["Business objective", "Reduce support handling cost"],
    [
      "Stakeholders and operational impact",
      "Settlement operations and support",
    ],
    ["In scope", "List, detail, retry"],
    ["Out of scope", "Payment method changes"],
    ["Later or unknown", "ACC-004 timing evidence"],
    ["Hard constraints", "Supervisor-only retry"],
    ["Success evidence", "ACC-001 through ACC-003"],
  ] as const) {
    session = session.replace(`- ${field}:\n`, `- ${field}: ${value}\n`);
  }
  session = session.replace(
    "## Direction A\n\n",
    "## Direction A\n\nState-first inbox.\n\n",
  );
  session = session.replace(
    "## Direction B\n\n",
    "## Direction B\n\nTransaction table.\n\n",
  );
  session = session.replace("- Selection:\n", "- Selection: Direction A\n");
  session = session.replace("- Approval:\n", "- Approval: approved\n");
  session = session.replace(
    "- Single direction reason, if applicable:\n",
    "- Single direction reason, if applicable: not_applicable(reason=two directions compared)\n",
  );
  session = session.replace(
    "## Flow\n\n",
    "## Flow\n\nList to detail to supervisor retry.\n\n",
  );
  session = table(session, "## Flow", [
    "| ACT-RETRY | state_change | actor=Supervisor; eligibility=has retry permission | transaction status is failed | submission_scope=one_intent; duplicate_policy=reject repeated submission for the same transaction; target_identity=binding:transaction.id | in_progress_control=disabled; feedback=show retrying status for the selected transaction | terminal_success_when=transaction.status changes to succeeded for the same transaction.id; record an audit timestamp | Show retry failure, preserve context, and allow recovery by retry | transition=failed -> retrying -> succeeded or failed | ACC-001, ACC-002 |",
    "| ACT-RETURN | navigation | actor=Operator; eligibility=lacks retry permission; route_kind=permission; permission_for=ACT-RETRY | transaction detail is open | not_applicable(reason=navigation has no mutation submission) | preserve selected transaction context while returning | failed transaction inbox is visible | Show route unavailable and preserve detail context | transition=permission-blocked -> navigating -> inbox-visible or route-failed | ACC-002 |",
  ]);
  session = session.replace(
    "## Content and Information Hierarchy\n\n",
    "## Content and Information Hierarchy\n\nState, reason, action.\n\n",
  );
  session = session.replace(
    "## Responsive and Accessibility\n\n",
    "## Responsive and Accessibility\n\n390px and 1440px, keyboard and WCAG AA.\n\n",
  );
  session = session.replace(
    "## Content and Data Contract\n\n",
    "## Content and Data Contract\n\nbinding:transaction.amount and view-only fallback.\n\n",
  );
  session = table(session, "## Content and Data Contract", [
    "| DATA-RETRY | action:ACT-RETRY; binding:transaction.id; binding:transaction.status | yes | SCENARIO.md state model / assumed RetryCommand interface | read when detail opens; refresh after terminal response | Operator and Supervisor | Supervisor with retry permission | null_means=transaction identity or status is absent, null, or unrecognized so retry eligibility cannot be confirmed | Show unavailable status, keep retry disabled, and route to refresh | design_interface_assumption | Product Designer | validation_point=before:implementation-start; expected_evidence=versioned RetryCommand interface contract |",
    "| DATA-RETURN | action:ACT-RETURN | yes | assumed failed-inbox navigation interface | read when detail opens; refresh after navigation | Operator | navigation runtime | null_means=return route is absent or unrecognized so navigation cannot start | Keep detail visible and show route unavailable | design_interface_assumption | Product Designer | validation_point=before:implementation-start; expected_evidence=versioned failed-inbox navigation contract |",
  ]);
  session = session.replace(
    "## Design System and Implementation Constraints\n\n",
    "## Design System and Implementation Constraints\n\n4px spacing, 6px radius.\n\n",
  );
  session = table(session, "# Design Contract Scope Map", [
    "| session:temporary | current task | fixture-revision | current |",
  ]);
  session = table(session, "# Evidence Register", [
    "| EVD-001 | user_request | SCENARIO.md | fixture-revision | Operators need a permission-safe retry flow | AMB-001, DEC-001 | current |",
  ]);
  session = table(session, "# Shared Vocabulary and Relationships", [
    "| role-operator | role | Operator | Daily settlement operator | none | performs retry review | fixture | resolved |",
  ]);
  session = table(session, "# Ambiguity Ledger", [
    `| evt-00000001-0001 | 1 | ${now} | AMB-001 | outcome | missing_evidence | 30 percent outcome needs future evidence | deferred | material | fixture | high | owner=product; resolve_before=post-implementation | none |`,
  ]);
  session = table(session, "# Decision Log", [
    `| evt-00000001-0002 | 1 | ${now} | DEC-001 | approved | State-first direction | Supports triage | Transaction table | approved at fixture revision | session artifact | none |`,
  ]);
  session = table(session, "# Approval Log", [
    `| evt-00000001-0003 | 1 | ${now} | AP-ACCEPT-001 | capability | create_or_update_checkpoint | .opendock/runs/product-designer/acceptance/SESSION.md | write non-sensitive design metadata | fixture revision | single_use for this response | approved | current user | none |`,
    `| evt-00000001-0004 | 1 | ${now} | AP-ACCEPT-001 | capability | create_or_update_checkpoint | .opendock/runs/product-designer/acceptance/SESSION.md | write non-sensitive design metadata | fixture revision | single_use for this response | consumed | current user | evt-00000001-0003 |`,
  ]);
  session = table(session, "## State Matrix", [
    "| default | yes | Operator sees failed transactions and opens detail | fixture evidence |",
    "| loading | yes | Operator sees skeleton rows and no mutation action | fixture evidence |",
    "| empty | yes | Operator sees no failed transactions and the refresh path | fixture evidence |",
    "| error | yes | Supervisor sees the request failure without losing context | fixture evidence |",
    "| permission | yes | actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=not_rendered; denial=retry is not permitted for Operator; next_route_action=ACT-RETURN | fixture evidence |",
    "| disabled | yes | actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; denial=not_applicable(reason=role authorized); re_enable_when=transaction status returns to failed; next_route_action=ACT-RETURN | fixture evidence |",
    "| success | yes | terminal_success_when=transaction.status changes to succeeded for the same transaction.id; then Operator sees success and an audit timestamp | fixture evidence |",
    "| recovery | yes | Supervisor retries after error with focus and selection preserved | fixture evidence |",
  ]);
  session = table(session, "# Acceptance Contract", [
    "| ACC-001 | ACT-RETRY primary flow is specified | yes | design review | ACT-RETRY covers one submission, progress, success, failure and recovery | Structure | not_applicable(reason=design review) | Product Designer | not_applicable(reason=no participants) |",
    "| ACC-002 | ACT-RETRY permission is supervisor-only | yes | design review | ACT-RETRY exposes no unauthorized action | Structure | not_applicable(reason=design review) | Product Designer | not_applicable(reason=no participants) |",
    "| ACC-003 | Responsive states are covered | yes | design review | eight states and two viewports | Structure | not_applicable(reason=design review) | Product Designer | not_applicable(reason=no participants) |",
    "| ACC-004 | Handling time decreases by 30 percent | no | future measurement | measured decrease at least 30 percent | Evidence-backed | settlement operators | Product team | consent required |",
    "| ACC-005 | Keyboard and post-action focus behavior is specified | yes | claim_kind=accessibility_structure; checks=keyboard_path,focus_after | keyboard_path and focus_after contracts cover the state-changing control | Structure | not_applicable(reason=design review) | Product Designer | not_applicable(reason=no participants) |",
    "| ACC-006 | WCAG AA conformance is verified on the rendered flow | no | claim_kind=wcag_conformance; audit=manual_and_automated_rendered | rendered full-page and complete-process WCAG AA audit passes | Interactive | target keyboard and assistive technology users | Accessibility reviewer | consent required for research participants |",
  ]);
  session = table(session, "# Prototype", [
    "| text prototype | SESSION.md#prototype | fixture-revision | Structure | action=ACT-RETRY; acceptance_set=ACC-001,ACC-002; claim=permission-safe retry state change. ACC-003 and ACC-005 cover responsive and accessibility structure. terminal_success_when=transaction.status changes to succeeded for the same transaction.id | no live data, outcome, or conformance evidence | current |",
  ]);
  session = session.replace(
    "## Prototype Detail\n",
    "## Prototype Detail\n\nactor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=enabled; enabled_when=transaction status is failed.\nactor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; re_enable_when=transaction status returns to failed.\nactor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=not_rendered; denial=retry is not permitted; permission_route_action=ACT-RETURN.\nACT-RETRY success: terminal_success_when=transaction.status changes to succeeded for the same transaction.id; then remove the item.\nacceptance=ACC-005; keyboard_path=target:failed-inbox -> action:ACT-RETRY -> target:retry-status; evidence=SESSION.md#prototype@fixture-revision\nacceptance=ACC-005; focus_after_action=ACT-RETRY; outcome=success; target=target:retry-success; evidence=SESSION.md#prototype@fixture-revision\nacceptance=ACC-005; focus_after_action=ACT-RETRY; outcome=failure; target=target:retry-error; evidence=SESSION.md#prototype@fixture-revision\n",
  );
  session = table(session, "# Validation Log", [
    `| evt-00000001-0005 | 1 | ${now} | ACC-001 | yes | fixture-revision | design review | pass | flow evidence | none | none |`,
    `| evt-00000001-0006 | 1 | ${now} | ACC-002 | yes | fixture-revision | design review | pass | permission evidence | none | none |`,
    `| evt-00000001-0007 | 1 | ${now} | ACC-003 | yes | fixture-revision | design review | pass | state evidence | none | none |`,
    `| evt-00000001-0008 | 1 | ${now} | ACC-004 | no | fixture-revision | future measurement | needs_review | no outcome evidence | owner=Product team; validation_point=after implementation during post-implementation timing study | none |`,
    `| evt-00000001-0009 | 1 | ${now} | ACC-005 | yes | fixture-revision | claim_kind=accessibility_structure; checks=keyboard_path,focus_after | pass | SESSION.md#prototype@fixture-revision | none | none |`,
    `| evt-00000001-0010 | 1 | ${now} | ACC-006 | no | fixture-revision | claim_kind=wcag_conformance; audit=manual_and_automated_rendered | needs_review | none | owner=Accessibility reviewer; validation_point=before:rendered-accessibility-audit; expected_evidence=manual and automated rendered audit | none |`,
  ]);
  session = session.replace(
    "- Open risk and approved exception references:\n",
    "- Open risk and approved exception references: outcome=ACC-004; status=needs_review; proof=unproven; owner=Product team; validation_point=before:outcome-measurement; expected_evidence=real operator timing study. acceptance=ACC-006; status=needs_review; proof=unproven; owner=Accessibility reviewer; validation_point=before:rendered-accessibility-audit; expected_evidence=manual and automated rendered audit. DATA-RETRY is unproven until validation_point=before:implementation-start; expected_evidence=versioned RetryCommand interface contract. DATA-RETURN is unproven until validation_point=before:implementation-start; expected_evidence=versioned failed-inbox navigation contract.\n",
  );
  session = session.replace(
    "- Approved section and decision revisions:\n",
    "- Approved section and decision revisions: fixture-revision\n",
  );
  session = session.replace(
    "- Artifact references:\n",
    "- Artifact references: SESSION.md#prototype\n",
  );
  session = session.replace(
    "- Acceptance and evidence references:\n",
    "- Acceptance and evidence references: ACC-001 through ACC-004\n",
  );
  session = session.replace(
    "- Implementation boundary:\n",
    "- Implementation boundary: design-only\n",
  );
  session = session.replace(
    "- Product Designer revalidation: pending\n",
    "- Product Designer revalidation: not_applicable(reason=design-only handoff)\n",
  );
  session = session.replace(
    "- Next action:\n",
    "- Next action: approve handoff\n",
  );
  session = session.replace(
    "- Blockers:\n",
    "- Blockers: BLK-G6-001; blocks=G6; evidence=checkpoint 1 lacks design delivery approval and Product Designer revalidation; owner=current user; unblock=approve the design delivery or request changes\n",
  );
  session = session.replace(
    "- Stale artifacts:\n",
    "- Stale artifacts: none\n",
  );
  session = table(session, "# Change Log", [
    `| evt-00000001-0011 | 1 | ${now} | Product Designer | Created validated checkpoint | Acceptance fixture | fixture revision |`,
  ]);
  session = setFront(session, { last_event_id: "evt-00000001-0011" });
  return session;
}

function withRequiredApprovedException(): string {
  const now = "2026-08-13T00:00:00.000Z";
  let session = table(validSession(), "# Approval Log", [
    ...tableRows(validSession(), "# Approval Log").map(formatRow),
    `| evt-00000001-0020 | 1 | ${now} | AP-EXC-001 | design | approve_acceptance_exception | acceptance:ACC-001 | scope=prototype omits live retry; risk=supervisor uses the audited manual fallback | fixture-revision | expires_on=implementation revalidation | approved | current user | none |`,
  ]);
  session = table(session, "# Validation Log", [
    ...tableRows(session, "# Validation Log").map(formatRow),
    `| evt-00000001-0021 | 1 | ${now} | ACC-001 | yes | fixture-revision | design exception review | approved_exception | approval=AP-EXC-001@evt-00000001-0020; subject_revision=fixture-revision | scope=prototype omits live retry; risk=supervisor uses the audited manual fallback; expiry=implementation revalidation; owner=Product Designer | evt-00000001-0005 |`,
  ]);
  session = table(session, "# Change Log", [
    `| evt-00000001-0022 | 1 | ${now} | Product Designer | Recorded approved acceptance exception | ACC-001 | fixture-revision |`,
  ]);
  session = session.replace(
    "- Open risk and approved exception references: outcome=ACC-004; status=needs_review; proof=unproven; owner=Product team; validation_point=before:outcome-measurement; expected_evidence=real operator timing study.",
    "- Open risk and approved exception references: ACC-001 approved_exception via AP-EXC-001; outcome=ACC-004; status=needs_review; proof=unproven; owner=Product team; validation_point=before:outcome-measurement; expected_evidence=real operator timing study.",
  );
  return setFront(session, { last_event_id: "evt-00000001-0022" });
}

function appendExceptionApprovalHead(
  session: string,
  status: "stale" | "revoked",
): string {
  const current = tableRows(session, "# Approval Log").find(
    (row) => row[3] === "AP-EXC-001",
  );
  if (!current) throw new Error("exception approval fixture missing");
  const next = [...current];
  next[0] = "evt-00000001-0023";
  next[10] = status;
  next[12] = "evt-00000001-0020";
  let result = table(session, "# Approval Log", [
    ...tableRows(session, "# Approval Log").map(formatRow),
    formatRow(next),
  ]);
  result = table(result, "# Change Log", [
    `| evt-00000001-0024 | 1 | 2026-08-13T00:00:00.000Z | Product Designer | Invalidated acceptance exception | ACC-001 | fixture-revision |`,
  ]);
  return setFront(result, { last_event_id: "evt-00000001-0024" });
}

function expectFailure(session: string, pattern: RegExp): void {
  expect(() => assertProductDesignerOutput(session, template)).toThrow(pattern);
}

function expectCoreFailure(session: string, pattern: RegExp): void {
  expect(() => assertProductDesignerSessionCore(session, template)).toThrow(
    pattern,
  );
}

describe("Product Designer actual acceptance parser", () => {
  test("valid exact-template SESSION passes", () => {
    expect(() =>
      assertProductDesignerOutput(validSession(), template),
    ).not.toThrow();
  });

  test("a render-time freshness rule is bounded", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      4,
      "read at detail render time and retain for one retry intent",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("a policy-change freshness boundary is bounded", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETURN",
      4,
      "assumed static guidance until role or policy changes",
    );

    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("a visible-state freshness boundary is bounded", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETURN",
      4,
      "assumed static route available whenever a failed item is visible",
    );

    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("G1 current-request approval accepts a verified SCENARIO.md file evidence", () => {
    const session = setTableCell(
      validSession(),
      "# Evidence Register",
      0,
      "EVD-001",
      1,
      "file",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("G1 current-request approval accepts multiple resolved fact evidence rows", () => {
    let session = validSession().replace(
      "status=approved_in_request; evidence=EVD-001; subject_revision=fixture-revision",
      "status=approved_in_request; evidence=EVD-001,EVD-002; subject_revision=fixture-revision",
    );
    session = table(session, "# Evidence Register", [
      "| EVD-001 | scenario_doc | SCENARIO.md | fixture-revision | Operators need a permission-safe retry flow | AMB-001, DEC-001 | fact |",
      "| EVD-002 | user_request | current turn request | fixture-revision | The current request approves the bounded Goal and Frame | DEC-001 | fact |",
    ]);

    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("G1 current_request evidence explicitly approving Goal and Frame passes", () => {
    let session = setTableCell(
      validSession(),
      "# Evidence Register",
      0,
      "EVD-001",
      1,
      "current_request",
    );
    session = setTableCell(
      session,
      "# Evidence Register",
      0,
      "EVD-001",
      2,
      "user message in this turn",
    );
    session = setTableCell(
      session,
      "# Evidence Register",
      0,
      "EVD-001",
      4,
      "The current request approves the bounded Goal, Frame, direction, and delivery boundary",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("G1 rejects capability-only current_request evidence", () => {
    let session = setTableCell(
      validSession(),
      "# Evidence Register",
      0,
      "EVD-001",
      1,
      "current_request",
    );
    session = setTableCell(
      session,
      "# Evidence Register",
      0,
      "EVD-001",
      2,
      "user message in this turn",
    );
    session = setTableCell(
      session,
      "# Evidence Register",
      0,
      "EVD-001",
      4,
      "Capability approval for create_or_update_checkpoint with single_use scope",
    );
    expectFailure(session, /lacks a current-request.*Goal and Frame approval/);
  });

  test("G1 current-request approval accepts a verified_fact evidence status", () => {
    const session = setTableCell(
      validSession(),
      "# Evidence Register",
      0,
      "EVD-001",
      6,
      "verified_fact",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("G1 current-request approval rejects an unrelated file evidence", () => {
    let session = setTableCell(
      validSession(),
      "# Evidence Register",
      0,
      "EVD-001",
      1,
      "file",
    );
    session = setTableCell(
      session,
      "# Evidence Register",
      0,
      "EVD-001",
      2,
      "NOTES.md",
    );
    expectFailure(session, /lacks a current-request.*Goal and Frame approval/);
  });

  test("resume compatibility rejects stale installed digests before semantic validation", () => {
    const stale = setTableCell(
      setFront(validSession(), { workflow_sha256: "b".repeat(64) }),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      7,
      "legacy null text",
    );
    expect(() =>
      assertProductDesignerOutput(
        stale,
        template,
        "stale-session",
        strictAcceptanceContext("a".repeat(64)),
      ),
    ).toThrow(/migration_required.*read_only.*workflow_sha256/);
  });

  test("resume compatibility requires one complete installed digest tuple", () => {
    expect(() =>
      assertProductDesignerResumeCompatibility(
        validSession(),
        { workflowSha256: "a".repeat(64) },
        "partial-digests",
      ),
    ).toThrow(/incomplete or invalid installed digest set/);
  });

  test("required approved_exception accepts a current human design approval head", () => {
    expect(() =>
      assertProductDesignerOutput(withRequiredApprovedException(), template),
    ).not.toThrow();
  });

  test("required approved_exception rejects an approval for another acceptance", () => {
    const session = setTableCell(
      withRequiredApprovedException(),
      "# Approval Log",
      3,
      "AP-EXC-001",
      6,
      "acceptance:ACC-002",
    );
    expectFailure(session, /targets a different Acceptance ID/);
  });

  test("required approved_exception rejects a different approval subject revision", () => {
    const session = setTableCell(
      withRequiredApprovedException(),
      "# Approval Log",
      3,
      "AP-EXC-001",
      8,
      "other-artifact-revision",
    );
    expectFailure(session, /subject revision does not match/);
  });

  test.each([
    [
      7,
      "scope=all screens; risk=supervisor uses the audited manual fallback",
      /scope or risk does not match/,
    ],
    [
      7,
      "scope=prototype omits live retry; risk=unreviewed financial mutation",
      /scope or risk does not match/,
    ],
    [9, "expires_on=security sign-off", /expiry does not match/],
  ] as const)(
    "required approved_exception rejects approval contract mismatch in column %i",
    (column, value, pattern) => {
      const session = setTableCell(
        withRequiredApprovedException(),
        "# Approval Log",
        3,
        "AP-EXC-001",
        column,
        value,
      );
      expectFailure(session, pattern);
    },
  );

  test.each(["stale", "revoked"] as const)(
    "required approved_exception rejects a %s current approval head",
    (status) => {
      expectFailure(
        appendExceptionApprovalHead(withRequiredApprovedException(), status),
        /no current approved head/,
      );
    },
  );

  test("required approved_exception rejects a model as the human approver", () => {
    const session = setTableCell(
      withRequiredApprovedException(),
      "# Approval Log",
      3,
      "AP-EXC-001",
      11,
      "Codex model",
    );
    expectFailure(session, /does not name an actual human approver/);
  });

  test("required approved_exception expires against validation time, not only SESSION updated_at", () => {
    const session = withRequiredApprovedException()
      .replace(
        "expires_on=implementation revalidation",
        "expires_at=2026-08-13T03:30:00.000Z",
      )
      .replace(
        "expiry=implementation revalidation",
        "expiry=2026-08-13T03:30:00.000Z",
      );
    expectFailure(session, /expiry is invalid or no longer current/);
  });

  test("unrelated active approvals cannot grant hidden session-lifetime authority", () => {
    const now = "2026-08-13T00:00:00.000Z";
    const session = table(withRequiredApprovedException(), "# Approval Log", [
      ...tableRows(withRequiredApprovedException(), "# Approval Log").map(
        formatRow,
      ),
      `| evt-00000001-0019 | 1 | ${now} | AP-HIDDEN-001 | capability | read_private_data | .env | read secrets | fixture-revision | session_lifetime | approved | current user | none |`,
    ]);
    expectFailure(session, /unrelated active approval AP-HIDDEN-001/);
  });

  test.each([
    ["status", "finished", /invalid status/],
    ["current_stage", "RELEASE", /invalid current_stage/],
    ["current_gate", "G7", /invalid current_gate/],
    ["completion_kind", "prototype_delivery", /invalid completion_kind/],
  ] as const)("core rejects malformed %s", (field, value, pattern) => {
    expectCoreFailure(setFront(validSession(), { [field]: value }), pattern);
  });

  test("core rejects a mismatched stage and gate", () => {
    expectCoreFailure(
      setFront(validSession(), {
        current_stage: "SPECIFY",
        current_gate: "G1",
        gate_state: "open",
        last_passed_gate: "G0",
      }),
      /invalid stage\/gate tuple/,
    );
  });

  test.each([
    ["quick", -1],
    ["quick", 3],
    ["guided", -1],
    ["guided", "seven"],
  ] as const)(
    "core rejects invalid %s decision-turn count %s",
    (mode, count) => {
      expectCoreFailure(
        setFront(validSession(), {
          mode,
          mode_decision_turn_count: count,
        }),
        /invalid mode_decision_turn_count/,
      );
    },
  );

  test("guided decision-turn count remains observational after seven", () => {
    const checkpoint = setFront(validSession(), {
      current_stage: "SPECIFY",
      current_gate: "G3",
      gate_state: "open",
      last_passed_gate: "G2",
      mode: "guided",
      mode_decision_turn_count: 7,
    });
    expect(() =>
      assertProductDesignerSessionCore(checkpoint, template),
    ).not.toThrow();

    expect(() =>
      assertProductDesignerSessionCore(
        setFront(checkpoint, { mode_decision_turn_count: 8 }),
        template,
      ),
    ).not.toThrow();
  });

  test("guided seven-turn handoff waits for approval without inventing G6 waiting_input", () => {
    const session = setFront(
      validSession().replace(
        "- Product Designer revalidation: not_applicable(reason=design-only handoff)",
        "- Product Designer revalidation: pending",
      ),
      {
        status: "paused",
        current_stage: "HANDOFF",
        current_gate: "G6",
        gate_state: "waiting_approval",
        last_passed_gate: "G5",
        completion_kind: "none",
        mode: "guided",
        mode_decision_turn_count: 7,
      },
    );
    expect(() =>
      assertProductDesignerSessionCore(session, template),
    ).not.toThrow();
  });

  test("guided seven-turn handoff may wait on implementation evidence", () => {
    const session = setFront(
      validSession().replace(
        "- Product Designer revalidation: not_applicable(reason=design-only handoff)",
        "- Product Designer revalidation: pending",
      ),
      {
        status: "paused",
        current_stage: "HANDOFF",
        current_gate: "G6",
        gate_state: "waiting_external",
        last_passed_gate: "G5",
        completion_kind: "none",
        mode: "guided",
        mode_decision_turn_count: 7,
      },
    );
    expect(() =>
      assertProductDesignerSessionCore(session, template),
    ).not.toThrow();
  });

  test.each(["open", "waiting_external", "waiting_approval"] as const)(
    "G6 %s remains a valid paused implementation handoff",
    (gateState) => {
      const session = setFront(
        validSession().replace(
          "- Product Designer revalidation: not_applicable(reason=design-only handoff)",
          "- Product Designer revalidation: pending",
        ),
        {
          status: "paused",
          current_stage: "HANDOFF",
          current_gate: "G6",
          gate_state: gateState,
          last_passed_gate: "G5",
          completion_kind: "none",
        },
      );
      expect(() =>
        assertProductDesignerSessionCore(session, template),
      ).not.toThrow();
    },
  );

  test.each(["waiting_input", "blocked_external"] as const)(
    "G6 rejects undocumented nonterminal state %s",
    (gateState) => {
      expectCoreFailure(
        setFront(validSession(), { gate_state: gateState }),
        /invalid nonterminal G6 gate_state/,
      );
    },
  );

  test("core accepts only the two canonical terminal tuples", () => {
    const designDelivery = setFront(validSession(), {
      status: "complete",
      current_stage: "HANDOFF",
      current_gate: "G6",
      gate_state: "not_applicable",
      last_passed_gate: "G5",
      completion_kind: "design_delivery",
    });
    expect(() =>
      assertProductDesignerSessionCore(designDelivery, template),
    ).not.toThrow();

    const guidedSevenTurnDelivery = setFront(designDelivery, {
      mode: "guided",
      mode_decision_turn_count: 7,
    });
    expect(() =>
      assertProductDesignerSessionCore(guidedSevenTurnDelivery, template),
    ).not.toThrow();

    const implemented = setFront(
      validSession().replace(
        "- Product Designer revalidation: not_applicable(reason=design-only handoff)",
        "- Product Designer revalidation: pass at fixture-revision",
      ),
      {
        status: "complete",
        current_stage: "HANDOFF",
        current_gate: "G6",
        gate_state: "passed",
        last_passed_gate: "G6",
        completion_kind: "implemented_and_revalidated",
        delivery_profile: "implementation",
      },
    );
    expect(() =>
      assertProductDesignerSessionCore(implemented, template),
    ).not.toThrow();
  });

  test("document baseline and session-only metadata isolation are canonical", () => {
    const output = setFront(validSession(), {
      baseline_kind: "scenario_document",
      baseline_ref: "SCENARIO.md@sha256:fixture",
      isolation_strategy: "session_metadata_only",
      isolation_approved: true,
    });
    expect(() =>
      assertProductDesignerSessionCore(output, template, "<fixture>"),
    ).not.toThrow();
  });

  test("front matter accepts UTC RFC3339 with or without fractional seconds", () => {
    for (const timestamp of [
      "2026-08-13T00:00:00Z",
      "2026-08-13T00:00:00.123456Z",
    ]) {
      const output = setFront(validSession(), {
        created_at: timestamp,
        updated_at: timestamp,
      });
      expect(() =>
        assertProductDesignerSessionCore(output, template, "<fixture>"),
      ).not.toThrow();
    }
  });

  test("front matter timestamps remain UTC", () => {
    const output = setFront(validSession(), {
      created_at: "2026-08-13T09:00:00+09:00",
      updated_at: "2026-08-13T09:00:00+09:00",
    });
    expect(() =>
      assertProductDesignerSessionCore(output, template, "<fixture>"),
    ).toThrow(/invalid created_at/);
  });

  test("free-form baseline and isolation synonyms are rejected", () => {
    for (const [field, value] of [
      ["baseline_kind", "scenario_doc"],
      ["isolation_strategy", "session_file_only"],
    ] as const) {
      const output = setFront(validSession(), {
        [field]: value,
      });
      expect(() =>
        assertProductDesignerSessionCore(output, template, "<fixture>"),
      ).toThrow(/invalid project or isolation metadata/);
    }
  });

  test.each([
    {
      gate_state: "waiting_approval",
      last_passed_gate: "G5",
      completion_kind: "design_delivery",
    },
    {
      gate_state: "passed",
      last_passed_gate: "G5",
      completion_kind: "implemented_and_revalidated",
    },
    {
      gate_state: "not_applicable",
      last_passed_gate: "G6",
      completion_kind: "none",
    },
  ])("core rejects contradictory complete tuple %#", (tuple) => {
    expectCoreFailure(
      setFront(validSession(), {
        status: "complete",
        current_stage: "HANDOFF",
        current_gate: "G6",
        ...tuple,
      }),
      /contradictory terminal tuple/,
    );
  });

  test("rejects malformed instant and Event ID revision mismatch", () => {
    expectFailure(
      validSession().replace(
        "2026-08-13T00:00:00.000Z | AMB-001",
        "2026-99-99T99:99:99.999Z | AMB-001",
      ),
      /non-existent Occurred At/,
    );
    expectFailure(
      validSession().replace("evt-00000001-0001 | 1", "evt-00000002-0001 | 1"),
      /Event ID revision/,
    );
  });

  test("rejects out-of-order approval head and cross-revision consumption", () => {
    const base = validSession();
    const rows = [
      `| evt-00000001-0003 | 1 | 2026-08-13T00:00:00.000Z | AP-ACCEPT-001 | capability | create_or_update_checkpoint | path | data | fixture | single_use | approved | user | none |`,
      `| evt-00000003-0001 | 3 | 2026-08-13T00:00:02.000Z | AP-ACCEPT-001 | capability | create_or_update_checkpoint | path | data | fixture | single_use | approved | user | evt-00000001-0003 |`,
      `| evt-00000002-0001 | 2 | 2026-08-13T00:00:01.000Z | AP-ACCEPT-001 | capability | create_or_update_checkpoint | path | data | fixture | single_use | consumed | user | evt-00000001-0003 |`,
    ];
    let staleHead = table(base, "# Approval Log", rows);
    staleHead = table(staleHead, "# Change Log", [
      "| evt-00000003-0002 | 3 | 2026-08-13T00:00:03.000Z | Product Designer | Created checkpoint | Fixture | fixture revision |",
    ]);
    staleHead = setFront(staleHead, {
      checkpoint_revision: 3,
      last_event_id: "evt-00000003-0002",
      updated_at: "2026-08-13T00:00:03.000Z",
    });
    expectFailure(staleHead, /broken supersede chain/);
    let crossRevision = base.replace(
      "evt-00000001-0004 | 1 |",
      "evt-00000002-0004 | 2 |",
    );
    crossRevision = table(crossRevision, "# Change Log", [
      "| evt-00000002-0005 | 2 | 2026-08-13T00:00:01.000Z | Product Designer | Created checkpoint | Fixture | fixture revision |",
    ]);
    crossRevision = setFront(crossRevision, {
      checkpoint_revision: 2,
      last_event_id: "evt-00000002-0005",
      updated_at: "2026-08-13T00:00:01.000Z",
    });
    expectFailure(crossRevision, /(same revision|consume the single-use)/);
  });

  test("approval fold allows physical row reordering", () => {
    const reordered = table(
      validSession(),
      "# Approval Log",
      tableRows(validSession(), "# Approval Log").reverse().map(formatRow),
    );
    expect(() =>
      assertProductDesignerOutput(reordered, template),
    ).not.toThrow();
  });

  test("approval terminal states cannot be resurrected", () => {
    let denied = table(validSession(), "# Approval Log", [
      approvalRow("evt-00000001-0003", "denied", "none"),
    ]);
    denied = withAdditionalApprovalEvent(
      denied,
      approvalRow("evt-00000001-0012", "approved", "evt-00000001-0003"),
    );
    expectFailure(denied, /Approval Log has an illegal state transition/);

    const consumed = withAdditionalApprovalEvent(
      validSession(),
      approvalRow("evt-00000001-0012", "approved", "evt-00000001-0004"),
    );
    expectFailure(consumed, /Approval Log has an illegal state transition/);
  });

  test("consumption cannot mutate approval resource or subject revision", () => {
    const resourceMutation = mapTableRows(
      validSession(),
      "# Approval Log",
      (row) => {
        if (row[10] === "consumed") row[6] = "other/session.md";
        return row;
      },
    );
    expectFailure(resourceMutation, /Approval Log mutated approval scope/);

    const subjectMutation = mapTableRows(
      validSession(),
      "# Approval Log",
      (row) => {
        if (row[10] === "consumed") row[8] = "different subject revision";
        return row;
      },
    );
    expectFailure(subjectMutation, /Approval Log mutated approval scope/);
  });

  test("scenario-bound approval rejects coordinated subject replacement", () => {
    const scenarioSha256 = "b".repeat(64);
    const bound = mapTableRows(validSession(), "# Approval Log", (row) => {
      row[8] = `SCENARIO.md sha256 ${scenarioSha256}`;
      return row;
    });
    expect(() =>
      assertProductDesignerOutput(
        bound,
        template,
        "bound-fixture",
        scenarioSha256,
      ),
    ).not.toThrow();

    const replaced = mapTableRows(bound, "# Approval Log", (row) => {
      row[8] = `SCENARIO.md sha256 ${"c".repeat(64)}`;
      return row;
    });
    expect(() =>
      assertProductDesignerOutput(
        replaced,
        template,
        "bound-fixture",
        scenarioSha256,
      ),
    ).toThrow(
      /(?:did not bind approvals|approval is not bound) to the scenario revision/,
    );
  });

  test("requested approval cannot escalate scope when it becomes approved", () => {
    let session = table(validSession(), "# Approval Log", [
      formatRow([
        "evt-00000001-0003",
        "1",
        "2026-08-13T00:00:00.000Z",
        "AP-ACCEPT-001",
        "capability",
        "read_checkpoint",
        "docs/safe.md",
        "read public metadata",
        "request revision",
        "single_use for this response",
        "requested",
        "current user",
        "none",
      ]),
      approvalRow("evt-00000001-0004", "approved", "evt-00000001-0003"),
      approvalRow("evt-00000001-0012", "consumed", "evt-00000001-0004"),
    ]);
    session = replaceChangeEvent(session, "evt-00000001-0013");
    expectFailure(session, /Approval Log mutated approval scope/);
  });

  test("Approval Log rows have exactly thirteen cells", () => {
    const extraCell = table(
      validSession(),
      "# Approval Log",
      tableRows(validSession(), "# Approval Log").map((row) =>
        formatRow([...row, "hidden-network-authority"]),
      ),
    );
    expectFailure(extraCell, /Approval Log row must have exactly 13 cells/);
  });

  test("negated single_use text is not a single-use approval", () => {
    const sessionLifetime = replaceApprovalScope(
      validSession(),
      9,
      "session_lifetime; not single_use",
    );
    expectFailure(sessionLifetime, /single-use checkpoint approval/);
  });

  test.each([
    ["session_id", "../escape", /invalid session_id/],
    ["session_path", "/tmp/SESSION.md", /invalid session_path/],
    [
      "session_path",
      ".opendock/runs/product-designer/../escape/SESSION.md",
      /invalid session_path/,
    ],
  ] as const)("rejects unsafe %s value", (field, value, pattern) => {
    expectFailure(setFront(validSession(), { [field]: value }), pattern);
  });

  test("acceptance context rejects the wrong approver and access class", () => {
    const scenarioSha256 = "b".repeat(64);
    const context = strictAcceptanceContext(scenarioSha256);
    const bound = strictBoundSession(scenarioSha256);
    expect(() =>
      assertProductDesignerOutput(bound, template, "strict-context", context),
    ).not.toThrow();

    const wrongApprover = replaceApprovalScope(bound, 11, "assistant-model");
    expect(() =>
      assertProductDesignerOutput(
        wrongApprover,
        template,
        "wrong-approver",
        context,
      ),
    ).toThrow(/does not match the expected acceptance context/);

    const wrongAccess = replaceApprovalScope(
      bound,
      7,
      "write secrets and transmit credentials",
    );
    expect(() =>
      assertProductDesignerOutput(
        wrongAccess,
        template,
        "wrong-access",
        context,
      ),
    ).toThrow(/does not match the expected acceptance context/);
  });

  test("scenario digest binding rejects compound subjects", () => {
    const scenarioSha256 = "b".repeat(64);
    const context = strictAcceptanceContext(scenarioSha256);
    const compound = replaceApprovalScope(
      strictBoundSession(scenarioSha256),
      8,
      `SCENARIO.md SHA-256 ${scenarioSha256} and ${"c".repeat(64)}`,
    );
    expect(() =>
      assertProductDesignerOutput(
        compound,
        template,
        "compound-subject",
        context,
      ),
    ).toThrow(/does not match the expected acceptance context/);
  });

  test.each([
    ["fenced", "```markdown\n# Approval Log\n```"],
    ["inline", "Reference only: # Approval Log"],
  ])("a %s fake heading cannot replace a required heading", (_kind, fake) => {
    const missingRealHeading = validSession()
      .replace("# Approval Log", "# Approval Records")
      .replace("# Approval Records\n", `# Approval Records\n\n${fake}\n`);
    expectFailure(missingRealHeading, /H1\/H2 structure drifted from template/);
  });

  test("a required H2 table cannot be relocated under its sibling subsection", () => {
    expectFailure(
      relocateStateTableAfterResponsiveHeading(validSession()),
      /State Matrix is missing default|State Matrix.*(?:missing|table)/,
    );
  });

  test("Markdown table alignment padding does not change the SESSION schema", () => {
    const compactHeader = validSession().replace(
      "| Path or temporary contract | Scope        | SHA-256 or revision | Status  |",
      "| Path or temporary contract | Scope | SHA-256 or revision | Status |",
    );
    expect(() =>
      assertProductDesignerOutput(compactHeader, template),
    ).not.toThrow();
  });

  test("a two-hyphen delimiter cell is not a managed Markdown table", () => {
    const session = validSession().replace(
      "| --- | ---- | ---- | -------------------- |",
      "| -- | ---- | ---- | -------------------- |",
    );
    expectFailure(session, /table headers drifted from template/);
  });

  test.each([
    [
      "renamed",
      "| Path or temporary contract | Coverage | SHA-256 or revision | Status |",
    ],
    [
      "reordered",
      "| Scope | Path or temporary contract | SHA-256 or revision | Status |",
    ],
  ])("a %s table column changes the SESSION schema", (_kind, header) => {
    const changedHeader = validSession().replace(
      "| Path or temporary contract | Scope        | SHA-256 or revision | Status  |",
      header,
    );
    expectFailure(changedHeader, /table headers drifted from template/);
  });

  test("fenced wireframe, documented date format and nested keyboard list are not fill-ins", () => {
    let session = validSession().replace(
      "binding:transaction.amount and view-only fallback.",
      "binding:transaction.amount and view-only fallback. Backend date format: YYYY-MM-DD.",
    );
    session = session.replace(
      "390px and 1440px, keyboard and WCAG AA.",
      "390px and 1440px, keyboard and WCAG AA.\n\n- Keyboard support:\n  - Focus returns to the selected row.",
    );
    session = appendBeforeHeading(
      session,
      "# Validation Log",
      "```text\n| Failed transaction | Current state |\n|---|---|\n| TX-001 | failed |\n```",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test.each([
    "validation_point=before:specification-review; expected_evidence=versioned interface contract",
    "validation_point=before:implementation-start; expected_evidence=RetryCommand schema revision",
  ])(
    "a canonical assumption event and evidence locator is a bounded validation point: %s",
    (validationPoint) => {
      let session = setTableCell(
        validSession(),
        "## Content and Data Contract",
        0,
        "DATA-RETRY",
        11,
        validationPoint,
      );
      session = session.replace(
        "DATA-RETRY is unproven until validation_point=before:implementation-start; expected_evidence=versioned RetryCommand interface contract.",
        `DATA-RETRY is unproven until ${validationPoint}.`,
      );
      expect(() =>
        assertProductDesignerOutput(session, template),
      ).not.toThrow();
    },
  );

  test.each([
    "${amount}",
    "[insert failure reason]",
    "DD-MM-YYYY",
    "DD/MM/YYYY",
  ])("prototype rejects unresolved fill-in variant %s", (fillIn) => {
    const session = appendBeforeHeading(
      validSession(),
      "# Validation Log",
      `Synthetic transaction value: ${fillIn}`,
    );
    expectFailure(session, /SESSION contains an unresolved fill-in value/);
  });

  test("Korean required value still blocks a needs_review acceptance", () => {
    let session = setTableCell(
      validSession(),
      "# Acceptance Contract",
      0,
      "ACC-001",
      2,
      "예",
    );
    session = setTableCell(
      session,
      "# Validation Log",
      3,
      "ACC-001",
      7,
      "needs_review",
    );
    expectFailure(
      session,
      /required acceptance is not delivery-ready: ACC-001/,
    );
  });

  test("Korean optional value rejects a proven or closed unvalidated outcome", () => {
    let session = setTableCell(
      validSession(),
      "# Acceptance Contract",
      0,
      "ACC-004",
      2,
      "아니요",
    );
    session = session.replace(
      "outcome=ACC-004; status=needs_review; proof=unproven; owner=Product team; validation_point=before:outcome-measurement; expected_evidence=real operator timing study.",
      "outcome=ACC-004; status=needs_review; proof=unproven; owner=Product team; validation_point=before:outcome-measurement; expected_evidence=real operator timing study. ACC-004 is proven, passed, and closed; no future measurement is needed.",
    );
    expectFailure(
      session,
      /handoff lost the unproven optional acceptance ACC-004/,
    );
  });

  test("handoff may summarize passed required acceptances before a distinct optional not_run clause", () => {
    const session = validSession().replace(
      "- Acceptance and evidence references: ACC-001 through ACC-004",
      "- Acceptance and evidence references: ACC-001 through ACC-003 passed; ACC-004 remains needs_review and unproven pending future measurement",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("unauthorized enabled action is rejected without bracket syntax", () => {
    const session = validSession().replace(
      "actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=not_rendered; denial=retry is not permitted; permission_route_action=ACT-RETURN.",
      "actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=enabled; denial=retry is not permitted; permission_route_action=ACT-RETURN.",
    );
    expectFailure(session, /prototype leaves permission behavior ambiguous/);
  });

  test("permission denial copy may vary while the canonical route remains stable", () => {
    let session = validSession().replace(
      "denial=retry is not permitted; permission_route_action=ACT-RETURN",
      "denial=Request supervisor follow-up through the documented workflow; permission_route_action=ACT-RETURN",
    );
    session = setTableCell(
      session,
      "## State Matrix",
      0,
      "permission",
      2,
      "actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=not_rendered; denial=Request supervisor follow-up through the documented workflow; next_route_action=ACT-RETURN",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("identical repeated permission controls fold without creating ambiguity", () => {
    const disabled =
      "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; re_enable_when=transaction status returns to failed.";
    const session = validSession().replace(
      disabled,
      `${disabled}\n${disabled}`,
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("identical permission controls fold across viewport list formatting", () => {
    const disabled =
      "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; re_enable_when=transaction status returns to failed.";
    const session = validSession().replace(
      disabled,
      `  ${disabled}\n- ${disabled}`,
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("conflicting repeated permission controls remain ambiguous", () => {
    const disabled =
      "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; re_enable_when=transaction status returns to failed.";
    const session = validSession().replace(
      disabled,
      `${disabled}\nactor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; re_enable_when=manual approval arrives.`,
    );
    expectFailure(session, /prototype leaves permission behavior ambiguous/);
  });

  test("weak permission State Matrix row without an explicit denial is rejected", () => {
    const weakPermission = setTableCell(
      validSession(),
      "## State Matrix",
      0,
      "permission",
      2,
      "Operator requires the Supervisor role and may escalate to supervisor.",
    );
    expectFailure(
      weakPermission,
      /permission state lacks actor, required role, denial, or one route/,
    );
  });

  test("weak disabled State Matrix row without a disabled state is rejected", () => {
    const weakDisabled = setTableCell(
      validSession(),
      "## State Matrix",
      0,
      "disabled",
      2,
      "While status is retrying, retry becomes enabled again when status returns to failed.",
    );
    expectFailure(
      weakDisabled,
      /disabled state lacks a precondition and re-enable condition/,
    );
  });

  test("disabled State Matrix rejects the actual vague re-enable-condition phrasing", () => {
    const vagueDisabled = setTableCell(
      validSession(),
      "## State Matrix",
      0,
      "disabled",
      2,
      "When prerequisite data is incomplete or a retry is already in progress, keep the retry action visible but inactive with the re-enable condition explained.",
    );
    expectFailure(
      vagueDisabled,
      /disabled state lacks a precondition and re-enable condition/,
    );
  });

  test("disabled State Matrix accepts a concrete product-neutral re-enable transition", () => {
    const concreteDisabled = setTableCell(
      validSession(),
      "## State Matrix",
      0,
      "disabled",
      2,
      "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; denial=not_applicable(reason=role authorized); re_enable_when=identity verification completes for the selected account; next_route_action=ACT-RETURN",
    );
    expect(() =>
      assertProductDesignerOutput(concreteDisabled, template),
    ).not.toThrow();
  });

  test("disabled State Matrix rejects a generic conditions-are-met transition", () => {
    const genericDisabled = setTableCell(
      validSession(),
      "## State Matrix",
      0,
      "disabled",
      2,
      "The submit control stays disabled while prerequisites are pending and becomes enabled again when conditions are met.",
    );
    expectFailure(
      genericDisabled,
      /disabled state lacks a precondition and re-enable condition/,
    );
  });

  test("Korean actors and reprocess wording preserve a deterministic permission contract", () => {
    let session = validSession()
      .replace(
        "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=enabled; enabled_when=transaction status is failed.",
        "actor=관리자; required_role=관리자; capability_action=ACT-RETRY; control=enabled; enabled_when=거래 상태가 실패이다.",
      )
      .replace(
        "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled; re_enable_when=transaction status returns to failed.",
        "actor=관리자; required_role=관리자; capability_action=ACT-RETRY; control=disabled; re_enable_when=거래 상태가 실패로 돌아온다.",
      )
      .replace(
        "actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=not_rendered; denial=retry is not permitted; permission_route_action=ACT-RETURN.",
        "actor=운영자; required_role=관리자; capability_action=ACT-RETRY; control=not_rendered; denial=거래 재처리 권한 없음; permission_route_action=ACT-RETURN.",
      );
    session = setTableCell(
      session,
      "## State Matrix",
      0,
      "permission",
      2,
      "actor=운영자; required_role=관리자; capability_action=ACT-RETRY; control=not_rendered; denial=거래 재처리 권한 없음; next_route_action=ACT-RETURN",
    );
    session = setTableCell(
      session,
      "## State Matrix",
      0,
      "disabled",
      2,
      "actor=관리자; required_role=관리자; capability_action=ACT-RETRY; control=disabled; denial=not_applicable(reason=role authorized); re_enable_when=거래 상태가 실패로 돌아온다; next_route_action=ACT-RETURN",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("state-changing publish action and bounded interface assumption pass", () => {
    const session = validSession()
      .replaceAll("ACT-RETRY", "ACT-PUBLISH")
      .replaceAll("DATA-RETRY", "DATA-PUBLISH")
      .replaceAll("RetryCommand", "PublishCommand")
      .replaceAll("transaction", "document")
      .replaceAll("Retry", "Publish")
      .replaceAll("retry", "publish");
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("canonical action references bind a flow-critical state change", () => {
    expect(() =>
      assertProductDesignerOutput(validSession(), template),
    ).not.toThrow();
    const bareAction = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      1,
      "ACT-RETRY; binding:transaction.status",
    );
    expectFailure(
      bareAction,
      /lacks a flow-critical data contract|lacks a stable target identity binding/,
    );
  });

  test("state-change eligibility accepts a structured eligible_when alias", () => {
    const session = setTableCell(
      validSession(),
      "## Flow",
      0,
      "ACT-RETRY",
      2,
      "actor=Supervisor; eligible_when=transaction status is failed and retry permission is present",
    );

    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("prototype support clause may follow an acceptance summary", () => {
    const session = setTableCell(
      validSession(),
      "# Prototype",
      0,
      "text prototype",
      4,
      "ACC-001 through ACC-005 are summarized; action=ACT-RETRY; acceptance_set=ACC-001,ACC-002; claim=permission-safe retry state change",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("prototype support parses multiple action clauses in one cell", () => {
    const output = validSession().replace(
      "action=ACT-RETRY; acceptance_set=ACC-001,ACC-002; claim=permission-safe retry state change. ACC-003 and ACC-005 cover responsive and accessibility structure. terminal_success_when=transaction.status changes to succeeded for the same transaction.id",
      "action=ACT-OPEN; acceptance_set=ACC-003; claim=detail opening is specified; action=ACT-RETRY; acceptance_set=ACC-001,ACC-002; claim=permission-safe retry state change. ACC-003 and ACC-005 cover responsive and accessibility structure. terminal_success_when=transaction.status changes to succeeded for the same transaction.id",
    );

    expect(() => assertProductDesignerOutput(output, template)).not.toThrow();
  });

  test("a stable action zone does not imply a keyboard Tab claim", () => {
    const output = setTableCell(
      validSession(),
      "# Acceptance Contract",
      0,
      "ACC-003",
      1,
      "Responsive layouts preserve one stable retry action zone",
    );

    expect(() => assertProductDesignerOutput(output, template)).not.toThrow();
  });

  test("raw pipe characters cannot split a Flow state transition cell", () => {
    const splitTransition = setTableCell(
      validSession(),
      "## Flow",
      0,
      "ACT-RETRY",
      8,
      "failed -> retrying -> succeeded|failed",
    );
    expectFailure(splitTransition, /Flow row must have exactly 10 cells/);
  });

  test.each([
    [
      "# Evidence Register",
      "EVD-001",
      0,
      4,
      /Evidence Register row must have exactly 7 cells/,
    ],
    [
      "# Acceptance Contract",
      "ACC-001",
      0,
      4,
      /Acceptance Contract row must have exactly 9 cells/,
    ],
    [
      "# Prototype",
      "text prototype",
      0,
      4,
      /Prototype row must have exactly 7 cells/,
    ],
  ] as const)(
    "every managed table rejects a raw-pipe extra cell in %s",
    (heading, subject, subjectColumn, valueColumn, pattern) => {
      const split = setTableCell(
        validSession(),
        heading,
        subjectColumn,
        subject,
        valueColumn,
        "bounded value|unexpected extra cell",
      );
      expectFailure(split, pattern);
    },
  );

  test("escaped pipe content stays inside one managed table cell", () => {
    const escaped = setTableCell(
      validSession(),
      "# Evidence Register",
      0,
      "EVD-001",
      4,
      "Operators need a permission-safe retry flow with A \\| B notation",
    );
    expect(() => assertProductDesignerOutput(escaped, template)).not.toThrow();
  });

  test("canonical IDs use whole-token equality instead of prefix matching", () => {
    let prefixed = setTableCell(
      validSession(),
      "# Acceptance Contract",
      0,
      "ACC-001",
      1,
      "ACT-RETRY-10 primary flow is specified",
    );
    prefixed = setTableCell(
      prefixed,
      "# Acceptance Contract",
      0,
      "ACC-001",
      4,
      "ACT-RETRY-10 covers the flow",
    );
    expectFailure(prefixed, /reverse-reference ID sets differ/);
  });

  test.each([
    "when ready",
    "later",
    "validation_point=gate:G3; evidence=EVD-MISSING",
  ])(
    "validation point rejects vague or missing gate evidence: %s",
    (validationPoint) => {
      const status = validationPoint.startsWith("validation_point=gate")
        ? "fact"
        : "design_interface_assumption";
      let session = setTableCell(
        validSession(),
        "## Content and Data Contract",
        0,
        "DATA-RETRY",
        9,
        status,
      );
      session = setTableCell(
        session,
        "## Content and Data Contract",
        0,
        "DATA-RETRY",
        11,
        validationPoint,
      );
      expectFailure(
        session,
        /concrete validation point|bounded validation point|missing or non-current gate evidence/,
      );
    },
  );

  test.each([
    [
      "owner",
      "outcome=ACC-004; status=needs_review; proof=unproven; validation_point=before:outcome-measurement; expected_evidence=real operator timing study",
    ],
    [
      "validation point",
      "outcome=ACC-004; status=needs_review; proof=unproven; owner=Product team; expected_evidence=real operator timing study",
    ],
    [
      "proof",
      "outcome=ACC-004; status=needs_review; owner=Product team; validation_point=before:outcome-measurement; expected_evidence=real operator timing study",
    ],
  ] as const)(
    "optional outcome handoff requires exact %s",
    (_label, record) => {
      const scenarioSha256 = "7".repeat(64);
      const invalid = strictBoundSession(scenarioSha256).replace(
        "outcome=ACC-004; status=needs_review; proof=unproven; owner=Product team; validation_point=before:outcome-measurement; expected_evidence=real operator timing study",
        record,
      );
      expect(() =>
        assertProductDesignerOutput(
          invalid,
          template,
          "<fixture>",
          strictAcceptanceContext(scenarioSha256),
        ),
      ).toThrow(/optional Evidence-backed acceptance/);
    },
  );

  test("state-changing action requires a stable target identity binding", () => {
    const missingIdentity = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      1,
      "action:ACT-RETRY; binding:transaction.status",
    );
    expectFailure(missingIdentity, /stable target identity binding/);
  });

  test("a fact validation point must name a gate or evidence event", () => {
    let session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      9,
      "fact",
    );
    session = setTableCell(
      session,
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      11,
      "current session",
    );
    expectFailure(session, /bounded validation point/);
  });

  test("fact runtime writer provenance must appear in cited evidence", () => {
    let invented = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      3,
      "SCENARIO.md state model",
    );
    invented = setTableCell(
      invented,
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      6,
      "retry system",
    );
    invented = setTableCell(
      invented,
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      9,
      "fact",
    );
    invented = setTableCell(
      invented,
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      11,
      "validation_point=gate:G3; evidence=EVD-001",
    );
    expectFailure(
      invented,
      /invents runtime provenance beyond its cited evidence/,
    );

    const evidenced = setTableCell(
      invented,
      "# Evidence Register",
      0,
      "EVD-001",
      4,
      "Operators need a permission-safe retry flow and SCENARIO.md names retry system as the runtime writer",
    );
    expect(() =>
      assertProductDesignerOutput(evidenced, template),
    ).not.toThrow();
  });

  test("strict acceptance preserves an unmeasured numeric outcome", () => {
    const scenarioSha256 = "f".repeat(64);
    const session = strictBoundSession(scenarioSha256);
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).not.toThrow();
    const withoutOutcome = setTableCell(
      session,
      "# Acceptance Contract",
      0,
      "ACC-004",
      5,
      "Structure",
    );
    expect(() =>
      assertProductDesignerOutput(
        withoutOutcome,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).toThrow(/optional Evidence-backed acceptance/);
  });

  test("request acknowledgement is not a confirmed terminal success", () => {
    const scenarioSha256 = "9".repeat(64);
    let session = strictBoundSession(scenarioSha256);
    session = session.replace(
      "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=enabled; enabled_when=transaction status is failed.",
      "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=enabled; enabled_when=transaction status is failed.\nSuccess message: Retry accepted. Removed from failed queue.",
    );
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).toThrow(/request acknowledgement as confirmed terminal success/);
  });

  test("Flow acknowledgement and terminal clauses stay within their own cells", () => {
    let session = setTableCell(
      validSession(),
      "## Flow",
      0,
      "ACT-RETRY",
      5,
      "in_progress_control=disabled; feedback=show retrying status; acknowledgement_only_when=request is accepted and queued",
    );
    session = setTableCell(
      session,
      "# Prototype",
      0,
      "text prototype",
      4,
      "action=ACT-RETRY; acceptance_set=ACC-001,ACC-002; claim=permission-safe retry state change. ACC-003 and ACC-005 cover responsive and accessibility structure. acknowledgement_only_when=request is accepted and queued; terminal_success_when=transaction.status changes to succeeded for the same transaction.id",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("an observable retrying state is a nonterminal acknowledgement", () => {
    let session = setTableCell(
      validSession(),
      "## Flow",
      0,
      "ACT-RETRY",
      5,
      "in_progress_control=disabled; feedback=show retrying status; acknowledgement_only_when=detail and queue badge switch to retrying for binding:transaction.id",
    );
    session = setTableCell(
      session,
      "# Prototype",
      0,
      "text prototype",
      4,
      "action=ACT-RETRY; acceptance_set=ACC-001,ACC-002; claim=permission-safe retry state change. ACC-003 and ACC-005 cover responsive and accessibility structure. acknowledgement_only_when=detail and queue badge switch to retrying for binding:transaction.id; terminal_success_when=transaction.status changes to succeeded for the same transaction.id",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("accepted retrying acknowledgement stays nonterminal while status resolves to success", () => {
    let session = validSession().replaceAll(
      "transaction.status changes to succeeded for the same transaction.id",
      "transaction.status resolves to succeeded for the same transaction.id",
    );
    session = setTableCell(
      session,
      "## Flow",
      0,
      "ACT-RETRY",
      5,
      "in_progress_control=disabled; feedback=show retrying status; acknowledgement_only_when=request is accepted and transaction remains retrying without terminal confirmation",
    );
    session = setTableCell(
      session,
      "# Prototype",
      0,
      "text prototype",
      4,
      "action=ACT-RETRY; acceptance_set=ACC-001,ACC-002; claim=permission-safe retry state change. ACC-003 and ACC-005 cover responsive and accessibility structure. acknowledgement_only_when=request is accepted and transaction remains retrying without terminal confirmation; terminal_success_when=transaction.status resolves to succeeded for the same transaction.id",
    );

    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("acknowledgement may explicitly occur before terminal confirmation", () => {
    let session = validSession();
    const acknowledgement =
      "ACT-RETRY request is accepted, selected detail keeps binding:transaction.id visible, and transaction.status=retrying before terminal confirmation";
    session = setTableCell(
      session,
      "## Flow",
      0,
      "ACT-RETRY",
      5,
      `in_progress_control=disabled; feedback=show retrying status; acknowledgement_only_when=${acknowledgement}`,
    );
    session = session.replace(
      "acknowledgement_only_when=retry request is accepted and transaction.status=retrying",
      `acknowledgement_only_when=${acknowledgement}`,
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("retrying while terminal confirmation is pending is a nonterminal acknowledgement", () => {
    const scenarioSha256 = "c".repeat(64);
    const acknowledgement =
      "detail state shows binding:transaction.id and binding:transaction.status=retrying while terminal confirmation is still pending";
    let session = setTableCell(
      strictBoundSession(scenarioSha256),
      "## Flow",
      0,
      "ACT-RETRY",
      5,
      `in_progress_control=disabled; feedback=show retrying status; acknowledgement_only_when=${acknowledgement}`,
    );
    session = session.replace(
      "## Prototype Detail\n\n",
      `## Prototype Detail\n\nacknowledgement_only_when=${acknowledgement}\n`,
    );
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).not.toThrow();
  });

  test("a canonical terminal binding assignment is a positive terminal event", () => {
    const session = validSession().replaceAll(
      "transaction.status changes to succeeded for the same transaction.id",
      "binding:transaction.status=succeeded for binding:transaction.id",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("a confirmed state assignment with target and terminal bindings is positive", () => {
    const session = validSession().replaceAll(
      "transaction.status changes to succeeded for the same transaction.id",
      "state=succeeded confirmed for binding:transaction.id and binding:transaction.status after retry refresh",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("an exact confirmed success branch with target bindings is positive", () => {
    const session = validSession().replaceAll(
      "transaction.status changes to succeeded for the same transaction.id",
      "succeeded detail confirmed for binding:transaction.id via binding:transaction.status",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("an observed succeeded binding is a positive terminal event", () => {
    const terminal =
      "binding:transaction.status for binding:transaction.id is observed as succeeded after refresh";
    const session = validSession().replaceAll(
      "transaction.status changes to succeeded for the same transaction.id",
      terminal,
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("a terminal state explicitly stated as the success branch is positive", () => {
    const scenarioSha256 = "a".repeat(64);
    const session = strictBoundSession(scenarioSha256).replaceAll(
      "transaction.status changes to succeeded for the same transaction.id",
      "terminal state is succeeded for binding:transaction.id and binding:transaction.status",
    );
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).not.toThrow();
  });

  test("a terminal state explicitly negated as the success branch is rejected", () => {
    const scenarioSha256 = "b".repeat(64);
    const session = strictBoundSession(scenarioSha256).replaceAll(
      "transaction.status changes to succeeded for the same transaction.id",
      "terminal state is not succeeded for binding:transaction.id and binding:transaction.status",
    );
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).toThrow(/structured non-negated confirmed terminal success linkage/);
  });

  test("a binding that updates to the success branch is a positive terminal event", () => {
    let session = validSession();
    const terminal =
      "binding:transaction.status for binding:transaction.id updates to succeeded after retry result refresh";
    session = setTableCell(
      session,
      "## Flow",
      0,
      "ACT-RETRY",
      6,
      `terminal_success_when=${terminal}`,
    );
    session = setTableCell(
      session,
      "## State Matrix",
      0,
      "success",
      2,
      `terminal_success_when=${terminal}`,
    );
    session = session.replace(
      "terminal_success_when=transaction.status changes to succeeded for the same transaction.id",
      `terminal_success_when=${terminal}`,
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("Prototype Detail canonical assignments may use Markdown bullets", () => {
    const session = validSession().replace(
      "ACT-RETRY success: terminal_success_when=transaction.status changes to succeeded for the same transaction.id; then remove the item.",
      "- ACT-RETRY success: terminal_success_when=transaction.status changes to succeeded for the same transaction.id; then remove the item.",
    );

    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("a permission route is backed by one flow-critical interface assumption", () => {
    const scenarioSha256 = "8".repeat(64);
    const session = strictBoundSession(scenarioSha256);
    const context = {
      ...strictAcceptanceContext(scenarioSha256),
      requirePermissionRouteAssumption: true,
    };
    expect(() =>
      assertProductDesignerOutput(session, template, "<fixture>", context),
    ).not.toThrow();

    const missingContract = table(session, "## Content and Data Contract", [
      ...tableRows(session, "## Content and Data Contract")
        .filter((row) => row[0] !== "DATA-RETURN")
        .map(formatRow),
    ]);
    expect(() =>
      assertProductDesignerOutput(
        missingContract,
        template,
        "<fixture>",
        context,
      ),
    ).toThrow(/permission route is ambiguous or lacks/);

    const unboundCapability = setTableCell(
      session,
      "## Flow",
      0,
      "ACT-RETURN",
      2,
      "actor=Operator; eligibility=lacks retry permission; route_kind=permission; permission_for=ACT-UNKNOWN",
    );
    expect(() =>
      assertProductDesignerOutput(
        unboundCapability,
        template,
        "<fixture>",
        context,
      ),
    ).toThrow(/permission route is ambiguous or lacks/);

    const divergentStateRoute = setTableCell(
      session,
      "## State Matrix",
      0,
      "permission",
      2,
      "actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=not_rendered; denial=retry not permitted; next_route_action=ACT-REQUEST-MANAGER",
    );
    expect(() =>
      assertProductDesignerOutput(
        divergentStateRoute,
        template,
        "<fixture>",
        context,
      ),
    ).toThrow(/permission route is ambiguous or lacks/);

    const divergentPrototypeRoute = session.replace(
      "permission_route_action=ACT-RETURN",
      "permission_route_action=ACT-REQUEST-MANAGER",
    );
    expect(() =>
      assertProductDesignerOutput(
        divergentPrototypeRoute,
        template,
        "<fixture>",
        context,
      ),
    ).toThrow(/permission route is ambiguous or lacks/);
  });

  test.each([
    [
      "negated terminal",
      "terminal_success_when=terminal success is not confirmed; keep processing",
      /structured non-negated confirmed terminal success linkage/,
    ],
    [
      "split terminal",
      "terminal_success_when=confirmed terminal completed status",
      /structured non-negated confirmed terminal success linkage/,
    ],
  ] as const)("terminal linkage rejects %s", (_label, stateValue, pattern) => {
    const scenarioSha256 = "6".repeat(64);
    const invalid = setTableCell(
      strictBoundSession(scenarioSha256),
      "## State Matrix",
      0,
      "success",
      2,
      stateValue,
    );
    expect(() =>
      assertProductDesignerOutput(
        invalid,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).toThrow(pattern);
  });

  test("acknowledgement clause must remain positive and nonterminal on both surfaces", () => {
    const scenarioSha256 = "5".repeat(64);
    let session = strictBoundSession(scenarioSha256);
    session = setTableCell(
      session,
      "## Flow",
      0,
      "ACT-RETRY",
      5,
      "in_progress_control=disabled; feedback=show processing; acknowledgement_only_when=accepted response confirms terminal success",
    );
    session = session.replace(
      "ACT-RETRY success: terminal_success_when=transaction.status changes to succeeded for the same transaction.id; then remove the item.",
      "acknowledgement_only_when=accepted response confirms terminal success\nACT-RETRY success: terminal_success_when=transaction.status changes to succeeded for the same transaction.id; then remove the item.",
    );
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).toThrow(/structured non-negated confirmed terminal success linkage/);
  });

  test("an explicit not-loaded state is a concrete null meaning", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      7,
      "null_means=selected transaction is absent because it has not loaded yet",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("a bounded unknown terminal state is a concrete null meaning", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      7,
      "null_means=current terminal state is unknown for binding:transaction.id, so retry eligibility cannot be inferred safely",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test.each([
    "null_means=no known state for the item because the value is absent or unrecognized",
    "null_means=role is absent or unrecognized so permission cannot be confirmed",
    "null_means=no items exist because the collection is absent or null",
    "null_means=permission is absent or unrecognized for the current actor",
    "null_means=detail is absent because it could not be loaded",
    "null_means=terminal result is absent or null so processing continues",
    "null_means=failure reason is absent or null so generic recovery copy is shown",
    "null_means=if no route destination is configured, the user remains in view-only detail",
    "null_means=no failed transactions currently require action in the inbox rather than a transport error",
    "null_means=selected transaction detail cannot confirm a current state, so retry remains unavailable",
    "null_means=detail payload for the selected binding:transaction.id is unavailable",
    "null_means=selected transaction cannot be matched across queue and detail, so retry is unsafe",
    "null_means=no retry target is currently bound, so detail must not expose retry or success copy",
    "null_means=terminal status is not yet known for the bound transaction, so success remains hidden",
    "null_means=the selected item has no stable transaction identity, so detail cannot bind and retry must not start",
    "null_means=unresolved role means retry capability must default deny until supervisor authorization is confirmed",
    "null_means=the selected transaction cannot be safely identified or its current status is not visible, so retry must not start",
  ])("an explicit absence phrase is a concrete null meaning: %s", (meaning) => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      7,
      meaning,
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("a no-errors assertion is not a null meaning", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      7,
      "null_means=the selected item has no errors and is ready",
    );
    expect(() => assertProductDesignerOutput(session, template)).toThrow(
      /explicit null meaning/,
    );
  });

  test("old happy-path prose without structured state-change contracts is rejected", () => {
    const oldOutput = table(validSession(), "## Flow", [
      "| ACT-RETRY | state_change | Supervisor | transaction failed | submit retry | show retrying | succeeded | show error | failed -> retrying -> succeeded | ACC-001 |",
    ]);
    expectFailure(
      oldOutput,
      /lacks concrete actor eligibility|lacks one-intent\/one-submission duplicate prevention/,
    );
  });

  test("natural-language one-intent wording cannot replace the canonical contract", () => {
    let session = validSession();
    session = setTableCell(
      session,
      "## Flow",
      0,
      "ACT-RETRY",
      4,
      "One retry intent per selected item at a time; disable after submit and ignore duplicate submit until terminal response",
    );
    expectFailure(
      session,
      /lacks one-intent\/one-submission duplicate prevention/,
    );
  });

  test("restoring context and exposing recovery is a safe visible fallback", () => {
    let session = validSession();
    session = setTableCell(
      session,
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      8,
      "Keep detail context, restore failed messaging, and expose retry recovery",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("remaining visible is an explicit safe visible fallback", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      8,
      "Inline supervisor-only guidance remains visible in detail",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("preserving detail context with policy copy is a safe fallback", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      8,
      "Keep the user in the same detail context with explicit supervisor-only policy copy",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("holding retrying or error presentation until terminal status is safe", () => {
    const session = setTableCell(
      validSession(),
      "## Content and Data Contract",
      0,
      "DATA-RETRY",
      8,
      "Keep the selected detail in retrying or error presentation, and never remove the item as succeeded until terminal status is visible for the same binding:transaction.id",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test.each([
    [
      3,
      "backend decides",
      /lacks a concrete source\/interface|unbounded source\/interface/,
    ],
    [4, "current", /generic freshness rule/],
    [5, "user", /explicit actors/],
    [7, "null", /explicit null meaning/],
    [8, "safe fallback", /safe visible fallback/],
    [9, "unknown", /unresolved status/],
    [10, "team", /lacks a concrete owner/],
    [10, "backend", /lacks a concrete owner/],
    [11, "implementation time", /bounded validation point/],
  ] as const)(
    "flow-critical data contract rejects unresolved column %i",
    (column, value, pattern) => {
      const session = setTableCell(
        validSession(),
        "## Content and Data Contract",
        0,
        "DATA-RETRY",
        column,
        value,
      );
      expectFailure(session, pattern);
    },
  );

  test("strict acceptance context requires a state-changing action", () => {
    const scenarioSha256 = "d".repeat(64);
    let session = strictBoundSession(scenarioSha256);
    session = table(session, "## Flow", [
      "| ACT-VIEW | read | Operator may view failed transactions | detail is open | not_applicable(reason=read action has no submission) | not_applicable(reason=read action has no mutation progress) | detail renders | show load error and allow refresh | not_applicable(reason=read action has no state transition) | ACC-001 |",
    ]);
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "<fixture>",
        strictAcceptanceContext(scenarioSha256),
      ),
    ).toThrow(/requires a state_change action/);
  });

  test("rejects placeholders, empty cells, false blockers and ambiguous permission controls", () => {
    expectFailure(
      validSession().replace(
        "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=enabled; enabled_when=transaction status is failed.",
        "actor=Supervisor; required_role=Supervisor; capability_action=ACT-RETRY; control=enabled; enabled_when=transaction status is failed with $Amount.",
      ),
      /fill-in/,
    );
    expectFailure(
      setTableCell(validSession(), "# Prototype", 0, "text prototype", 5, ""),
      /empty table cell/,
    );
    expectFailure(
      validSession().replace(
        "- Blockers: BLK-G6-001; blocks=G6; evidence=checkpoint 1 lacks design delivery approval and Product Designer revalidation; owner=current user; unblock=approve the design delivery or request changes",
        "- Blockers: BLK-ACC-004; blocks=ACC-004; evidence=future outcome measurement is not complete; owner=product team; unblock=measure the optional outcome later",
      ),
      /non-delivery item/,
    );
    expectFailure(
      validSession().replace(
        "- Blockers: BLK-G6-001; blocks=G6; evidence=checkpoint 1 lacks design delivery approval and Product Designer revalidation; owner=current user; unblock=approve the design delivery or request changes",
        "- Blockers: none",
      ),
      /waiting_approval checkpoint does not identify/,
    );
    expectFailure(
      validSession().replace(
        "- Blockers: BLK-G6-001; blocks=G6; evidence=checkpoint 1 lacks design delivery approval and Product Designer revalidation; owner=current user; unblock=approve the design delivery or request changes",
        "- Blockers: BLK-G5-001; blocks=G5; evidence=checkpoint 1 lacks design delivery approval; owner=current user; unblock=approve the design delivery",
      ),
      /does not block the current gate/,
    );
    expectFailure(
      validSession().replace(
        "- Blockers: BLK-G6-001; blocks=G6; evidence=checkpoint 1 lacks design delivery approval and Product Designer revalidation; owner=current user; unblock=approve the design delivery or request changes",
        "- Blockers: BLK-G6-001 blocks terminal handoff until approval",
      ),
      /not canonical/,
    );
    expectFailure(
      validSession().replace(
        "actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=not_rendered; denial=retry is not permitted; permission_route_action=ACT-RETURN.",
        "actor=Operator; required_role=Supervisor; capability_action=ACT-RETRY; control=disabled or hidden; denial=retry is not permitted; permission_route_action=ACT-RETURN.",
      ),
      /(without actor and control state|ambiguous)/,
    );
  });

  test("hidden HTML comments cannot satisfy managed contracts or risks", () => {
    const hiddenFlow = validSession()
      .replace("## Flow\n", "## Flow\n\n<!--\n")
      .replace(
        "\n## Content and Information Hierarchy",
        "\n-->\n\n## Content and Information Hierarchy",
      );
    expectFailure(hiddenFlow, /table headers drifted|Flow lacks/);

    const hiddenRisk = validSession().replace(
      /- Open risk and approved exception references:.*\n/,
      (line) => `<!-- ${line.trim()} -->\n`,
    );
    expectFailure(hiddenRisk, /unresolved Open risk|not preserved as unproven/);
  });

  test("destructive state changes require confirmation and recovery policy", () => {
    const session = setTableCell(
      validSession(),
      "## Flow",
      0,
      "ACT-RETRY",
      3,
      "risk_class=destructive; confirmation=none; reauthentication=not_applicable; undo_policy=none; retention_policy=unknown",
    );
    expectFailure(session, /destructive action.*lacks confirmation/);
  });

  test("Validation requiredness and method stay bound to Acceptance", () => {
    expectFailure(
      setTableCell(validSession(), "# Validation Log", 3, "ACC-001", 4, "no"),
      /requiredness or method drifted/,
    );
    expectFailure(
      setTableCell(
        validSession(),
        "# Validation Log",
        3,
        "ACC-001",
        8,
        "invented evidence",
      ),
      /lacks concrete evidence/,
    );
  });

  test.each([
    ["persona", "codex.product-designer@999", /invalid persona/],
    [
      "workflow_revision",
      "opendock.product-designer-workflow@999",
      /invalid workflow_revision/,
    ],
    [
      "protocol_revision",
      "opendock.product-designer-session-protocol@999",
      /invalid protocol_revision/,
    ],
    ["delivery_profile", "spaceship", /invalid delivery_profile/],
    ["mode_reason", "TODO", /invalid mode_reason/],
  ] as const)("rejects invalid resume metadata %s", (field, value, pattern) => {
    expectCoreFailure(setFront(validSession(), { [field]: value }), pattern);
  });

  test("persistent SESSION rejects raw sensitive values", () => {
    for (const secret of [
      "person@example.com",
      "123-45-6789",
      "https://user:pass@example.com/path",
      "https://example.com/?access_token=secret-value",
      `sk-live-${"a".repeat(24)}`,
    ]) {
      expectFailure(
        validSession().replace(
          "- Later or unknown: ACC-004 timing evidence",
          `- Later or unknown: ${secret}`,
        ),
        /unredacted sensitive data/,
      );
    }
  });

  test("structured outcome matching binds value, unit, direction and subject", () => {
    const scenarioSha256 = "f".repeat(64);
    const context = {
      ...strictAcceptanceContext(scenarioSha256),
      unprovenOutcomeMetric: {
        value: 30,
        unit: "percent" as const,
        direction: "decrease" as const,
        subjectTokens: ["handling time"],
      },
      unprovenOutcomeTokens: undefined,
    };
    const baseline = strictBoundSession(scenarioSha256);
    expect(() =>
      assertProductDesignerOutput(baseline, template, "<fixture>", context),
    ).not.toThrow();
    const durationImprovement = setTableCell(
      baseline,
      "# Acceptance Contract",
      0,
      "ACC-004",
      1,
      "Median handling time improves by at least 30 percent",
    );
    expect(() =>
      assertProductDesignerOutput(
        durationImprovement,
        template,
        "<fixture>",
        context,
      ),
    ).not.toThrow();
    const reducingOutcome = setTableCell(
      baseline,
      "# Acceptance Contract",
      0,
      "ACC-004",
      1,
      "The goal of reducing handling time by 30 percent remains unproven",
    );
    expect(() =>
      assertProductDesignerOutput(
        reducingOutcome,
        template,
        "<fixture>",
        context,
      ),
    ).not.toThrow();
    for (const claim of [
      "30 users viewed the flow",
      "Handling time decreases for 300 users",
      "Handling time increases by 30 percent",
    ]) {
      const session = setTableCell(
        baseline,
        "# Acceptance Contract",
        0,
        "ACC-004",
        1,
        claim,
      );
      expect(() =>
        assertProductDesignerOutput(session, template, "<fixture>", context),
      ).toThrow(/unmeasured outcome/);
    }
  });

  test("unproven outcome cannot be contradicted by a separate proof claim", () => {
    const scenarioSha256 = "f".repeat(64);
    const context = {
      ...strictAcceptanceContext(scenarioSha256),
      unprovenOutcomeTokens: undefined,
      unprovenOutcomeMetric: {
        value: 30,
        unit: "percent" as const,
        direction: "decrease" as const,
        subjectTokens: ["handling time"],
      },
    };
    const session = strictBoundSession(scenarioSha256).replace(
      "DATA-RETURN is unproven until validation_point=before:implementation-start; expected_evidence=versioned failed-inbox navigation contract.",
      "DATA-RETURN is unproven until validation_point=before:implementation-start; expected_evidence=versioned failed-inbox navigation contract.\nThe 30 percent reduction is proven and released.",
    );
    expect(() =>
      assertProductDesignerOutput(
        session,
        template,
        "outcome-contradiction",
        context,
      ),
    ).toThrow(/contradicts the unproven outcome metric/);
  });

  test("state-change acceptance and prototype claims must be bounded", () => {
    expectFailure(
      setTableCell(
        validSession(),
        "# Acceptance Contract",
        0,
        "ACC-001",
        4,
        "ACT-RETRY banana",
      ),
      /lacks a bounded claim or threshold/,
    );
    expectFailure(
      setTableCell(
        validSession(),
        "# Prototype",
        0,
        "text prototype",
        4,
        "action=ACT-RETRY; acceptance_set=ACC-001, ACC-002; claim=ACT-RETRY banana",
      ),
      /lacks a bounded claim/,
    );
  });

  test("duplicate semantic state rows are rejected", () => {
    const rows = tableRows(validSession(), "## State Matrix");
    const session = table(validSession(), "## State Matrix", [
      ...rows.map(formatRow),
      formatRow(rows.find((row) => row[0] === "error")!),
    ]);
    expectFailure(session, /duplicated error semantics/);
  });

  test("accessibility focus proof cannot omit the state-changing action", () => {
    const session = validSession().replace(
      "keyboard_path=target:failed-inbox -> action:ACT-RETRY -> target:retry-status",
      "keyboard_path=target:failed-inbox -> target:retry-status",
    );
    expectFailure(session, /keyboard_path omits its state-changing action/);
  });

  test("accessibility validation may repeat the exact artifact token as a canonical evidence assignment", () => {
    const session = setTableCell(
      validSession(),
      "# Validation Log",
      3,
      "ACC-005",
      8,
      "acceptance=ACC-005; evidence=SESSION.md#prototype@fixture-revision; focus_success=target:retry-success; focus_failure=target:retry-error",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("accessibility validation may label the exact artifact token as prototype evidence", () => {
    const session = setTableCell(
      validSession(),
      "# Validation Log",
      3,
      "ACC-005",
      8,
      "EVD-005; prototype=SESSION.md#prototype@fixture-revision",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("accessibility validation rejects a canonical evidence assignment for another revision", () => {
    const session = setTableCell(
      validSession(),
      "# Validation Log",
      3,
      "ACC-005",
      8,
      "acceptance=ACC-005; evidence=SESSION.md#prototype@another-revision",
    );
    expectFailure(session, /evidence does not match its Prototype artifact/);
  });

  test("accessibility structure may explicitly disclaim formal WCAG conformance", () => {
    const session = setTableCell(
      validSession(),
      "# Acceptance Contract",
      0,
      "ACC-005",
      1,
      "Keyboard and post-action focus behavior is specified without claiming formal WCAG conformance",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("accessibility structure may treat WCAG AA as a design structure target while conformance remains separate", () => {
    const session = setTableCell(
      validSession(),
      "# Acceptance Contract",
      0,
      "ACC-005",
      1,
      "Keyboard and post-action focus behavior is specified while treating WCAG AA as accessibility structure for this delivery boundary",
    );
    expect(() => assertProductDesignerOutput(session, template)).not.toThrow();
  });

  test("Structure evidence cannot make an affirmative WCAG conformance claim", () => {
    const session = setTableCell(
      validSession(),
      "# Acceptance Contract",
      0,
      "ACC-005",
      1,
      "Keyboard and post-action focus behavior can be implemented to WCAG AA",
    );
    expectFailure(session, /Structure evidence cannot pass a WCAG conformance/);
  });
});
