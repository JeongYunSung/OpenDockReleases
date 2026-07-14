const defaultConcurrency = 3;

const preservedEnvironmentKeys = new Set([
	"CODEX_HOME",
	"COLORTERM",
	"HOME",
	"LANG",
	"LANGUAGE",
	"LC_ADDRESS",
	"LC_ALL",
	"LC_COLLATE",
	"LC_CTYPE",
	"LC_IDENTIFICATION",
	"LC_MEASUREMENT",
	"LC_MESSAGES",
	"LC_MONETARY",
	"LC_NAME",
	"LC_NUMERIC",
	"LC_PAPER",
	"LC_TELEPHONE",
	"LC_TIME",
	"LOGNAME",
	"NO_COLOR",
	"PATH",
	"SHELL",
	"TERM",
	"TMP",
	"TMPDIR",
	"TEMP",
	"USER",
	"XDG_CACHE_HOME",
	"XDG_CONFIG_HOME",
	"XDG_DATA_HOME",
	"XDG_STATE_HOME",
]);

export function parseAcceptanceConcurrency(raw: string | undefined): number {
	const value = (raw ?? String(defaultConcurrency)).trim();
	if (!/^[1-9]\d*$/.test(value)) {
		throw new Error(
			`CODEX_ACCEPTANCE_CONCURRENCY must be a positive integer, received: ${JSON.stringify(raw)}`,
		);
	}

	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) {
		throw new Error(
			`CODEX_ACCEPTANCE_CONCURRENCY is outside the safe integer range: ${value}`,
		);
	}
	return parsed;
}

export function selectAcceptanceCases<T extends { name: string }>(
	cases: readonly T[],
	raw: string | undefined,
): T[] {
	const requested = (raw ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
	if (requested.length === 0) return [...cases];

	const duplicates = requested.filter(
		(name, index) => requested.indexOf(name) !== index,
	);
	if (duplicates.length > 0) {
		throw new Error(
			`CODEX_ACCEPTANCE_DOCKS contains duplicate names: ${[...new Set(duplicates)].join(", ")}`,
		);
	}

	const byName = new Map(cases.map((acceptance) => [acceptance.name, acceptance]));
	const unknown = requested.filter((name) => !byName.has(name));
	if (unknown.length > 0) {
		throw new Error(
			`CODEX_ACCEPTANCE_DOCKS contains unknown names: ${unknown.join(", ")}`,
		);
	}

	const selected = requested.map((name) => byName.get(name) as T);
	if (selected.length === 0) {
		throw new Error("CODEX_ACCEPTANCE_DOCKS did not select any acceptance cases.");
	}
	return selected;
}

export function sanitizedChildEnvironment(
	environment: Readonly<Record<string, string | undefined>>,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(environment)) {
		if (value === undefined) continue;
		if (preservedEnvironmentKeys.has(key)) {
			result[key] = value;
		}
	}
	return result;
}
