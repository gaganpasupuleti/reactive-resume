// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const mutateMock = vi.fn();
const useMutationMock = vi.fn(() => ({
	mutate: mutateMock,
	isPending: false,
}));
const useQueryMock = vi.fn(({ enabled }: { enabled?: boolean }) => ({
	data: enabled ? null : null,
	isFetched: true,
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
	return {
		...actual,
		useMutation: useMutationMock,
		useQuery: useQueryMock,
		useQueryClient: () => ({ setQueryData: vi.fn() }),
	};
});

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/features/resume/builder/draft", () => ({
	useResume: () => ({ id: "resume-1", name: "Baseline Sample Resume" }),
}));
vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		resume: {
			analysis: {
				getById: {
					queryOptions: () => ({ queryKey: ["analysis"], queryFn: async () => null }),
					queryKey: () => ["analysis"],
				},
			},
		},
		ats: {
			analyzeResume: {
				mutationOptions: () => ({}),
			},
		},
	},
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { ResumeAnalysisSectionBuilder } = await import("./resume-analysis");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	mutateMock.mockReset();
	useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });
});

const renderSection = () =>
	render(
		<I18nProvider i18n={i18n}>
			<ResumeAnalysisSectionBuilder />
		</I18nProvider>,
	);

describe("ResumeAnalysisSectionBuilder", () => {
	it("renders the existing analysis section without the AI provider gate", () => {
		renderSection();
		expect(screen.getByRole("button", { name: /analyze resume/i })).toBeInTheDocument();
		expect(screen.queryByText(/update your ai settings/i)).not.toBeInTheDocument();
	});

	it("opens the job-description dialog and disables submit when empty", () => {
		renderSection();
		fireEvent.click(screen.getByRole("button", { name: /analyze resume/i }));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /^analyze$/i })).toBeDisabled();
	});

	it("submits analysis with the pasted job description", async () => {
		renderSection();
		fireEvent.click(screen.getByRole("button", { name: /analyze resume/i }));

		fireEvent.change(screen.getByLabelText(/job description/i), {
			target: { value: "Required skills: SQL, Python, data visualization" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^analyze$/i }));

		await waitFor(() => {
			expect(mutateMock).toHaveBeenCalledWith({
				resumeId: "resume-1",
				jdText: "Required skills: SQL, Python, data visualization",
			});
		});
	});

	it("keeps the existing score circle and scorecard layout", () => {
		const source = readFileSync("src/routes/builder/$resumeId/-sidebar/right/sections/resume-analysis.tsx", "utf8");
		expect(source).toContain("Overall Score");
		expect(source).toContain("Scorecard");
		expect(source).toContain("Strengths");
		expect(source).toContain("Suggestions");
	});
});
