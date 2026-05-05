import { z } from "zod";

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "متن دیدگاه الزامی است")
    .max(400, "دیدگاه نمیتواند بیشتر از 400 کارکتر باشد"),
});

export type CommentInput = z.infer<typeof commentSchema>;
