"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Edit2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SendOtp, VerifyOtp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  type OtpInput,
  otpSchema,
  type PhoneInput,
  phoneSchema,
} from "@/lib/validations/auth";

export function useOtpTimer(durationSeconds: number = 120) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft]);

  const reset = (seconds = durationSeconds) => {
    setTimeLeft(seconds);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return { minutes, seconds, timeLeft, reset };
}

const LoginForm = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const { minutes, seconds, reset, timeLeft } = useOtpTimer(120);

  const phoneNumberForm = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
    reValidateMode: "onSubmit",
  });

  const otpForm = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
    reValidateMode: "onSubmit",
  });

  const sendOTP = async () => {
    setIsResending(true);
    try {
      const { success, message } = await SendOtp({
        phoneNumber: phoneNumberForm.getValues("phoneNumber"),
      });
      if (success) {
        toast.success(message);
        reset();
        otpForm.reset();
        step === 1 && setStep(2);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.log(error);
      toast.error("ارسال کد با خطا مواجه شد.");
    } finally {
      setIsResending(false);
    }
  };

  const phoneSubmit = async () => {
    setIsLoading(true);
    try {
      await sendOTP();
    } finally {
      setIsLoading(false);
    }
  };

  const otpSubmit = useCallback(
    async (data: OtpInput) => {
      setIsLoading(true);
      try {
        const { success, message, user } = await VerifyOtp({
          phoneNumber: phoneNumberForm.getValues("phoneNumber"),
          code: data.code,
        });

        if (success) {
          toast.success(message);
          if (user?.username) {
            router.push(callbackUrl);
          } else {
            router.push(`/complete-profile?callbackUrl=${callbackUrl}`);
          }
        } else {
          toast.error(message);
          setIsLoading(false);
        }
      } catch (error) {
        console.log(error);
        setIsLoading(false);
        toast.error("کد وارد شده معتبر نیست.");
      }
    },
    [phoneNumberForm, router, callbackUrl],
  );

  useEffect(() => {
    const subscription = otpForm.watch((value, { name }) => {
      if (
        name === "code" &&
        value.code?.length === 6 &&
        /^\d{6}$/.test(value.code)
      ) {
        otpForm.handleSubmit(otpSubmit)();
      }
    });

    return () => subscription.unsubscribe();
  }, [otpForm, otpSubmit]);

  const handleResendClick = () => {
    if (minutes === 0 && seconds === 0) {
      sendOTP();
    }
  };

  return (
    <div className="h-dvh max-w-sm w-full p-6 flex flex-col justify-between">
      <button
        type="button"
        onClick={() => {
          if (step === 2) {
            setStep(1);
            otpForm.reset();
          } else {
            router.push("/");
          }
        }}
        className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer"
      >
        <ChevronRight size={18} />
        بازگشت
      </button>

      {step === 1 && (
        <form
          onSubmit={phoneNumberForm.handleSubmit(phoneSubmit)}
          className="space-y-6"
        >
          <div className="flex flex-col gap-2 items-start">
            <Image src="/logo.svg" alt="logo" width={36} height={36} priority />
            <h1 className="text-xl font-bold">ورود و ثبت نام</h1>
            <p className="text-sm text-muted-foreground leading-5">
              برای ورود یا ایجاد حساب کاربری در پلتفرم نگاه شمارهٔ موبایل خود را
              وارد کنید.
            </p>
          </div>
          <FieldGroup>
            <Controller
              name="phoneNumber"
              control={phoneNumberForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    dir="ltr"
                    maxLength={11}
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    placeholder="0900 000 00 00"
                    onKeyDown={(e) => {
                      const isPrintable = e.key.length === 1;
                      const isDigit = /^[0-9]$/.test(e.key);
                      if (isPrintable && !isDigit) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      if (/\D/.test(e.clipboardData.getData("text"))) {
                        e.preventDefault();
                      }
                    }}
                    onKeyUp={() => {
                      if (typingTimeout) {
                        clearTimeout(typingTimeout);
                      }
                      phoneNumberForm.clearErrors("phoneNumber");
                      setTypingTimeout(
                        setTimeout(async () => {
                          if (
                            phoneNumberForm.getValues("phoneNumber").length > 0
                          ) {
                            await phoneNumberForm.trigger("phoneNumber");
                          }
                        }, 1000),
                      );
                    }}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Button
            type="submit"
            className="w-full"
            disabled={!phoneNumberForm.formState.isValid || isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "ارسال کد تایید"
            )}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={otpForm.handleSubmit(otpSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-bold">تایید شماره موبایل</h1>
            </div>
            <p className="text-sm text-muted-foreground leading-5">
              کد تایید پیامک شده به شماره
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 align-middle cursor-pointer border rounded-md px-1 mx-1"
              >
                <Edit2 size={12} />
                {phoneNumberForm.getValues("phoneNumber")}
              </button>{" "}
              را وارد کنید
            </p>
          </div>

          <FieldGroup>
            <Controller
              name="code"
              control={otpForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} dir="ltr">
                  <InputOTP
                    onKeyDown={(e) => {
                      const isPrintable = e.key.length === 1;
                      const isDigit = /^[0-9]$/.test(e.key);
                      if (isPrintable && !isDigit) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      if (/\D/.test(e.clipboardData.getData("text"))) {
                        e.preventDefault();
                      }
                    }}
                    autoFocus
                    maxLength={6}
                    {...field}
                    aria-invalid={fieldState.invalid}
                  >
                    <InputOTPGroup className="mx-auto">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          {timeLeft > 0 ? (
            <p className="text-xs text-muted-foreground">
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")} تا دریافت مجدد کد
            </p>
          ) : (
            <button
              className="flex items-center gap-1 w-full text-xs text-primary cursor-pointer"
              type="button"
              onClick={handleResendClick}
              disabled={isResending}
            >
              {isResending ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <>
                  دریافت مجدد کد
                  <ChevronLeft size={16} />
                </>
              )}
            </button>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!otpForm.formState.isValid || isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "تایید و ورود"}
          </Button>
        </form>
      )}

      <p className="text-xs text-muted-foreground">
        ورود شما به معنای پذیرش{" "}
        <Link href="/privacy" className="text-primary underline">
          قوانین
        </Link>{" "}
        و{" "}
        <Link href="/terms" className="text-primary underline">
          سیاست‌های نگاه
        </Link>{" "}
        است.
      </p>
    </div>
  );
};

export default LoginForm;
