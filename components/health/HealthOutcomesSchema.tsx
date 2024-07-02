import { z } from "zod";

export const HealthOutcomesSchema = z.object({
    outcomes: z.array(z.object({
        outcome: z.string().describe("The specific, measurable endpoints that were studied."),
        grade: z.string().describe("The grade summarizes how potentially beneficial the intervention is for a given outcome. Its based on a formula that incorporates the number of trials, consistency of evidence, and effect sizes. The grade is subject to change as the evidence evolves and as we update and improve our analyses. Only respond with A, B, C, D, E or F, with A being the best quality, and F being the worst"),
        evidence: z.string().describe("The number of randomized controlled trials as well as the total number of participants in those trials."),
        effect: z.string().describe("How big the change was, when summarized across trials, use Cohens effect size, it has to be; no effect, small effect, moderate effect, large effect")
    })).describe("An array of health outcomes"),
})

export type HealthOutcomesSchemaType = z.infer<typeof HealthOutcomesSchema>