import { z } from "zod";

export const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^09([0-9]{2})-?[0-9]{3}-?[0-9]{4}$/, {
    message: "فرمت شماره موبایل اشتباه است",
  }),
});

export type PhoneInput = z.infer<typeof phoneSchema>;

export const otpSchema = z.object({
  code: z.string().length(6, "کد وارد باید 6 رقم باشد").regex(/^\d+$/, {
    message: "کد وارد باید فقط شامل اعداد باشد",
  }),
});

export type OtpInput = z.infer<typeof otpSchema>;

const bannedUsernames = [
  "admin",
  "root",
  "support",
  "moderator",
  "owner",
  "system",
  "test",

  // page
  "auth",
  "dashboard",
  "create",

  // name
  "saeed",
  "emza",
  "hadi",
  "meyme",
  "big",
];

export const usernameSchema = z.object({
  username: z
    .string()
    .min(5, "نام کاربری باید حداقل 5 کاراکتر باشد.")
    .max(20, "نام کاربری باید حداکثر 20 کاراکتر باشد.")
    .refine((val) => !bannedUsernames.includes(val.toLowerCase()), {
      message: "استفاده از این نام کاربری مجاز نیست.",
    })
    .regex(/^[a-z][a-z0-9_]*$/, {
      message: "نام کاربری فقط می‌تواند شامل حروف کوچک، اعداد و زیرخط باشد.",
    })
    .trim(),
});

export type UsernameInput = z.infer<typeof usernameSchema>;
