import type { StoredResumeAnalysis } from "@reactive-resume/schema/resume/analysis";
import { ORPCError } from "@orpc/client";
import { flattenError, ZodError } from "zod";
import { resumeService } from "../resume/service";
import { analyzeWithCodeQuestAts, CodeQuestAtsInvalidResponseError, CodeQuestAtsUnavailableError } from "./client";
import { mapCodeQuestResponseToResumeAnalysis } from "./map-response";
import { CODEQUEST_ATS_MODEL } from "./schema";
import { serializeResumeTextForAts } from "./serialize-resume-text";

export async function analyzeResumeWithCodeQuest(input: {
	userId: string;
	resumeId: string;
	jdText: string;
}): Promise<StoredResumeAnalysis> {
	try {
		const resume = await resumeService.getById({ id: input.resumeId, userId: input.userId });
		const resumeText = serializeResumeTextForAts(resume.data);
		const atsResponse = await analyzeWithCodeQuestAts({
			resumeText,
			jdText: input.jdText,
		});
		const analysis = mapCodeQuestResponseToResumeAnalysis(atsResponse);

		return await resumeService.analysis.upsert({
			id: input.resumeId,
			userId: input.userId,
			analysis: {
				...analysis,
				updatedAt: new Date(),
				modelMeta: CODEQUEST_ATS_MODEL,
			},
		});
	} catch (error) {
		if (error instanceof CodeQuestAtsUnavailableError) {
			throw new ORPCError("BAD_GATEWAY", { message: "The ATS service is unavailable." });
		}
		if (error instanceof CodeQuestAtsInvalidResponseError) {
			throw new ORPCError("BAD_REQUEST", { message: "The ATS service returned an invalid analysis response." });
		}
		if (error instanceof ZodError) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Invalid resume analysis structure",
				cause: flattenError(error),
			});
		}
		throw error;
	}
}
