import { describe, expect, it } from "vitest";
import { analyzeWithCodeQuestAts } from "./client";
import { buildFixtureAResumeData } from "./fixtures/fixture-a-resume-data";
import { serializeResumeTextForAts } from "./serialize-resume-text";

const FIXTURE_A_JD = `Data Analyst — Example Analytics Co.
Required skills: SQL, Python, Excel, data visualization, statistical analysis, dashboard development, reporting
Preferred skills: Tableau, Power BI
Responsibilities: Build dashboards, partner with product on experiment readouts, document KPI definitions.`;

describe("Code Quest ATS live integration", () => {
	it.skipIf(process.env.LIVE_ATS !== "1")("returns score 44 for Fixture A resume data", async () => {
		const result = await analyzeWithCodeQuestAts({
			resumeText: serializeResumeTextForAts(buildFixtureAResumeData()),
			jdText: FIXTURE_A_JD,
		});

		expect(result.score.final).toBe(44);
		expect(result.required_skills.missing).toContain("data visualization");
	});
});
