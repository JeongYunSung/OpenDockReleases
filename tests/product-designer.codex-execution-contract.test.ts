import { describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertProductDesignerCodexExecutionContract,
  prepareAcceptanceTargetParent,
} from "./workspace-collection.codex-acceptance.ts";

const project = "/tmp/opendock-product-designer-contract";
const target = ".opendock/runs/product-designer/acceptance/SESSION.md";
const absoluteTarget = join(project, target);

function jsonl(events: readonly unknown[]): string {
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

function session(
  mode: "quick" | "guided" | "deep" = "guided",
  count = 0,
  changeRows: readonly string[] = [],
): string {
  return `---
mode: ${mode}
mode_decision_turn_count: ${count}
---

# Change Log

| Event ID | Checkpoint Revision | Occurred At | Actor | Change | Reason | Source revision |
| -------- | ------------------- | ----------- | ----- | ------ | ------ | --------------- |
${changeRows.join("\n")}
`;
}

function modeMessage(
  text = "작업 깊이: Guided | 이유: 이미 정해진 범위 안에서 상태와 권한 설계를 검증해야 함 | 예상 설계 결정 왕복: 3회",
  id = "message-mode",
): unknown {
  return {
    type: "item.completed",
    item: { id, type: "agent_message", text },
  };
}

function writeReadiness(id = "message-ready"): unknown {
  return {
    type: "item.completed",
    item: {
      id,
      type: "agent_message",
      text: "저장 준비: 초안 구성 및 자체 검토 완료 | 승인: AP-ACCEPT-001 | 다음 변경: 승인 경로 1회 생성",
    },
  };
}

function fileChange(
  eventType: "item.started" | "item.completed",
  options: {
    id?: string;
    path?: string;
    kind?: string;
    status?: string;
  } = {},
): unknown {
  return {
    type: eventType,
    item: {
      id: options.id ?? "change-1",
      type: "file_change",
      changes: [
        {
          path: options.path ?? absoluteTarget,
          kind: options.kind ?? "add",
        },
      ],
      status:
        options.status ??
        (eventType === "item.completed" ? "completed" : "in_progress"),
    },
  };
}

function command(
  eventType: "item.started" | "item.completed",
  value: string,
  options: {
    id?: string;
    status?: string;
    exitCode?: number;
    aggregatedOutput?: string;
  } = {},
): unknown {
  return {
    type: eventType,
    item: {
      id: options.id ?? "read-1",
      type: "command_execution",
      command: value,
      status:
        options.status ??
        (eventType === "item.completed" ? "completed" : "in_progress"),
      ...(eventType === "item.completed"
        ? {
            exit_code: options.exitCode ?? 0,
            ...(options.aggregatedOutput === undefined
              ? {}
              : { aggregated_output: options.aggregatedOutput }),
          }
        : {}),
    },
  };
}

function validEvents(
  mode = modeMessage(),
  readCommand = "/bin/zsh -lc pwd",
): unknown[] {
  return [
    { type: "thread.started", thread_id: "thread-1" },
    { type: "turn.started" },
    mode,
    command("item.started", readCommand),
    command("item.completed", readCommand),
    writeReadiness(),
    fileChange("item.started"),
    fileChange("item.completed"),
    {
      type: "item.completed",
      item: {
        id: "message-final",
        type: "agent_message",
        text: "SESSION checkpoint를 작성했습니다.",
      },
    },
    { type: "turn.completed", usage: { input_tokens: 1 } },
  ];
}

function assertContract(events: readonly unknown[], output = session()): void {
  assertProductDesignerCodexExecutionContract(
    jsonl(events),
    project,
    target,
    output,
  );
}

describe("Product Designer Codex ordered execution contract", () => {
  test("accepts the actual zsh-wrapped read lifecycle and one atomic add", () => {
    expect(() => assertContract(validEvents())).not.toThrow();
  });

  test("accepts quoted mutation words as an rg pattern and read-only pipelines", () => {
    const read =
      '/bin/zsh -lc \'rg -n "writeFileSync|Bun.write" docs | head -20 && sed -n "1,40p" README.md\'';
    expect(() =>
      assertContract(validEvents(modeMessage(), read)),
    ).not.toThrow();
  });

  test("accepts an actual zsh-wrapped rg alternation and end anchor", () => {
    const read =
      "/bin/zsh -lc 'rg -n \"''^#|''^##|''^---$|SESSION|table_arity|front matter|Approval Log|Validation Log|Change Log\" .opendock/docks/product-designer/SESSION_PROTOCOL.md .opendock/templates/product-designer/DESIGN_SESSION.md'";
    expect(() =>
      assertContract(validEvents(modeMessage(), read)),
    ).not.toThrow();
  });

  test("accepts the actual stderr-suppressed read command form", () => {
    expect(() =>
      assertContract(
        validEvents(modeMessage(), "/bin/zsh -lc 'ls missing 2>/dev/null'"),
      ),
    ).not.toThrow();
  });

  test("accepts a project-confined find piped to argument-free sort", () => {
    expect(() =>
      assertContract(
        validEvents(
          modeMessage(),
          "/bin/zsh -c 'find .opendock/docks/product-designer -maxdepth 1 -type f | sort'",
        ),
      ),
    ).not.toThrow();
  });

  test("rejects sort operands and output options", () => {
    for (const read of [
      "/bin/zsh -c 'sort SESSION.md'",
      "/bin/zsh -c 'sort -o SESSION.md'",
    ]) {
      expect(() => assertContract(validEvents(modeMessage(), read))).toThrow(
        /program sort is not read-only/,
      );
    }
  });

  test("accepts project-root-confined read commands", () => {
    for (const read of [
      "/bin/zsh -lc 'cat README.md'",
      "/bin/zsh -lc 'find . -name DESIGN.md'",
    ]) {
      expect(() =>
        assertContract(validEvents(modeMessage(), read)),
      ).not.toThrow();
    }
  });

  test("accepts ripgrep exit 1 with empty output as an expected project-local no-match", () => {
    const read = "/bin/zsh -lc \"rg --files -g 'DESIGN.md'\"";
    const events = validEvents(modeMessage(), read);
    events[4] = command("item.completed", read, {
      status: "failed",
      exitCode: 1,
      aggregatedOutput: "",
    });
    expect(() => assertContract(events)).not.toThrow();
  });

  test("rejects nonempty ripgrep failures and non-ripgrep exit 1", () => {
    for (const [read, output] of [
      ["/bin/zsh -lc \"rg --files -g 'DESIGN.md'\"", "permission denied"],
      ["/bin/zsh -lc 'cat missing'", ""],
    ] as const) {
      const events = validEvents(modeMessage(), read);
      events[4] = command("item.completed", read, {
        status: "failed",
        exitCode: 1,
        aggregatedOutput: output,
      });
      expect(() => assertContract(events)).toThrow(
        /invalid or unsuccessful completed lifecycle/,
      );
    }
  });

  test.each([
    ["Quick", 0, "quick"],
    ["Quick", 2, "quick"],
    ["Guided", 3, "guided"],
    ["Guided", 7, "guided"],
    ["Deep", 0, "deep"],
    ["Deep", 1, "deep"],
  ] as const)(
    "accepts %s mode with a bounded %i-turn estimate",
    (mode, turns, finalMode) => {
      const declaration = modeMessage(
        `작업 깊이: ${mode} | 이유: 현재 근거와 위험에 맞는 구체적인 작업 깊이 | 예상 설계 결정 왕복: ${turns}회`,
      );
      expect(() =>
        assertContract(validEvents(declaration), session(finalMode)),
      ).not.toThrow();
    },
  );

  test("accepts a documented upward mode transition with a reset count", () => {
    const output = session("guided", 0, [
      "| EVT-001 | 1 | 2026-07-13T00:00:00Z | AI | previous_mode=quick -> new_mode=guided; mode_decision_turn_count reset=0 | 새 blocking 상태 발견 | SCENARIO.md |",
    ]);
    const quick = modeMessage(
      "작업 깊이: Quick | 이유: 처음에는 승인된 작은 변경으로 판단함 | 예상 설계 결정 왕복: 0회",
    );
    expect(() => assertContract(validEvents(quick), output)).not.toThrow();
  });

  test.each([
    "Guided mode로 진행합니다.",
    "작업 깊이: Guided | 이유: 구체적 검증 필요 | 예상 설계 결정 왕복: 세 번",
    "작업 깊이: Guided | 이유: ... | 예상 설계 결정 왕복: 3회",
  ])("rejects an invalid first message: %s", (text) => {
    const events = validEvents(modeMessage(text));
    if (text.startsWith("작업 깊이:")) {
      (events[2] as { item: { text: string } }).item.text = text;
    }
    expect(() => assertContract(events)).toThrow(/first agent message/);
  });

  test.each([
    ["Quick", 3],
    ["Guided", 2],
    ["Guided", 8],
  ])("rejects %s mode with %i expected turns", (mode, turns) => {
    const declaration = modeMessage(
      `작업 깊이: ${mode} | 이유: 구체적인 범위와 위험 판단 | 예상 설계 결정 왕복: ${turns}회`,
    );
    expect(() => assertContract(validEvents(declaration))).toThrow(
      /outside the selected mode/,
    );
  });

  test.each([
    command("item.started", "/bin/zsh -lc pwd"),
    fileChange("item.started"),
  ])("rejects any actionable tool before the mode declaration", (early) => {
    const events = validEvents();
    events.splice(2, 0, early);
    expect(() => assertContract(events)).toThrow(/before declaring its mode/);
  });

  test("rejects mismatched, downward, undocumented upward and nonzero final mode state", () => {
    expect(() => assertContract(validEvents(), session("quick"))).toThrow(
      /documented upward SESSION mode transition/,
    );
    const deep = modeMessage(
      "작업 깊이: Deep | 이유: 안전과 데이터 위험을 깊게 확인해야 함 | 예상 설계 결정 왕복: 5회",
    );
    expect(() => assertContract(validEvents(deep), session("guided"))).toThrow(
      /documented upward SESSION mode transition/,
    );
    const quick = modeMessage(
      "작업 깊이: Quick | 이유: 승인된 작은 변경으로 판단함 | 예상 설계 결정 왕복: 0회",
    );
    expect(() => assertContract(validEvents(quick), session("guided"))).toThrow(
      /documented upward SESSION mode transition/,
    );
    expect(() => assertContract(validEvents(), session("guided", 1))).toThrow(
      /mode_decision_turn_count at 0/,
    );
  });

  test.each([
    "/bin/zsh -lc 'mkdir -p .opendock/runs'",
    `/bin/zsh -lc \"python -c 'open(\\\"${target}\\\",\\\"w\\\").write(\\\"x\\\")'\"`,
    "/bin/zsh -lc 'sh -c \"touch hidden\"'",
    `/bin/sh -c 'printf x > ${target}'`,
    '/bin/zsh -lc \'node -e "require(\\"fs\\").writeFileSync(\\"x\\",\\"y\\")"\'',
    '/bin/zsh -lc \'bun -e "Bun.write(\\"x\\",\\"y\\")"\'',
    "/bin/zsh -lc 'sed -i s/a/b/ README.md'",
    "/bin/zsh -lc 'find . -exec rm {} ;'",
    "/bin/zsh -lc 'rg --pre=touch pattern .'",
    "/bin/zsh -lc 'rg \"$(touch /tmp/hidden)\" docs'",
    "/bin/zsh -lc 'rg x docs\ntouch /tmp/hidden'",
    "/bin/zsh -lc 'date --set 2026-01-01'",
    "/bin/zsh -lc 'sed -ni s/a/b/ README.md'",
    "/bin/zsh -lc 'sed -i.bak s/a/b/ README.md'",
    "/bin/zsh -lc 'sed -ibak1 s/a/b/ README.md'",
    "/bin/zsh -lc './cat README.md'",
    "/bin/zsh -lc './zsh -c pwd'",
    "/bin/zsh -lc 'cat /tmp/PD_CREDENTIAL_CANARY.txt'",
    "/bin/zsh -lc 'find .. -name DESIGN.md'",
  ])("rejects a wrapped or interpreted mutation command: %s", (value) => {
    expect(() => assertContract(validEvents(modeMessage(), value))).toThrow(
      /outside the cooperative read-only allowlist/,
    );
  });

  test("rejects command lifecycle omissions, status drift and payload drift", () => {
    const base = validEvents();
    expect(() =>
      assertContract(base.filter((_, index) => index !== 4)),
    ).toThrow(/exactly one started and one completed/);
    expect(() =>
      assertContract(base.filter((_, index) => index !== 3)),
    ).toThrow(/invalid or unsuccessful completed lifecycle/);
    const badStatus = [...base];
    badStatus[3] = command("item.started", "/bin/zsh -lc pwd", {
      status: "completed",
    });
    expect(() => assertContract(badStatus)).toThrow(
      /invalid started lifecycle/,
    );
    const drift = [...base];
    drift[4] = command("item.completed", "/bin/zsh -lc 'rg x .' ");
    expect(() => assertContract(drift)).toThrow(/changed command_execution/);

    const failed = [...base];
    failed[4] = command("item.completed", "/bin/zsh -lc pwd", {
      exitCode: 1,
    });
    expect(() => assertContract(failed)).toThrow(
      /unsuccessful completed lifecycle/,
    );

    const missingExitCode = [...base];
    delete (missingExitCode[4] as { item: { exit_code?: number } }).item
      .exit_code;
    expect(() => assertContract(missingExitCode)).toThrow(
      /unsuccessful completed lifecycle/,
    );
  });

  test("rejects duplicate completed telemetry and changed duplicate payloads", () => {
    const events = validEvents();
    events.splice(8, 0, fileChange("item.completed"));
    expect(() => assertContract(events)).toThrow(/invalid completed lifecycle/);

    const changed = validEvents();
    changed.splice(
      8,
      0,
      fileChange("item.completed", { path: join(project, "unexpected.md") }),
    );
    expect(() => assertContract(changed)).toThrow(/outside .*SESSION\.md/);
  });

  test("rejects every malformed file_change lifecycle variant", () => {
    const completedOnly = validEvents().filter((_, index) => index !== 6);
    expect(() => assertContract(completedOnly)).toThrow(
      /invalid completed lifecycle/,
    );

    const startedOnly = validEvents().filter((_, index) => index !== 7);
    expect(() => assertContract(startedOnly)).toThrow(
      /exactly one started and one completed/,
    );

    const duplicateStarted = validEvents();
    duplicateStarted.splice(7, 0, fileChange("item.started"));
    expect(() => assertContract(duplicateStarted)).toThrow(
      /invalid started lifecycle/,
    );

    for (const replacement of [
      fileChange("item.started", { kind: "update" }),
      fileChange("item.started", { status: "failed" }),
      fileChange("item.started", { path: join(project, "unexpected.md") }),
      fileChange("item.completed", { kind: "update" }),
      fileChange("item.completed", { status: "failed" }),
    ]) {
      const events = validEvents();
      const isStarted =
        (replacement as { type: string }).type === "item.started";
      events[isStarted ? 6 : 7] = replacement;
      expect(() => assertContract(events)).toThrow();
    }
  });

  test("rejects a second file-change item and cross-type item-id reuse", () => {
    const second = validEvents();
    second.splice(
      8,
      0,
      fileChange("item.started", { id: "change-2" }),
      fileChange("item.completed", { id: "change-2" }),
    );
    expect(() => assertContract(second)).toThrow(
      /exactly one file_change|used a tool after/,
    );

    const reused = validEvents();
    reused[6] = fileChange("item.started", { id: "read-1" });
    reused[7] = fileChange("item.completed", { id: "read-1" });
    expect(() => assertContract(reused)).toThrow(/reuses item id/);
  });

  test("rejects missing and duplicate ids for agent messages", () => {
    const missing = validEvents();
    delete (missing[2] as { item: { id?: string } }).item.id;
    expect(() => assertContract(missing)).toThrow(/lacks an item id/);

    const duplicate = validEvents();
    (duplicate[5] as { item: { id: string } }).item.id = "message-mode";
    expect(() => assertContract(duplicate)).toThrow(/duplicates agent_message/);
  });

  test.each([
    {},
    { type: "unknown.event" },
    { type: "item.completed", item: { id: "x", type: "mcp_tool_call" } },
    { type: "item.completed", item: { id: "x", type: "web_search" } },
    { type: "turn.started", item: { id: "hidden", type: "file_change" } },
  ])("fails closed on malformed or unknown event evidence", (badEvent) => {
    const events = validEvents();
    events.splice(3, 0, badEvent);
    expect(() => assertContract(events)).toThrow();
  });

  test("rejects turn completion before the write and tools after completion", () => {
    const earlyTurn = validEvents();
    earlyTurn.splice(3, 0, { type: "turn.completed" });
    expect(() => assertContract(earlyTurn)).toThrow(/after turn.completed/);

    const lateTool = validEvents();
    lateTool.splice(-1, 0, {
      type: "item.completed",
      item: { id: "mcp-1", type: "mcp_tool_call", status: "completed" },
    });
    expect(() => assertContract(lateTool)).toThrow(/unknown item type/);
  });

  test("requires a final agent message between the write and turn completion", () => {
    const events = validEvents();
    events.splice(8, 1);
    expect(() => assertContract(events)).toThrow(/final agent message/);

    const empty = validEvents();
    (empty[8] as { item: { text: string } }).item.text = "  ";
    expect(() => assertContract(empty)).toThrow(/lacks nonempty text/);
  });

  test("rejects malformed JSON and altered write readiness", () => {
    expect(() =>
      assertProductDesignerCodexExecutionContract(
        `${JSON.stringify(modeMessage())}\nnot-json\n`,
        project,
        target,
        session(),
      ),
    ).toThrow(/not valid JSON/);

    const events = validEvents();
    (events[5] as { item: { text: string } }).item.text =
      "저장할 준비가 되었습니다.";
    expect(() => assertContract(events)).toThrow(
      /write-readiness message once/,
    );
  });

  test("accepts telemetry trailing whitespace around the exact write readiness line", () => {
    const events = validEvents();
    (events[5] as { item: { text: string } }).item.text =
      "저장 준비: 초안 구성 및 자체 검토 완료 | 승인: AP-ACCEPT-001 | 다음 변경: 승인 경로 1회 생성\n";
    expect(() => assertContract(events)).not.toThrow();

    (events[5] as { item: { text: string } }).item.text += "추가 문장";
    expect(() => assertContract(events)).toThrow(
      /write-readiness message once/,
    );
  });
});

describe("Product Designer acceptance target parent preparation", () => {
  test("creates each absent ancestor without creating the target", () => {
    const root = mkdtempSync(join(tmpdir(), "opendock-pd-parent-"));
    try {
      prepareAcceptanceTargetParent(root, target);
      expect(
        existsSync(join(root, ".opendock/runs/product-designer/acceptance")),
      ).toBe(true);
      expect(existsSync(join(root, target))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("rejects a symlink in the target parent chain", () => {
    const root = mkdtempSync(join(tmpdir(), "opendock-pd-parent-"));
    const outside = mkdtempSync(join(tmpdir(), "opendock-pd-outside-"));
    try {
      mkdirSync(join(root, ".opendock"));
      symlinkSync(outside, join(root, ".opendock/runs"));
      expect(() => prepareAcceptanceTargetParent(root, target)).toThrow(
        /must be a real directory/,
      );
      expect(existsSync(join(outside, "product-designer"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test("rejects case-folded and Unicode-normalized target aliases before writing", () => {
    const root = mkdtempSync(join(tmpdir(), "opendock-pd-parent-"));
    try {
      prepareAcceptanceTargetParent(root, target);
      writeFileSync(
        join(root, ".opendock/runs/product-designer/acceptance/session.md"),
        "existing\n",
      );
      expect(() => prepareAcceptanceTargetParent(root, target)).toThrow(
        /alias collision/,
      );

      mkdirSync(join(root, ".opendock/runs/cafe\u0301"));
      expect(() =>
        prepareAcceptanceTargetParent(
          root,
          ".opendock/runs/caf\u00e9/SESSION.md",
        ),
      ).toThrow(/alias collision/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
