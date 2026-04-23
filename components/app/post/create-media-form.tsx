"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Controller,
  type SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import toast from "react-hot-toast";
import { getPostById, updatePost } from "@/actions/post";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PostStatus } from "@/generated/prisma/enums";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  type CreatePostInput,
  createPostSchema,
  type EditPostInput,
} from "@/lib/validations/post";
import { Button } from "../../ui/button";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "../../ui/custom/responsive-alert-dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "../../ui/field";
import { Input } from "../../ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "../../ui/input-group";
import FileUpload from "./file-upload";

const MIN_SAVING_INDICATOR_MS = 1500;

function autosavePayloadKey(data: CreatePostInput, status: PostStatus) {
  return JSON.stringify({
    title: data.title ?? "",
    description: data.description ?? "",
    url: data.url ?? "",
    status,
  });
}

const CreateMediaForm = ({ id }: { id?: string }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingUploads, setHasPendingUploads] = useState(false);
  const [postId, setPostId] = useState(id || null);
  const [postStatus, setPostStatus] = useState<PostStatus>(PostStatus.DRAFT);
  const [removeLastDialogOpen, setRemoveLastDialogOpen] = useState(false);
  const isMobile = useIsMobile(1024);
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

  const watchedValues = useWatch({ control: form.control });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingStartedAtRef = useRef<number | null>(null);
  const savingBusyRef = useRef(false);
  const savingIndicatorRunRef = useRef(0);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const prevPostIdRef = useRef<string | null>(postId);
  const removeLastConfirmResolver = useRef<((ok: boolean) => void) | null>(
    null,
  );
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load post data for editing
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
          form.reset(initialValues);
          lastSavedSnapshotRef.current = autosavePayloadKey(
            initialValues,
            post.status ?? PostStatus.DRAFT,
          );
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
  }, [postId, isEdit, form, router]);

  const handleAutoSave = useCallback(
    async (
      data: EditPostInput,
      status: PostStatus,
      options?: { quiet?: boolean; toastOnError?: boolean },
    ): Promise<{ success: boolean; message?: string }> => {
      if (!postId) return { success: false };

      const quiet = options?.quiet ?? false;
      const toastOnError = options?.toastOnError ?? true;

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
        if (toastOnError) toast.error(result.message);
        return { success: false, message: result.message };
      } catch (error) {
        console.error("Auto-save failed:", error);
        if (toastOnError) toast.error("خطا در ذخیره خودکار");
        return { success: false, message: "خطا در ذخیره خودکار" };
      }
    },
    [postId],
  );

  const onBeforeRemoveLastMedia = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      removeLastConfirmResolver.current = resolve;
      setRemoveLastDialogOpen(true);
    });
  }, []);

  const resolveRemoveLastDialog = useCallback((confirmed: boolean) => {
    const r = removeLastConfirmResolver.current;
    removeLastConfirmResolver.current = null;
    setRemoveLastDialogOpen(false);
    r?.(confirmed);
  }, []);

  useEffect(() => {
    if (prevPostIdRef.current !== postId) {
      lastSavedSnapshotRef.current = null;
      prevPostIdRef.current = postId;
    }

    if (!postId) return;

    const media = watchedValues?.media ?? [];
    if (media.length === 0) return;

    const snapshot = autosavePayloadKey(
      watchedValues as CreatePostInput,
      postStatus,
    );

    if (snapshot === lastSavedSnapshotRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      debounceTimerRef.current = null;

      const releaseSavingUiIfIdle = () => {
        if (savingBusyRef.current) return;
        if (savingHideTimerRef.current) {
          clearTimeout(savingHideTimerRef.current);
          savingHideTimerRef.current = null;
        }
        if (isMountedRef.current) setIsSaving(false);
      };

      let showedSaving = false;
      let indicatorRun = 0;
      try {
        const current = form.getValues();
        const mediaNow = current.media ?? [];
        if (mediaNow.length === 0) {
          releaseSavingUiIfIdle();
          return;
        }

        const keyNow = autosavePayloadKey(current, postStatus);
        if (keyNow === lastSavedSnapshotRef.current) {
          releaseSavingUiIfIdle();
          return;
        }

        const isValidForAutoSave = await form.trigger(undefined, {
          shouldFocus: false,
        });
        if (!isValidForAutoSave) {
          releaseSavingUiIfIdle();
          return;
        }

        if (savingBusyRef.current) {
          return;
        }

        if (savingHideTimerRef.current) {
          clearTimeout(savingHideTimerRef.current);
          savingHideTimerRef.current = null;
        }

        savingBusyRef.current = true;
        indicatorRun = ++savingIndicatorRunRef.current;
        savingStartedAtRef.current = Date.now();
        setIsSaving(true);
        showedSaving = true;
        const { success } = await handleAutoSave(current, postStatus, {
          quiet: true,
        });
        if (success) {
          lastSavedSnapshotRef.current = keyNow;
          form.reset(current, { keepDirty: false });
        }
      } catch (error) {
        console.error("Auto-save error:", error);
      } finally {
        savingBusyRef.current = false;
        if (showedSaving) {
          const started = savingStartedAtRef.current;
          savingStartedAtRef.current = null;
          const elapsed =
            started != null ? Date.now() - started : MIN_SAVING_INDICATOR_MS;
          const wait = Math.max(0, MIN_SAVING_INDICATOR_MS - elapsed);
          const runForThisSave = indicatorRun;
          savingHideTimerRef.current = setTimeout(() => {
            savingHideTimerRef.current = null;
            if (!isMountedRef.current) return;
            if (savingIndicatorRunRef.current !== runForThisSave) return;
            setIsSaving(false);
          }, wait);
        }
      }
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [watchedValues, postId, postStatus, form, handleAutoSave]);

  const onSubmit: SubmitHandler<EditPostInput> = async (data) => {
    if (hasPendingUploads) {
      toast.error("لطفا تا پایان آپلود همه تصاویر صبر کنید");
      return;
    }
    setIsLoading(true);
    try {
      await handleAutoSave(data, postStatus, { quiet: false });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col justify-between h-full"
    >
      <div className="shrink-0 border-b bg-background">
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center h-14 px-4">
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
            <span className="hidden lg:block">بازگشت</span>
          </Button>
          <SidebarTrigger className="-ml-1 rotate-180" />
        </div>
      </div>
      <div
        className={`${!isMobile && "lg:grid-cols-2"} max-w-6xl w-full h-full max-h-[calc(100vh-112px)] mx-auto grid px-2`}
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
                  onUploadingChange={setHasPendingUploads}
                  isEdit={isEdit}
                  onBeforeRemoveLastMedia={
                    isEdit ? onBeforeRemoveLastMedia : undefined
                  }
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
            className={`${step === 1 ? "hidden md:flex" : "flex"} h-full overflow-auto flex-col justify-between md:justify-start gap-4 px-2 py-4`}
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
                      <InputGroup>
                        <InputGroupTextarea
                          {...field}
                          aria-invalid={fieldState.invalid}
                          maxLength={800}
                          className="max-h-200 min-h-40"
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
                    <Input
                      dir="ltr"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder="https://example.com"
                    />
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
          {!isMobile && hasPendingUploads ? (
            <div className="text-muted-foreground text-sm animate-pulse">
              در حال بارگزاری تصاویر ...
            </div>
          ) : (
            !isMobile &&
            isSaving && (
              <div className="text-muted-foreground text-sm animate-pulse">در حال ذخیره ...</div>
            )
          )}
          {isMobile && step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={
                form.getValues("media").length === 0 || hasPendingUploads
              }
            >
              {hasPendingUploads ? (
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
                (isMobile && isSaving) ||
                hasPendingUploads
              }
              onClick={async () => {
                if (hasPendingUploads) {
                  toast.error("لطفا تا پایان آپلود همه تصاویر صبر کنید");
                  return;
                }
                setIsLoading(true);
                try {
                  setPostStatus(PostStatus.PUBLISHED);
                  const publishedValues = form.getValues();
                  const { success, message: saveMessage } =
                    await handleAutoSave(
                      publishedValues,
                      PostStatus.PUBLISHED,
                      { quiet: true, toastOnError: false },
                    );
                  if (!success) {
                    setPostStatus(PostStatus.DRAFT);
                    toast.error(saveMessage || "خطا در انتشار پست");
                    return;
                  }
                  lastSavedSnapshotRef.current = autosavePayloadKey(
                    publishedValues,
                    PostStatus.PUBLISHED,
                  );
                  form.reset(publishedValues, { keepDirty: false });
                  toast.success("پست منتشر شد");
                } catch (error) {
                  console.error(error);
                  setPostStatus(PostStatus.DRAFT);
                  toast.error("خطا در انتشار پست");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isMobile && hasPendingUploads ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال بارگزاری تصاویر
                </>
              ) : isMobile && isSaving ? (
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
            <Button className="w-full md:w-48" disabled>
              منتشر شده
            </Button>
          )}
        </div>
      </div>
      <ResponsiveAlertDialog
        open={removeLastDialogOpen}
        onOpenChange={(open) => {
          setRemoveLastDialogOpen(open);
          if (!open) {
            queueMicrotask(() => {
              if (removeLastConfirmResolver.current) {
                removeLastConfirmResolver.current(false);
                removeLastConfirmResolver.current = null;
              }
            });
          }
        }}
      >
        <ResponsiveAlertDialogContent size="default" className="max-w-md">
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              حذف آخرین تصویر
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              با حذف آخرین تصویر، این پست به‌طور کامل حذف می‌شود. آیا ادامه
              می‌دهید؟
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <Button
              type="button"
              variant="outlineDestructive"
              size="sm"
              className="col-span-2"
              onClick={() => {
                resolveRemoveLastDialog(true);
              }}
            >
              <Trash />
              حذف پست
            </Button>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </form>
  );
};

export default CreateMediaForm;
