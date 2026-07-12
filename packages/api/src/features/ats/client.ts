import type { CodeQuestAnalyzeResponse } from "./schema";
import { env } from "@reactive-resume/env/server";
import { codeQuestAnalyzeResponseSchema } from "./schema";

export class CodeQuestAtsUnavailableError extends Error {
	constructor(message = "CODEQUEST_ATS_UNAVAILABLE") {
		super(message);
		this.name = "CodeQuestAtsUnavailableError";
	}
}

export class CodeQuestAtsInvalidResponseError extends Error {
	constructor(message = "CODEQUEST_ATS_INVALID_RESPONSE") {
		super(message);
		this.name = "CodeQuestAtsInvalidResponseError";
	}
}

function resolveBaseUrl(): string {
	return (env.CODEQUEST_ATS_API_URL ?? "http://127.0.0.1:8200").replace(/\/$/, "");
}

export async function analyzeWithCodeQuestAts(input: {
	resumeText: string;
	jdText: string;
	fetchImpl?: typeof fetch;
}): Promise<CodeQuestAnalyzeResponse> {
	const fetchImpl = input.fetchImpl ?? fetch;
	const url = `${resolveBaseUrl()}/api/v1/service/analyze`;

	let response: Response;
	try {
		response = await fetchImpl(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ resume_text: input.resumeText, jd_text: input.jdText }),
		});
	} catch {
		throw new CodeQuestAtsUnavailableError();
	}

	if (!response.ok) {
		throw new CodeQuestAtsUnavailableError();
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new CodeQuestAtsInvalidResponseError();
	}

	const parsed = codeQuestAnalyzeResponseSchema.safeParse(payload);
	if (!parsed.success) {
		throw new CodeQuestAtsInvalidResponseError();
	}

	return parsed.data;
}
