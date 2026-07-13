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

const harnessEnvironmentKeys = new Set([
	"COLORTERM",
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
	"NO_COLOR",
	"PATH",
	"TERM",
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

export function sanitizedHarnessEnvironment(
	environment: Readonly<Record<string, string | undefined>>,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(environment)) {
		if (value !== undefined && harnessEnvironmentKeys.has(key)) {
			result[key] = value;
		}
	}
	return result;
}

export function assertAcceptanceManifestMetadata(text: string): void {
	const values = new Map<string, string[]>();
	let fence: { marker: string; length: number } | null = null;

	const structuralText = String(text).replace(/<!--[\s\S]*?-->/g, "");
	for (const line of structuralText.split(/\r?\n/)) {
		if (fence !== null) {
			const closing = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
			if (
				closing &&
				closing[1][0] === fence.marker &&
				closing[1].length >= fence.length
			) {
				fence = null;
			}
			continue;
		}

		const opening = line.match(
			/^ {0,3}(?:(?:[-+*]|\d+[.)])[ \t]+)?(`{3,}|~{3,})(.*)$/,
		);
		if (opening && !(opening[1][0] === "`" && opening[2].includes("`"))) {
			fence = { marker: opening[1][0], length: opening[1].length };
			continue;
		}
		if (/^ {0,3}#{2,6}\s+/.test(line)) break;

		const metadata = line.match(/^ {0,3}(Status|Language)\s*:\s*([^\r\n]+?)\s*$/i);
		if (!metadata) continue;
		const key = metadata[1].toLowerCase();
		values.set(key, [...(values.get(key) ?? []), metadata[2].trim().toLowerCase()]);
	}

	const statuses = values.get("status") ?? [];
	if (statuses.length !== 1 || statuses[0] !== "active") {
		throw new Error(
			`acceptance manifest must declare exactly one top-level Status: active (found ${statuses.length})`,
		);
	}

	const languages = values.get("language") ?? [];
	if (languages.length !== 1 || languages[0] !== "ko") {
		throw new Error(
			`acceptance manifest must declare exactly one top-level Language: ko (found ${languages.length})`,
		);
	}
}
