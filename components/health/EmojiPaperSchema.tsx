import { z } from "zod";

export const EmojiPaperSchema = z.object({
    summaryOfPaperInEmojis:
        z.string().describe("Try to summarise the key outcomes of the paper only using emojis"),
})

export type EmojiPaperSchemaType = z.infer<typeof EmojiPaperSchema>