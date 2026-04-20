"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  LockOpen,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
// import toast from "react-hot-toast";
// import { CreatePost } from "@/actions/post";
import { useIsMobile } from "@/hooks/use-mobile";
import { type PostInput, postSchema } from "@/lib/validations/post";
import { Button } from "../ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "../ui/input-group";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import FileUpload from "./file-upload";

const visibilitys = [
  {
    id: "public",
    title: "عمومی",
    description: "این پست برای همه کاربران قابل مشاهده خواهد بود.",
    icon: LockOpen,
  },
  {
    id: "private",
    title: "خصوصی",
    description: "این پست فقط برای شما قابل مشاهده خواهد بود.",
    icon: Lock,
  },
] as const;

const CreateMediaForm = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      media: [],
    },
  });

  const onSubmit: SubmitHandler<PostInput> = async (data) => {
    setIsLoading(true);
    console.log(data);
    // try {
    //   const payload = data as unknown as PostInput;
    //   const result = await CreatePost(payload);
    //   if (result.success) {
    //     toast.success(result.message);
    //     form.reset();
    //     router.push("/");
    //   } else {
    //     if (result.auth === false) router.push("/auth");
    //     toast.error(result.message || "خطا ناشناخته در ذخیره پست");
    //   }
    // } catch (error) {
    //   console.error("Error submitting Post form:", error);
    //   toast.error("خطا در ارسال فرم. لطفاً دوباره تلاش کنید.");
    // } finally {
    setIsLoading(false);
    // }
  };

  return (
    <form className="h-svh" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="border-b">
        <div className="relative max-w-6xl mx-auto px-4 py-2 flex gap-6">
          <Button
            type="button"
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              if (isMobile && step === 2) {
                setStep(1);
              } else {
                router.push(callbackUrl);
              }
            }}
          >
            <ChevronRight className="size-6 md:size-4" />
            <span className="hidden md:block">بازگشت</span>
          </Button>

          <h1 className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 font-bold">
            ایجاد پست
          </h1>
        </div>
      </div>
      <div
        className={`${!isMobile && "md:grid-cols-2"} max-w-6xl w-full h-full max-h-[calc(100%-57px)] mx-auto grid px-2`}
      >
        {((isMobile && step === 1) || !isMobile) && (
          <div className="flex flex-col">
            <Controller
              name="media"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="h-full">
                  <FileUpload {...field} />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {isMobile && step === 1 && (
              <div className="px-2 pb-4">
                <Button onClick={() => setStep(2)} className="w-full">
                  تایید و ادامه
                  <ChevronLeft />
                </Button>
              </div>
            )}
          </div>
        )}
        {((isMobile && step === 2) || !isMobile) && (
          <div
            className={`${step === 1 ? "hidden md:flex" : "flex"} h-full  flex-col justify-between md:justify-start gap-4 px-2 py-4`}
          >
            <FieldGroup>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>عنوان پست</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="به همه بگویید پست شما در مورد چیست"
                        maxLength={100}
                        className="max-h-20"
                      />
                      <InputGroupAddon
                        align="block-end"
                        className="border-t text-xs justify-between"
                      >
                        <InputGroupText className="text-xs">
                          حداکثر 100 کارکتر
                        </InputGroupText>
                        <InputGroupText
                          className={`text-xs gap-1 ${field.value.length === 100 ? "text-destructive" : field.value.length > 80 ? "text-orange-400" : ""}`}
                        >
                          {field.value.length === 100 ? (
                            <AlertTriangle className="size-3" />
                          ) : field.value.length > 80 ? (
                            <AlertCircle className="size-3" />
                          ) : (
                            ""
                          )}
                          100/{field.value.length}
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => {
                  const length = field.value ? field.value.length : 0;
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>توضیحات</FieldLabel>
                      <InputGroup>
                        <InputGroupTextarea
                          {...field}
                          aria-invalid={fieldState.invalid}
                          maxLength={800}
                          className="max-h-80 min-h-40"
                        />
                        <InputGroupAddon
                          align="block-end"
                          className="border-t text-xs justify-between"
                        >
                          <InputGroupText className="text-xs">
                            حداکثر 800 کارکتر
                          </InputGroupText>
                          <InputGroupText
                            className={`text-xs gap-1 ${length === 800 ? "text-destructive" : length > 650 ? "text-orange-400" : ""}`}
                          >
                            {length === 800 ? (
                              <AlertTriangle className="size-3" />
                            ) : length > 650 ? (
                              <AlertCircle className="size-3" />
                            ) : (
                              ""
                            )}
                            800/{length}
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>آدرس سایت</FieldLabel>
                    <InputGroup dir="ltr">
                      <InputGroupInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="example.com"
                        className="pl-1!"
                      />
                      <InputGroupAddon>
                        <InputGroupText>https://</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <Button
              className="w-full"
              disabled={!form.formState.isValid || isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};

export default CreateMediaForm;
