import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .min(1, "عنوان الزامی است")
    .max(100, "عنوان نمیتواند بیشتر از 100 کارکتر باشد")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(800, "توظیحات نمیتواند بیشتر از 800 کارکتر باشد")
    .optional(),
  url: z.url("آدرس وب‌سایت باید یک URL معتبر باشد").optional().or(z.literal("")),
  // board: z.string().min(1, "برد را انتخاب کنید"),
  // tags: z.array(z.string()).optional(),
});

export const createPostSchema = postSchema.extend({
  media: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        type: z.enum(["IMAGE", "VIDEO"]),
        width: z.number().nullable(),
        height: z.number().nullable(),
        fileSize: z.number().nullable(),
        order: z.number(),
      }),
    )
    .min(1, "حداقل 1 تصویر الزامی است")
    .max(20, "حداکثر 20 تصویر مجاز است"),
});

export type EditPostInput = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
