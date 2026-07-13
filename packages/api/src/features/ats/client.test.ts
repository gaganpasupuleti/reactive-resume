import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithCodeQuestAts, CodeQuestAtsInvalidResponseError, CodeQuestAtsUnavailableError } from "./client";

const envMock = vi.hoisted(() => ({
	CODEQUEST_ATS_API_URL: "http://127.0.0.1:8200",
}));

vi.mock("@reactive-resume/env/server", () => ({ env: envMock }));

afterEach(() => {
	vi.restoreAllMocks();
});

const validPayload = {
	engine_version: "1.0.0",
	score: {
		label: "Code Quest compatibility score",
		final: 44,
		components: {
			required_skill_coverage: 24.26,
			preferred_skill_coverage: 7.13,
			responsibility_alignment: 4.73,
			evidence_quality: 5.71,
			general_coverage: 1.9,
			keyword_stuffing_penalty: 0,
		},
		component_sum: 43.73,
		explanation: "Required skills matched: 6; missing: 1.",
	},
	required_skills: { matched: ["SQL"], missing: ["data visualization"] },
	preferred_skills: { matched: [], missing: [] },
	evidence: [],
	keyword_stuffing: { detected: false, reasons: [], penalty: 0, terms: [] },
};

describe("analyzeWithCodeQuestAts", () => {
	it("posts resume and job description text to the ATS service", async () => {
		const fetchImpl = vi.fn(async () => new Response(JSON.stringify(validPayload), { status: 200 }));

		const result = await analyzeWithCodeQuestAts({
			resumeText: "Resume body",
			jdText: "Job description body",
			fetchImpl,
		});

		expect(result.score.final).toBe(44);
		expect(fetchImpl).toHaveBeenCalledWith(
			"http://127.0.0.1:8200/api/v1/service/analyze",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ resume_text: "Resume body", jd_text: "Job description body" }),
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("throws when the ATS request times out", async () => {
		const fetchImpl = vi.fn((_url, init?: RequestInit) => {
			return new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener("abort", () => {
					reject(new DOMException("The operation was aborted.", "AbortError"));
				});
			});
		});

		await expect(
			analyzeWithCodeQuestAts({ resumeText: "Resume", jdText: "JD", fetchImpl, timeoutMs: 1 }),
		).rejects.toBeInstanceOf(CodeQuestAtsUnavailableError);
	});

	it("throws when the ATS service is unavailable", async () => {
		const fetchImpl = vi.fn(async () => new Response("fail", { status: 503 }));

		await expect(analyzeWithCodeQuestAts({ resumeText: "Resume", jdText: "JD", fetchImpl })).rejects.toBeInstanceOf(
			CodeQuestAtsUnavailableError,
		);
	});

	it("throws when the ATS response is invalid", async () => {
		const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ invalid: true }), { status: 200 }));

		await expect(analyzeWithCodeQuestAts({ resumeText: "Resume", jdText: "JD", fetchImpl })).rejects.toBeInstanceOf(
			CodeQuestAtsInvalidResponseError,
		);
	});
});
