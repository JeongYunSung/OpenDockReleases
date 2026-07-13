import { describe, expect, test } from "bun:test";
import {
	assertAcceptanceManifestMetadata,
	parseAcceptanceConcurrency,
	sanitizedChildEnvironment,
	sanitizedHarnessEnvironment,
	selectAcceptanceCases,
} from "./workspace-collection.acceptance-config.ts";

const cases = [{ name: "alpha" }, { name: "beta" }, { name: "gamma" }];

describe("Codex acceptance configuration", () => {
	test("동시성은 양의 안전한 정수만 허용한다", () => {
		expect(parseAcceptanceConcurrency(undefined)).toBe(3);
		expect(parseAcceptanceConcurrency(" 2 ")).toBe(2);
		for (const value of ["", "0", "-1", "1.5", "NaN", "abc"]) {
			expect(() => parseAcceptanceConcurrency(value)).toThrow(
				"must be a positive integer",
			);
		}
		expect(() =>
			parseAcceptanceConcurrency("999999999999999999999999"),
		).toThrow("safe integer range");
	});

	test("하네스 환경은 HOME과 Codex 인증 위치를 전달하지 않는다", () => {
		expect(
			sanitizedHarnessEnvironment({
				PATH: "/usr/bin",
				LANG: "ko_KR.UTF-8",
				HOME: "/private/home",
				CODEX_HOME: "/private/codex",
				XDG_CONFIG_HOME: "/private/config",
				OPENAI_API_KEY: "secret",
			}),
		).toEqual({ PATH: "/usr/bin", LANG: "ko_KR.UTF-8" });
	});

	test("Dock 필터는 순서를 보존하고 unknown/duplicate를 거부한다", () => {
		expect(selectAcceptanceCases(cases, undefined).map(({ name }) => name)).toEqual([
			"alpha",
			"beta",
			"gamma",
		]);
		expect(selectAcceptanceCases(cases, "gamma, alpha").map(({ name }) => name)).toEqual([
			"gamma",
			"alpha",
		]);
		expect(() => selectAcceptanceCases(cases, "missing")).toThrow(
			"unknown names: missing",
		);
		expect(() => selectAcceptanceCases(cases, "alpha,alpha")).toThrow(
			"duplicate names: alpha",
		);
	});

	test("자식 프로세스에는 실행 필수 환경만 전달한다", () => {
		const child = sanitizedChildEnvironment({
			PATH: "/usr/bin",
			HOME: "/tmp/home",
			CODEX_HOME: "/tmp/codex",
			LC_ALL: "ko_KR.UTF-8",
			LC_API_TOKEN: "secret-locale-prefix",
			OPENAI_API_KEY: "secret-openai",
			GITHUB_TOKEN: "secret-github",
			AWS_SECRET_ACCESS_KEY: "secret-aws",
			CUSTOM_VALUE: "not-required",
		});

		expect(child).toEqual({
			PATH: "/usr/bin",
			HOME: "/tmp/home",
			CODEX_HOME: "/tmp/codex",
			LC_ALL: "ko_KR.UTF-8",
		});
	});

	test("acceptance manifest metadata는 top-level exact contract를 따른다", () => {
		expect(() =>
			assertAcceptanceManifestMetadata(
				"# Run\n\nStatus: active\nLanguage: ko\n\n## Scope\n본문\n",
			),
		).not.toThrow();

		for (const invalid of [
			"# Run\nLanguage: ko\n\n## Scope\n본문\n",
			"# Run\nStatus: ready\nLanguage: ko\n\n## Scope\n본문\n",
			"# Run\nStatus: active\nStatus: active\nLanguage: ko\n\n## Scope\n본문\n",
			"# Run\nStatus: active\nLanguage: en\n\n## Scope\n본문\n",
			"# Run\n```text\nStatus: active\nLanguage: ko\n```\n\n## Scope\n본문\n",
			"# Run\n- ```text\n  Status: active\n  Language: ko\n  ```\n\n## Scope\n본문\n",
			"# Run\n<!--\nStatus: active\nLanguage: ko\n-->\n\n## Scope\n본문\n",
		]) {
			expect(() => assertAcceptanceManifestMetadata(invalid)).toThrow();
		}
	});
});
