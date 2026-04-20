"use server";

import { verifySession } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { generateOtp } from "@/lib/utils";
import { otpSchema, phoneSchema, usernameSchema } from "@/lib/validations/auth";

export const SendOtp = async ({ phoneNumber }: { phoneNumber: string }) => {
  const result = phoneSchema.safeParse({ phoneNumber });

  if (!result.success) {
    return {
      success: false,
      message: "شماره‌تلفن نامعتبر است",
    };
  }

  try {
    const normalizedPhone = result.data.phoneNumber.replace(/[^\d]/g, "");
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentAttempts = await prisma.otpVerification.count({
      where: {
        phoneNumber: normalizedPhone,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentAttempts >= 3) {
      return {
        success: false,
        message: "بیش از حد درخواست برای ارسال کد. لطفاً بعداً دوباره تلاش کنید.",
      };
    }

    const pendingOtp = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (pendingOtp) {
      return {
        success: true,
        message:
          "کد تأیید قبلاً ارسال شده است. لطفاً منتظر ماندن یا کد قبلی را استفاده کنید.",
      };
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        phoneNumber: normalizedPhone,
        code,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    // TODO: ارسال کد از طریق SMS سرویس
    console.log(`[OTP] ${normalizedPhone}: ${code}`);

    return {
      success: true,
      message: "کد تأیید ارسال شد.",
    };
  } catch (error) {
    console.error("SendOtp Error:", error);
    return {
      success: false,
      message: "خطایی در ارسال کد به وجود آمد.",
    };
  }
};

export const VerifyOtp = async ({
  phoneNumber,
  code,
}: {
  phoneNumber: string;
  code: string;
}) => {
  const phoneValidation = phoneSchema.safeParse({ phoneNumber });
  const otpValidation = otpSchema.safeParse({ code });

  if (!phoneValidation.success || !otpValidation.success) {
    return {
      success: false,
      message: "داده‌های ارسالی نامعتبر است",
    };
  }

  try {
    const normalizedPhone = phoneValidation.data.phoneNumber.replace(
      /[^\d]/g,
      "",
    );

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return {
        success: false,
        message: "کد تأیید ارسال نشده است. لطفاً ابتدا کد درخواست کنید.",
      };
    }

    if (otpRecord.expiresAt < new Date()) {
      return {
        success: false,
        message: "کد منقضی شده است. لطفاً کد جدید درخواست کنید.",
      };
    }

    if (otpRecord.attempts >= 5) {
      return {
        success: false,
        message: "تعداد تلاش‌های غلط بیش از حد است. لطفاً بعداً دوباره تلاش کنید.",
      };
    }

    if (otpRecord.code !== otpValidation.data.code) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      return {
        success: false,
        message: "کد نامعتبر است.",
      };
    }

    let user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: normalizedPhone,
          isVerified: true,
        },
      });
    } else {
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { phoneNumber: normalizedPhone },
          data: { isVerified: true },
        });
      }
    }

    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
        userId: user.id,
      },
    });

    await createSession(user.phoneNumber, user.role);

    return {
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        username: user.username,
        isVerified: user.isVerified,
      },
      message: "ورود با موفقیت انجام شد.",
    };
  } catch (error) {
    console.error("VerifyOtp Error:", error);

    if (error instanceof Error && error.message.includes("P2002")) {
      return {
        success: false,
        message: "خطایی در پایگاه داده به وجود آمد.",
      };
    }

    return {
      success: false,
      message: "خطایی در ورود به وجود آمد. لطفاً دوباره تلاش کنید.",
    };
  }
};

export const SetUsername = async ({ username }: { username: string }) => {
  const validation = usernameSchema.safeParse({ username });

  if (!validation.success) {
    return {
      success: false,
      message: "نام کاربری نامعتبر است. تنها حروف، اعداد و آندرلاین مجاز است.",
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: validation.data.username },
    });

    if (existingUser) {
      return {
        success: false,
        message: "این نام کاربری قبلاً استفاده شده است.",
      };
    }

    const session = await verifySession();
    if (!session || !session.phoneNumber) {
      return {
        success: false,
        message: "لطفاً ابتدا وارد شوید.",
      };
    }

    const updatedUser = await prisma.user.update({
      where: { phoneNumber: String(session.phoneNumber) },
      data: { username: validation.data.username },
    });

    return {
      success: true,
      message: "نام کاربری با موفقیت تنظیم شد.",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
      },
    };
  } catch (error) {
    console.error("AddUsername Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("P2002")) {
        return {
          success: false,
          message: "این نام کاربری قبلاً استفاده شده است.",
        };
      }
      if (error.message.includes("P2025")) {
        return {
          success: false,
          message: "کاربر یافت نشد.",
        };
      }
    }

    return {
      success: false,
      message: "خطایی در تنظیم نام کاربری به وجود آمد.",
    };
  }
};

export const CheckUsername = async ({ username }: { username: string }) => {
  const validation = usernameSchema.safeParse({ username });

  if (!validation.success) {
    return {
      success: false,
      message: "نام کاربری نامعتبر است. تنها حروف، اعداد و آندرلاین مجاز است.",
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: validation.data.username },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        message: "این نام کاربری قبلاً استفاده شده است.",
      };
    }
    return {
      success: true,
      message: "این نام کاربری در دسترس است.",
    };
  } catch (error) {
    console.error("CheckUsername Error:", error);
    return {
      success: false,
      message: "خطایی در بررسی نام کاربری به وجود آمد.",
    };
  }
};

export const Logout = async () => {
  try {
    await deleteSession();
    return {
      success: true,
      message: "خروج با موفقیت انجام شد.",
    };
  } catch (error) {
    console.error("Logout Error:", error);
    return {
      success: false,
      message: "خطایی در خروج به وجود آمد.",
    };
  }
};
