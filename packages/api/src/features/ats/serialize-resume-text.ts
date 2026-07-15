import type { SectionTitleResolver } from "@reactive-resume/resume/markdown";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { buildMarkdown } from "@reactive-resume/resume/markdown";

const ATS_SECTION_TITLES: Record<string, string> = {
	summary: "Professional Summary",
	experience: "Work Experience",
	projects: "Projects",
	skills: "Technical Skills",
};

const resolveAtsSectionTitle: SectionTitleResolver = (sectionId) => ATS_SECTION_TITLES[sectionId];

function markdownToPlainText(markdown: string): string {
	return markdown
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/\*\*(.*?)\*\*/g, "$1")
		.replace(/_(.*?)_/g, "$1")
		.replace(/\[(.*?)\]\((.*?)\)/g, "$1")
		.replace(/^-\s+/gm, "- ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/** Converts structured resume data into deterministic plain text for Code Quest ATS. */
export function serializeResumeTextForAts(data: ResumeData): string {
	const markdown = buildMarkdown(data, resolveAtsSectionTitle);
	return markdownToPlainText(markdown);
}
