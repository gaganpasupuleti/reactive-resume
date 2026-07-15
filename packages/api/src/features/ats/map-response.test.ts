import { describe, expect, it } from "vitest";
import { mapCodeQuestResponseToResumeAnalysis } from "./map-response";
import { codeQuestAnalyzeResponseSchema } from "./schema";

const fixtureAResponse = codeQuestAnalyzeResponseSchema.parse({
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
	required_skills: {
		matched: ["SQL", "Python", "Excel", "statistical analysis", "dashboard development", "reporting"],
		missing: ["data visualization"],
	},
	preferred_skills: {
		matched: ["Power BI"],
		missing: ["Tableau"],
	},
	evidence: [
		{
			requirement: "SQL",
			resume_section: "experience",
			entry_id: "experience-3",
			supporting_text: "Automated ETL jobs in Python and SQL for weekly business analytics.",
			match_method: "exact",
			strength: 0.95,
			demonstrated: true,
		},
		{
			requirement: "Excel",
			resume_section: "skills",
			entry_id: "skills-list",
			supporting_text: "Excel",
			match_method: "alias",
			strength: 0.45,
			demonstrated: false,
		},
	],
	keyword_stuffing: {
		detected: false,
		reasons: [],
		penalty: 0,
		terms: [],
	},
});

describe("mapCodeQuestResponseToResumeAnalysis", () => {
	it("maps overall score and normalized scorecard components", () => {
		const mapped = mapCodeQuestResponseToResumeAnalysis(fixtureAResponse);

		expect(mapped.overallScore).toBe(44);
		expect(mapped.scorecard).toHaveLength(5);
		expect(mapped.scorecard[0]?.dimension).toBe("Required skill coverage");
		expect(mapped.scorecard[0]?.score).toBeGreaterThan(0);
	});

	it("maps matched skills and demonstrated evidence to strengths", () => {
		const mapped = mapCodeQuestResponseToResumeAnalysis(fixtureAResponse);

		expect(mapped.strengths).toContain("Required skill matched: SQL");
		expect(mapped.strengths).toContain("Preferred skill matched: Power BI");
		expect(mapped.strengths.some((item) => item.includes("Automated ETL jobs in Python and SQL"))).toBe(true);
	});

	it("maps missing skills and listed-only evidence to suggestions", () => {
		const mapped = mapCodeQuestResponseToResumeAnalysis(fixtureAResponse);

		expect(mapped.suggestions.some((item) => item.title === "Add required skill: data visualization")).toBe(true);
		expect(mapped.suggestions.some((item) => item.title.includes("Demonstrate Excel"))).toBe(true);
		expect(mapped.suggestions.find((item) => item.title.includes("Excel"))?.exampleRewrite).toBe("Excel");
	});

	it("maps keyword stuffing findings to a high-impact suggestion", () => {
		const mapped = mapCodeQuestResponseToResumeAnalysis({
			...fixtureAResponse,
			keyword_stuffing: {
				detected: true,
				reasons: ["Repeated keyword density exceeded threshold."],
				penalty: 12,
				terms: ["python"],
			},
		});

		expect(mapped.suggestions.some((item) => item.title === "Reduce keyword stuffing")).toBe(true);
	});
});

describe("codeQuestAnalyzeResponseSchema", () => {
	it("rejects invalid ATS payloads", () => {
		expect(codeQuestAnalyzeResponseSchema.safeParse({ score: { final: 44 } }).success).toBe(false);
	});
});
