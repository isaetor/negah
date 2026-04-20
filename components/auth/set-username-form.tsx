"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  User,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CheckUsername, SetUsername } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { debounce } from "@/lib/utils";
import { type UsernameInput, usernameSchema } from "@/lib/validations/auth";

const SetUsernameForm = () => {
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [isCheckLoading, setIsCheckLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const form = useForm<UsernameInput>({
    resolver: zodResolver(usernameSchema),
    mode: "onChange",
    defaultValues: { username: "" },
  });

  const checkAvailability = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setIsUsernameAvailable(null);
        return;
      }
      setIsCheckLoading(true);
      try {
        const { success, message } = await CheckUsername({
          username: username,
        });
        if (!success && message) {
          form.setError("username", { message: message });
        }
        setIsUsernameAvailable(success);
      } catch {
        setIsUsernameAvailable(false);
      } finally {
        setIsCheckLoading(false);
      }
    }, 500),
    [],
  );

  const username = form.watch("username");
  useEffect(() => {
    if (form.formState.errors.username) {
      setIsUsernameAvailable(null);
      return;
    }
    checkAvailability(username);
  }, [username, checkAvailability, form.formState.errors.username]);

  const onSubmit = async (data: UsernameInput) => {
    if (!isUsernameAvailable) return;
    setIsLoading(true);
    try {
      const { success, message } = await SetUsername({
        username: data.username,
      });
      if (success) {
        toast.success(message);
        router.push(callbackUrl);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.log(error);
      toast.error("خطا در هنگام ثبت نام کاربری.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="relative max-w-sm w-full flex flex-col justify-between md:justify-center gap-6 h-full"
    >
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            router.push("/");
          }}
          className="flex items-center gap-1text-sm text-muted-foreground cursor-pointer md:absolute top-0"
        >
          <ChevronRight size={18} />
          بازگشت
        </button>
        <div className="flex flex-col gap-2 items-start">
          <h1 className="text-xl font-bold">ثبت شناسه کاربری</h1>

          <p className="text-sm text-muted-foreground leading-5">
            برای استفاده از بخش های مختلف پلتفرم نگاه، لطفا شناسه کاربری را وارد
            کنید
          </p>
        </div>
        <FieldGroup>
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} dir="ltr">
                <InputGroup>
                  <InputGroupAddon>
                    <User />
                  </InputGroupAddon>
                  <InputGroupInput
                    data-invalid={fieldState.invalid}
                    {...field}
                    autoComplete="off"
                    placeholder="abc123"
                  />
                  <InputGroupAddon align="inline-end">
                    {isCheckLoading ? (
                      <Loader2 className="animate-spin text-gray-400" />
                    ) : isUsernameAvailable === true ? (
                      <CheckCircle2 className="text-green-500" />
                    ) : isUsernameAvailable === false ||
                      (fieldState.invalid && field.value !== "") ? (
                      <X className="text-red-500" />
                    ) : null}
                  </InputGroupAddon>
                </InputGroup>
                <div dir="rtl">
                  {!fieldState.invalid || field.value === "" ? (
                    <FieldDescription>
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-1" />
                        جهت ثبت شناسه کاربری باید وارد زیر را رعایت کنید
                      </div>
                      <div className="pr-8 mt-4">
                        <u className="no-underline">
                          <li>حداقل طول مجاز 5 کاکتر و حداکثر 20 کارکتر است</li>
                          <li>استفاده از فاصله بین کارکترها مجاز نیست</li>
                          <li>
                            استفاده از اعداد در ابتدای شناسه کاربری مجاز نیست
                          </li>
                          <li>
                            استفاده از زیرخط در ابتدای شناسه کاربری مجاز نیست
                          </li>
                        </u>
                      </div>
                    </FieldDescription>
                  ) : (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </div>
              </Field>
            )}
          />
        </FieldGroup>
      </div>
      <Button
        type="submit"
        disabled={isUsernameAvailable !== true || isLoading || isCheckLoading}
        className="w-full"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}
      </Button>
    </form>
  );
};

export default SetUsernameForm;
