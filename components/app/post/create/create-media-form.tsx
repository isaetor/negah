"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { getPostById, updatePost } from "@/actions/post";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PostStatus } from "@/generated/prisma/enums";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePostForm } from "@/lib/contexts/post-form-context";
import {
  type CreatePostInput,
  createPostSchema,
  type EditPostInput,
} from "@/lib/validations/post";
import { Button } from "../../../ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "../../../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "../../../ui/input-group";
import FileUpload from "./file-upload";

const MIN_AUTOSAVE_INDICATOR_MS = 1000;

const CreateMediaForm = ({ id }: { id?: string }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const {
    postId,
    setPostId,
    postStatus,
    setPostStatus,
    isUploading,
    setIsUploading,
    setFormData,
  } = usePostForm();
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const isEdit = Boolean(id);

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      media: [],
    },
    mode: "onChange",
  });
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveIndicatorTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const autoSaveInFlightRef = useRef(false);
  const media = form.watch("media");
  const hasMedia = media.length > 0;
  const watchedTitle = form.watch("title");
  const watchedDescription = form.watch("description");
  const watchedUrl = form.watch("url");

  //! Initialize postId from route param
  useEffect(() => {
    if (id) {
      setPostId(id);
    }
  }, [id, setPostId]);
  //! end

  //! Load post data for editing
  useEffect(() => {
    if (!isEdit || !postId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadPost = async () => {
      setIsLoading(true);
      try {
        const { success, message, post } = await getPostById(postId);
        if (cancelled) return;

        if (success && post) {
          setPostStatus(post.status ?? PostStatus.DRAFT);
          const initialValues: CreatePostInput = {
            title: post.title || "",
            description: post.description || "",
            url: post.url || "",
            media: post.media,
          };
          console.log(initialValues);
          form.reset(initialValues);
          setFormData(initialValues);
        } else {
          toast.error(message || "خطا در بارگذاری پست");
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading post:", error);
        if (!cancelled) {
          toast.error("خطا در بارگذاری پست");
          router.push("/");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [postId, isEdit, form, router, setPostStatus, setFormData]);
  //! end Load post data

  //! auto save
  const handleSavePost = useCallback(
    async (
      data: EditPostInput,
      status: PostStatus,
      options?: { quiet?: boolean },
    ): Promise<{ success: boolean; message?: string }> => {
      if (!postId) return { success: false };

      const quiet = options?.quiet ?? false;

      try {
        const result = await updatePost(
          postId,
          {
            title: data.title,
            description: data.description,
            url: data.url,
          },
          status,
        );
        if (result.success) {
          if (!quiet) toast.success(result.message);
          return { success: true };
        }
        toast.error(result.message);
        return { success: false, message: result.message };
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("خطا در ذخیره پست");
        return { success: false, message: "خطا در ذخیره پست" };
      }
    },
    [postId],
  );
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      if (autoSaveIndicatorTimeoutRef.current) {
        clearTimeout(autoSaveIndicatorTimeoutRef.current);
        autoSaveIndicatorTimeoutRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (
      watchedTitle === undefined &&
      watchedDescription === undefined &&
      watchedUrl === undefined
    ) {
      return;
    }

    if (!postId || !hasMedia || isUploading || isLoading || isAutoSaving)
      return;
    if (!form.formState.isDirty || !form.formState.isValid) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (autoSaveInFlightRef.current) return;
      autoSaveInFlightRef.current = true;
      setIsAutoSaving(true);
      const startedAt = Date.now();

      try {
        const currentValues = form.getValues();
        const { success } = await handleSavePost(
          {
            title: currentValues.title,
            description: currentValues.description,
            url: currentValues.url,
          },
          postStatus,
          { quiet: true },
        );

        if (success) {
          form.reset(currentValues, {
            keepValues: true,
            keepDirty: false,
          });
          setFormData(currentValues);
        }
      } finally {
        autoSaveInFlightRef.current = false;
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_AUTOSAVE_INDICATOR_MS - elapsed);
        if (autoSaveIndicatorTimeoutRef.current) {
          clearTimeout(autoSaveIndicatorTimeoutRef.current);
        }
        autoSaveIndicatorTimeoutRef.current = setTimeout(() => {
          setIsAutoSaving(false);
          autoSaveIndicatorTimeoutRef.current = null;
        }, remaining);
      }
    }, 900);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [
    form,
    handleSavePost,
    hasMedia,
    isAutoSaving,
    isLoading,
    isUploading,
    postId,
    postStatus,
    setFormData,
    watchedDescription,
    watchedTitle,
    watchedUrl,
  ]);

  const onSubmit: SubmitHandler<EditPostInput> = async (data) => {
    if (isUploading) {
      toast.error("لطفا تا پایان آپلود همه تصاویر صبر کنید");
      return;
    }
    if (!hasMedia) {
      return;
    }
    setIsLoading(true);
    try {
      await handleSavePost(data, postStatus, { quiet: false });
      setFormData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  //! end auto save

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col justify-between h-full"
    >
      <div className="shrink-0 border-b bg-background h-14 relative">
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center h-full px-4">
          <Button
            type="button"
            variant={"ghost"}
            size={isMobile ? "icon" : "sm"}
            className="-mr-1"
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
          <h1 className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 font-bold">
            {isEdit ? "ویرایش پست" : "افزودن پست"}
          </h1>
          <SidebarTrigger className="-ml-1 rotate-180" />
        </div>
      </div>
      <div
        className={`${!isMobile && "md:grid-cols-2"} max-w-6xl w-full h-full max-h-[calc(100vh-112px)] mx-auto grid`}
      >
        {((isMobile && step === 1) || !isMobile) && (
          <Controller
            name="media"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="h-full">
                <FileUpload
                  {...field}
                  postId={postId}
                  setPostId={setPostId}
                  onUploadingChange={setIsUploading}
                  isEdit={isEdit}
                  onAfterEntirePostDeleted={
                    isEdit ? () => router.push(`/${callbackUrl}`) : undefined
                  }
                />
              </Field>
            )}
          />
        )}
        {((isMobile && step === 2) || !isMobile) && (
          <div
            className={`${step === 1 ? "hidden md:flex" : "flex"} h-full overflow-y-auto flex-col justify-between md:justify-start gap-4 p-4`}
          >
            <FieldGroup>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => {
                  const titleLength = field.value?.length ?? 0;
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>عنوان پست</FieldLabel>
                      <InputGroup disabled={!hasMedia}>
                        <InputGroupTextarea
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder="به همه بگویید پست شما در مورد چیست"
                          maxLength={100}
                          className="max-h-20"
                          disabled={!hasMedia}
                        />
                        <InputGroupAddon
                          align="block-end"
                          className="border-t text-xs justify-between"
                        >
                          <InputGroupText className="text-xs">
                            حداکثر 100 کارکتر
                          </InputGroupText>
                          <InputGroupText
                            className={`text-xs gap-1 ${titleLength === 100 ? "text-destructive" : titleLength > 80 ? "text-orange-400" : ""}`}
                          >
                            {titleLength === 100 ? (
                              <AlertTriangle className="size-3" />
                            ) : titleLength > 80 ? (
                              <AlertCircle className="size-3" />
                            ) : (
                              ""
                            )}
                            100/{titleLength}
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
                render={({ field, fieldState }) => {
                  const length = field.value ? field.value.length : 0;
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>توضیحات</FieldLabel>
                      <InputGroup disabled={!hasMedia}>
                        <InputGroupTextarea
                          {...field}
                          aria-invalid={fieldState.invalid}
                          maxLength={800}
                          className="max-h-80 min-h-40"
                          disabled={!hasMedia}
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
                name="url"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>آدرس سایت</FieldLabel>
                    <InputGroup dir="ltr" disabled={!hasMedia}>
                      <InputGroupInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="example.com"
                        className="pl-0! -mb-0.5"
                        disabled={!hasMedia}
                      />
                      <InputGroupAddon>
                        <InputGroupText className="-mb-0.5">
                          https://
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t h-14 flex items-center z-20 px-4 bg-background">
        <div className="mx-auto max-w-6xl w-full flex justify-end items-center gap-6">
          {!isMobile && isUploading ? (
            <div className="text-muted-foreground text-sm animate-pulse">
              در حال بارگزاری تصاویر ...
            </div>
          ) : !isMobile && isAutoSaving ? (
            <div className="text-muted-foreground text-sm animate-pulse">
              در حال ذخیره ...
            </div>
          ) : null}
          {isMobile && step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={form.getValues("media").length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال بارگزاری تصاویر
                </>
              ) : (
                <>
                  تایید و ادامه
                  <ChevronLeft />
                </>
              )}
            </Button>
          ) : postStatus === PostStatus.DRAFT ? (
            <Button
              type="button"
              className="w-full md:w-48"
              disabled={
                !form.formState.isValid ||
                isLoading ||
                isUploading ||
                !hasMedia ||
                isAutoSaving
              }
              onClick={async () => {
                if (isUploading) {
                  toast.error("لطفا تا پایان آپلود همه تصاویر صبر کنید");
                  return;
                }
                setIsLoading(true);
                try {
                  setPostStatus(PostStatus.PUBLISHED);
                  const publishedValues = form.getValues();
                  const { success, message: saveMessage } =
                    await handleSavePost(
                      publishedValues,
                      PostStatus.PUBLISHED,
                      { quiet: true },
                    );
                  if (!success) {
                    setPostStatus(PostStatus.DRAFT);
                    toast.error(saveMessage || "خطا در انتشار پست");
                    return;
                  }
                  form.reset(publishedValues, { keepDirty: false });
                  // Update form data in context
                  setFormData(publishedValues);
                  toast.success("پست منتشر شد");
                  if (postId) {
                    router.push(`/post/${postId}`);
                  }
                } catch (error) {
                  console.error(error);
                  setPostStatus(PostStatus.DRAFT);
                  toast.error("خطا در انتشار پست");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isMobile && isUploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال بارگزاری تصاویر
                </>
              ) : isMobile && isAutoSaving ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال ذخیره
                </>
              ) : isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "انتشار پست"
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full md:w-48"
              disabled={
                !form.formState.isValid ||
                isLoading ||
                isUploading ||
                !hasMedia ||
                isAutoSaving
              }
            >
              {isMobile && isUploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال بارگزاری تصاویر
                </>
              ) : isMobile && isAutoSaving ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال ذخیره
                </>
              ) : isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "ذخیره"
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreateMediaForm;
