import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORPCError } from "@orpc/client";

const resumeServiceMock = vi.hoisted(() => ({
	getById: vi.fn(),
	analysis: {
		upsert: vi.fn(),
	},
}));

const analyzeWithCodeQuestAtsMock = vi.hoisted(() => vi.fn());
const serializeResumeTextForAtsMock = vi.hoisted(() => vi.fn());
const mapCodeQuestResponseToResumeAnalysisMock = vi.hoisted(() => vi.fn());

vi.mock("../resume/service", () => ({ resumeService: resumeServiceMock }));
vi.mock("./client", () => ({
	analyzeWithCodeQuestAts: analyzeWithCodeQuestAtsMock,
	CodeQuestAtsUnavailableError: class CodeQuestAtsUnavailableError extends Error {},
	CodeQuestAtsInvalidResponseError: class CodeQuestAtsInvalidResponseError extends Error {},
}));
vi.mock("./serialize-resume-text", () => ({
	serializeResumeTextForAts: serializeResumeTextForAtsMock,
}));
vi.mock("./map-response", () => ({
	mapCodeQuestResponseToResumeAnalysis: mapCodeQuestResponseToResumeAnalysisMock,
}));

const { analyzeResumeWithCodeQuest } = await import("./service");

describe("analyzeResumeWithCodeQuest", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resumeServiceMock.getById.mockResolvedValue({ id: "resume-1", data: { basics: { name: "Alex" } } });
		serializeResumeTextForAtsMock.mockReturnValue("Resume text");
		analyzeWithCodeQuestAtsMock.mockResolvedValue({ score: { final: 44 } });
		mapCodeQuestResponseToResumeAnalysisMock.mockReturnValue({
			overallScore: 44,
			scorecard: [{ dimension: "Required skill coverage", score: 61, rationale: "Matched 6 of 7 required skills." }],
			strengths: ["Required skill matched: SQL"],
			suggestions: [
				{
					title: "Add required skill: data visualization",
					impact: "high",
					why: "Missing",
					exampleRewrite: null,
					copyPrompt: "Update",
				},
			],
		});
		resumeServiceMock.analysis.upsert.mockImplementation(async ({ analysis }: { analysis: unknown }) => analysis);
	});

	it("loads the resume for the authenticated user and persists mapped analysis", async () => {
		const result = await analyzeResumeWithCodeQuest({
			userId: "user-1",
			resumeId: "resume-1",
			jdText: "Required skills: SQL",
		});

		expect(resumeServiceMock.getById).toHaveBeenCalledWith({ id: "resume-1", userId: "user-1" });
		expect(analyzeWithCodeQuestAtsMock).toHaveBeenCalledWith({
			resumeText: "Resume text",
			jdText: "Required skills: SQL",
		});
		expect(result.overallScore).toBe(44);
		expect(result.modelMeta).toEqual({ provider: "codequest-ats", model: "deterministic-v1.0.0" });
	});

	it("returns BAD_GATEWAY when the ATS service is unavailable", async () => {
		const { CodeQuestAtsUnavailableError } = await import("./client");
		analyzeWithCodeQuestAtsMock.mockRejectedValue(new CodeQuestAtsUnavailableError());

		await expect(
			analyzeResumeWithCodeQuest({
				userId: "user-1",
				resumeId: "resume-1",
				jdText: "Required skills: SQL",
			}),
		).rejects.toMatchObject({ code: "BAD_GATEWAY" });
	});

	it("returns BAD_REQUEST when serialized resume content is empty", async () => {
		serializeResumeTextForAtsMock.mockReturnValue("   \n  ");

		await expect(
			analyzeResumeWithCodeQuest({
				userId: "user-1",
				resumeId: "resume-1",
				jdText: "Required skills: SQL",
			}),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Resume content is required before analysis can run.",
		});
		expect(analyzeWithCodeQuestAtsMock).not.toHaveBeenCalled();
	});

	it("returns NOT_FOUND when the resume does not belong to the user", async () => {
		resumeServiceMock.getById.mockRejectedValue(new ORPCError("NOT_FOUND"));

		await expect(
			analyzeResumeWithCodeQuest({
				userId: "user-1",
				resumeId: "resume-2",
				jdText: "Required skills: SQL",
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
