import z from "zod";

export const codeQuestScoreComponentsSchema = z.object({
	required_skill_coverage: z.number(),
	preferred_skill_coverage: z.number(),
	responsibility_alignment: z.number(),
	evidence_quality: z.number(),
	general_coverage: z.number(),
	keyword_stuffing_penalty: z.number(),
});

export const codeQuestEvidenceSchema = z.object({
	requirement: z.string(),
	resume_section: z.string(),
	entry_id: z.string(),
	supporting_text: z.string(),
	match_method: z.string(),
	strength: z.number(),
	demonstrated: z.boolean(),
});

export const codeQuestAnalyzeResponseSchema = z.object({
	engine_version: z.string(),
	score: z.object({
		label: z.string(),
		final: z.number().int().min(0).max(100),
		components: codeQuestScoreComponentsSchema,
		component_sum: z.number(),
		explanation: z.string(),
	}),
	required_skills: z.object({
		matched: z.array(z.string()),
		missing: z.array(z.string()),
	}),
	preferred_skills: z.object({
		matched: z.array(z.string()),
		missing: z.array(z.string()),
	}),
	evidence: z.array(codeQuestEvidenceSchema),
	keyword_stuffing: z.object({
		detected: z.boolean(),
		reasons: z.array(z.string()),
		penalty: z.number(),
		terms: z.array(z.string()),
	}),
});

export type CodeQuestAnalyzeResponse = z.infer<typeof codeQuestAnalyzeResponseSchema>;

export const CODEQUEST_ATS_COMPONENT_MAX = {
	required_skill_coverage: 40,
	preferred_skill_coverage: 15,
	responsibility_alignment: 25,
	evidence_quality: 10,
	general_coverage: 10,
} as const;

export const CODEQUEST_ATS_MODEL = {
	provider: "codequest-ats",
	model: "deterministic-v1.0.0",
} as const;
