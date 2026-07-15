import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";

/** Resume data aligned with Fixture A for deterministic ATS score verification. */
export function buildFixtureAResumeData(): ResumeData {
	const data = structuredClone(sampleResumeData);
	data.basics.name = "Alex Analyst";
	data.basics.headline = "Data Analyst";
	data.summary.content =
		"<p>Data analyst with 4 years building SQL dashboards, Python analytics pipelines, and Power BI reporting.</p>";
	const firstExperience = data.sections.experience.items[0];
	if (!firstExperience) throw new Error("Sample resume is missing an experience item");
	data.sections.experience.items[0] = {
		...firstExperience,
		company: "Example Analytics Co.",
		position: "Data Analyst",
		description:
			"<ul><li>Built executive dashboards in Power BI tracking revenue and retention KPIs (+18% reporting speed).</li><li>Automated ETL jobs in Python and SQL for weekly business analytics.</li></ul>",
	};
	data.sections.skills.items = [
		{
			id: "skill-sql",
			hidden: false,
			icon: "database",
			iconColor: "",
			name: "SQL",
			proficiency: "",
			level: 0,
			keywords: [],
		},
		{
			id: "skill-python",
			hidden: false,
			icon: "code",
			iconColor: "",
			name: "Python",
			proficiency: "",
			level: 0,
			keywords: [],
		},
		{
			id: "skill-powerbi",
			hidden: false,
			icon: "chart-bar",
			iconColor: "",
			name: "Power BI",
			proficiency: "",
			level: 0,
			keywords: [],
		},
		{
			id: "skill-excel",
			hidden: false,
			icon: "table",
			iconColor: "",
			name: "Excel",
			proficiency: "",
			level: 0,
			keywords: [],
		},
		{
			id: "skill-dashboard",
			hidden: false,
			icon: "chart-line-up",
			iconColor: "",
			name: "dashboard development",
			proficiency: "",
			level: 0,
			keywords: [],
		},
		{
			id: "skill-reporting",
			hidden: false,
			icon: "file-text",
			iconColor: "",
			name: "reporting",
			proficiency: "",
			level: 0,
			keywords: [],
		},
		{
			id: "skill-stats",
			hidden: false,
			icon: "function",
			iconColor: "",
			name: "statistical analysis",
			proficiency: "",
			level: 0,
			keywords: [],
		},
	];
	return data;
}
