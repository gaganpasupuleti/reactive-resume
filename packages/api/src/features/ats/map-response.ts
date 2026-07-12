import type { ResumeAnalysis } from "@reactive-resume/schema/resume/analysis";
import type { CodeQuestAnalyzeResponse } from "./schema";
import { CODEQUEST_ATS_COMPONENT_MAX } from "./schema";

function normalizeComponentScore(value: number, max: number): number {
	if (max <= 0) return 0;
	return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function copyPromptFor(title: string): string {
	return `Update the resume to address: ${title}`;
}

export function mapCodeQuestResponseToResumeAnalysis(response: CodeQuestAnalyzeResponse): ResumeAnalysis {
	const components = response.score.components;
	const scorecard = [
		{
			dimension: "Required skill coverage",
			score: normalizeComponentScore(
				components.required_skill_coverage,
				CODEQUEST_ATS_COMPONENT_MAX.required_skill_coverage,
			),
			rationale: `Matched ${response.required_skills.matched.length} of ${response.required_skills.matched.length + response.required_skills.missing.length} required skills.`,
		},
		{
			dimension: "Preferred skill coverage",
			score: normalizeComponentScore(
				components.preferred_skill_coverage,
				CODEQUEST_ATS_COMPONENT_MAX.preferred_skill_coverage,
			),
			rationale:
				response.preferred_skills.matched.length + response.preferred_skills.missing.length > 0
					? `Matched ${response.preferred_skills.matched.length} of ${response.preferred_skills.matched.length + response.preferred_skills.missing.length} preferred skills.`
					: "No preferred skills were listed in the job description.",
		},
		{
			dimension: "Responsibility alignment",
			score: normalizeComponentScore(
				components.responsibility_alignment,
				CODEQUEST_ATS_COMPONENT_MAX.responsibility_alignment,
			),
			rationale: response.score.explanation,
		},
		{
			dimension: "Evidence quality",
			score: normalizeComponentScore(components.evidence_quality, CODEQUEST_ATS_COMPONENT_MAX.evidence_quality),
			rationale: `${response.evidence.filter((item) => item.demonstrated).length} of ${response.evidence.length} matches are demonstrated in experience or projects.`,
		},
		{
			dimension: "General coverage",
			score: normalizeComponentScore(components.general_coverage, CODEQUEST_ATS_COMPONENT_MAX.general_coverage),
			rationale: response.score.label,
		},
	];

	const strengths: string[] = [];
	for (const skill of response.required_skills.matched) {
		strengths.push(`Required skill matched: ${skill}`);
	}
	for (const skill of response.preferred_skills.matched) {
		strengths.push(`Preferred skill matched: ${skill}`);
	}
	for (const item of response.evidence.filter((entry) => entry.demonstrated)) {
		strengths.push(`Demonstrated ${item.requirement}: ${item.supporting_text}`);
	}

	const suggestions: ResumeAnalysis["suggestions"] = [];
	for (const skill of response.required_skills.missing) {
		const title = `Add required skill: ${skill}`;
		suggestions.push({
			title,
			impact: "high",
			why: "This required skill was not found in the resume against the pasted job description.",
			exampleRewrite: null,
			copyPrompt: copyPromptFor(title),
		});
	}
	for (const skill of response.preferred_skills.missing) {
		const title = `Add preferred skill: ${skill}`;
		suggestions.push({
			title,
			impact: "medium",
			why: "This preferred skill was not found in the resume against the pasted job description.",
			exampleRewrite: null,
			copyPrompt: copyPromptFor(title),
		});
	}
	for (const item of response.evidence.filter((entry) => !entry.demonstrated)) {
		const title = `Demonstrate ${item.requirement} in experience or projects`;
		suggestions.push({
			title,
			impact: "medium",
			why: `${item.requirement} is only listed under skills (${item.supporting_text}). Add concrete experience evidence.`,
			exampleRewrite: item.supporting_text,
			copyPrompt: copyPromptFor(title),
		});
	}
	if (response.keyword_stuffing.detected) {
		const title = "Reduce keyword stuffing";
		const why =
			response.keyword_stuffing.reasons.length > 0
				? response.keyword_stuffing.reasons.join(" ")
				: `Repeated job-description terms detected (${response.keyword_stuffing.terms.join(", ")}).`;
		suggestions.push({
			title,
			impact: "high",
			why,
			exampleRewrite: null,
			copyPrompt: copyPromptFor(title),
		});
	}

	return {
		overallScore: response.score.final,
		scorecard,
		strengths: strengths.slice(0, 10),
		suggestions: suggestions.slice(0, 10),
	};
}
