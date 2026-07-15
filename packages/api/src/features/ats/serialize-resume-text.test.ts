import { describe, expect, it } from "vitest";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { serializeResumeTextForAts } from "./serialize-resume-text";

describe("serializeResumeTextForAts", () => {
	it("includes ATS section headings and resume content", () => {
		const text = serializeResumeTextForAts(sampleResumeData);

		expect(text).toContain("Professional Summary");
		expect(text).toContain("Work Experience");
		expect(text).toContain("Projects");
		expect(text).toContain("Technical Skills");
		expect(text).toContain("David Kowalski");
		expect(text).toContain("Unity");
	});

	it("is deterministic for the same resume data", () => {
		const first = serializeResumeTextForAts(sampleResumeData);
		const second = serializeResumeTextForAts(sampleResumeData);
		expect(first).toBe(second);
	});
});
