import { z } from "zod";
import { storedResumeAnalysisSchema } from "@reactive-resume/schema/resume/analysis";
import { protectedProcedure } from "../../context";
import { aiRequestRateLimit } from "../../middleware/rate-limit";
import { analyzeResumeWithCodeQuest } from "./service";

export const atsRouter = {
	analyzeResume: protectedProcedure
		.route({
			method: "POST",
			path: "/ats/analyze-resume",
			tags: ["ATS"],
			operationId: "analyzeResumeWithCodeQuestAts",
			summary: "Analyze resume against a job description with Code Quest ATS",
			description:
				"Serializes the authenticated user's resume, compares it to a pasted job description using the Code Quest deterministic ATS service, and persists the mapped analysis.",
			successDescription: "Structured resume analysis returned and persisted successfully.",
		})
		.input(
			z.object({
				resumeId: z.string(),
				jdText: z.string().trim().min(1, "Job description is required"),
			}),
		)
		.use(aiRequestRateLimit)
		.output(storedResumeAnalysisSchema)
		.errors({
			BAD_GATEWAY: { message: "The ATS service is unavailable.", status: 502 },
			BAD_REQUEST: { message: "The ATS service returned an invalid analysis response.", status: 400 },
		})
		.handler(async ({ context, input }) =>
			analyzeResumeWithCodeQuest({
				userId: context.user.id,
				resumeId: input.resumeId,
				jdText: input.jdText,
			}),
		),
};
