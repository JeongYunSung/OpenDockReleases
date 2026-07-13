import { existsSync, lstatSync, rmSync, writeFileSync } from "node:fs";
import { REPORT_SCHEMA } from "./constants.mjs";
import {
  assertDistinctPaths,
  prepareProjectOutput,
  requireExtension
} from "./paths.mjs";
import { ffmpegPrefix, runFfmpeg } from "./process.mjs";
import { probeProjectMedia, verifyProbe } from "./probe.mjs";

export function writeReport(target, report, overwrite) {
  writeFileSync(target.full, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: "utf8",
    flag: overwrite ? "w" : "wx"
  });
}

export function operationReport(command, input, output, options, sourceProbe, outputProbe, checks, intent) {
  return {
    schema: REPORT_SCHEMA,
    command,
    createdAt: new Date().toISOString(),
    input,
    output,
    options,
    intent,
    sourceProbe,
    outputProbe,
    verification: {
      status: "passed",
      checks
    }
  };
}

function cleanupFailedNewOutput(target) {
  if (!target.existed && existsSync(target.full)) {
    const stat = lstatSync(target.full);
    if (!stat.isSymbolicLink() && stat.isFile()) {
      rmSync(target.full, { force: true });
    }
  }
}

export async function executeMediaOperation({
  command,
  projectRoot,
  input,
  output,
  report,
  overwrite,
  args,
  options,
  sourceProbe,
  expected,
  intent,
  extraInputs = []
}) {
  requireExtension(report, [".json"], "report");
  const outputTarget = prepareProjectOutput(projectRoot, output, overwrite, "output");
  const reportTarget = prepareProjectOutput(projectRoot, report, overwrite, "report");
  assertDistinctPaths([
    { ...input, label: "input" },
    ...extraInputs.map((entry) => ({ ...entry, label: entry.label })),
    { ...outputTarget, label: "output" },
    { ...reportTarget, label: "report" }
  ]);
  try {
    await runFfmpeg([...ffmpegPrefix(overwrite), ...args, outputTarget.rel], projectRoot);
    const outputProbe = await probeProjectMedia(projectRoot, outputTarget.rel);
    const checks = verifyProbe(outputProbe, expected);
    const result = operationReport(
      command,
      input.rel,
      outputTarget.rel,
      options,
      sourceProbe,
      outputProbe,
      checks,
      intent
    );
    writeReport(reportTarget, result, overwrite);
    return { output: outputTarget.rel, report: reportTarget.rel, verification: result.verification };
  } catch (error) {
    cleanupFailedNewOutput(outputTarget);
    throw error;
  }
}
