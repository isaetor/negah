import { ImagePlus, Loader2, Trash, Upload } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { DeleteMedia, UploadMedia } from "@/actions/media";
import { createPost, deletePost } from "@/actions/post";
import { getMediaDimensions } from "@/lib/utils";
import { Button } from "../../ui/button";

type MediaItem = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  width: number | null;
  height: number | null;
  fileSize: number | null;
  order: number;
};

interface FileUploadProps {
  value?: MediaItem[];
  onChange: (val: MediaItem[]) => void;
  postId: string | null;
  setPostId: (postId: string | null) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  isEdit?: boolean;
  onBeforeRemoveLastMedia?: () => Promise<boolean>;
  onAfterEntirePostDeleted?: () => void;
}
const MAX_IMAGES = 20;
const MAX_FILE_SIZE_MB = 3;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

type UploadCandidate = {
  file: File;
  tempId: string;
  dims: Awaited<ReturnType<typeof getMediaDimensions>>;
};

function addIdToSet(prev: Set<string>, id: string) {
  const next = new Set(prev);
  next.add(id);
  return next;
}

function removeIdFromSet(prev: Set<string>, id: string) {
  const next = new Set(prev);
  next.delete(id);
  return next;
}

function getNextSelectedIdAfterRemoval(
  media: MediaItem[],
  removedIndex: number,
): string {
  if (media.length === 0) return "";
  return media[removedIndex === 0 ? 0 : removedIndex - 1].id;
}

export default function FileUpload({
  value = [],
  onChange,
  postId,
  setPostId,
  onUploadingChange,
  isEdit = false,
  onBeforeRemoveLastMedia,
  onAfterEntirePostDeleted,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const blobUrlsRef = useRef<Map<string, string>>(new Map());
  const tempToServerIdRef = useRef<Map<string, string>>(new Map());

  const [selectedIndex, setSelectedIndex] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [uploadingTempIds, setUploadingTempIds] = useState<Set<string>>(
    new Set(),
  );
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const valueRef = useRef(value);
  const selectedIndexRef = useRef(selectedIndex);

  //? تنظیم ارتفاع بر اساس اندازه صفحه
  const [height, setHeight] = useState(0);

  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined") return 0;
    setHeight(window.innerHeight - 265);
  }, []);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    onUploadingChange?.(uploadingTempIds.size > 0);
  }, [onUploadingChange, uploadingTempIds]);

  const stopUploadingFor = useCallback((id: string) => {
    setUploadingTempIds((prev) => removeIdFromSet(prev, id));
  }, []);

  const startDeletingFor = useCallback((id: string) => {
    setDeletingIds((prev) => addIdToSet(prev, id));
  }, []);

  const stopDeletingFor = useCallback((id: string) => {
    setDeletingIds((prev) => removeIdFromSet(prev, id));
  }, []);

  const revokeBlobUrl = useCallback((id: string) => {
    const blobUrl = blobUrlsRef.current.get(id);
    if (!blobUrl) return;
    URL.revokeObjectURL(blobUrl);
    blobUrlsRef.current.delete(id);
  }, []);

  const removeMediaById = useCallback(
    (id: string) => {
      const nextMedia = valueRef.current.filter((item) => item.id !== id);
      onChange(nextMedia);
      return nextMedia;
    },
    [onChange],
  );

  const patchMediaById = useCallback(
    (
      id: string,
      patch: Partial<Pick<MediaItem, "fileSize" | "order">>,
    ): MediaItem[] | null => {
      const currentMedia = valueRef.current;
      if (!currentMedia.some((item) => item.id === id)) {
        return null;
      }

      const nextMedia = currentMedia.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      onChange(nextMedia);
      return nextMedia;
    },
    [onChange],
  );

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
      // Cleanup blob URLs
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
      tempToServerIdRef.current.clear();
    };
  }, [calculateHeight]);
  //? end

  const handleAddFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files);
      const existingImageCount = valueRef.current.length;

      const errors: string[] = [];
      const immediateFiles: MediaItem[] = [];
      const uploadCandidates: UploadCandidate[] = [];
      const postIdForNewUploads = postId;

      // معتبر‌سازی فایل‌ها و ایجاد preview محلی
      for (const file of newFiles) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name} فرمت معتبر نیست (PNG, JPG, WEBP)`);
          continue;
        }

        if (existingImageCount + immediateFiles.length >= MAX_IMAGES) {
          errors.push(`حداکثر ${MAX_IMAGES} تصویر مجاز است`);
          break;
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_FILE_SIZE_MB) {
          errors.push(
            `حجم تصویر ${file.name} نباید بیشتر از ${MAX_FILE_SIZE_MB} مگابایت باشد`,
          );
          continue;
        }

        try {
          // فوری preview بسازید
          const blobUrl = URL.createObjectURL(file);
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          blobUrlsRef.current.set(tempId, blobUrl);

          const dims = await getMediaDimensions(file);

          immediateFiles.push({
            id: tempId,
            url: blobUrl,
            type: dims.type,
            width: dims.width,
            height: dims.height,
            fileSize: file.size,
            order: existingImageCount + immediateFiles.length,
          });

          uploadCandidates.push({ file, tempId, dims });
        } catch (error) {
          console.error(error);
          errors.push("خطای نامشخص در خواندن فایل");
        }
      }

      // نمایش preview محلی بلافاصله
      if (immediateFiles.length > 0) {
        onChange([...valueRef.current, ...immediateFiles]);
        setSelectedIndex(immediateFiles[0].id);
        setUploadingTempIds((prev) => {
          const next = new Set(prev);
          immediateFiles.forEach((item) => {
            next.add(item.id);
          });
          return next;
        });

        // اپلود در پس‌زمینه
        (async () => {
          let currentPostId = postIdForNewUploads;

          for (const [
            uploadIndex,
            { file, tempId, dims },
          ] of uploadCandidates.entries()) {
            try {
              // ایجاد post اگر لازم باشد
              if (!currentPostId) {
                const post = await createPost();
                if (post.success && post.postId) {
                  setPostId(post.postId);
                  currentPostId = post.postId;
                } else {
                  toast.error(post.message || "خطا در ایجاد پست");
                  // حذف preview ناموفق
                  removeMediaById(tempId);
                  tempToServerIdRef.current.delete(tempId);
                  stopUploadingFor(tempId);
                  revokeBlobUrl(tempId);
                  continue;
                }
              }

              if (!currentPostId) continue;

              // اپلود فایل
              const uploadResult = await UploadMedia(
                currentPostId,
                file,
                dims.width,
                dims.height,
                dims.type,
                existingImageCount + uploadIndex,
              );

              if (uploadResult.success && uploadResult.media) {
                // ذخیره نقشه tempId -> serverId
                tempToServerIdRef.current.set(tempId, uploadResult.media.id);

                // فقط metadata را بروزرسانی کن، ID و URL محلی را ثابت نگاه دار
                patchMediaById(tempId, {
                  fileSize: uploadResult.media.fileSize,
                  order: uploadResult.media.order,
                });
                stopUploadingFor(tempId);
              } else {
                // حذف preview در صورت شکست اپلود
                toast.error(uploadResult.message || "خطا در هنگام آپلود رسانه");
                removeMediaById(tempId);
                tempToServerIdRef.current.delete(tempId);
                stopUploadingFor(tempId);
                revokeBlobUrl(tempId);
              }
            } catch (error) {
              console.error(error);
              toast.error("خطای نامشخص در آپلود و ذخیره رسانه");
              removeMediaById(tempId);
              tempToServerIdRef.current.delete(tempId);
              stopUploadingFor(tempId);
              revokeBlobUrl(tempId);
            }
          }
        })();
      }

      if (errors.length > 0) {
        toast.error(errors.join("\n"));
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [
      onChange,
      patchMediaById,
      postId,
      removeMediaById,
      revokeBlobUrl,
      setPostId,
      stopUploadingFor,
    ],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleAddFiles(e.target.files);
    },
    [handleAddFiles],
  );
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleAddFiles(files);
      }
    },
    [handleAddFiles],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      if (deletingIds.has(id)) return;
      const currentMedia = valueRef.current;
      const indexToRemove = currentMedia.findIndex((item) => item.id === id);
      if (indexToRemove === -1) return;

      const isLast = currentMedia.length === 1;
      const currentPostId = postId;
      const mappedServerId = tempToServerIdRef.current.get(id);
      startDeletingFor(id);

      try {
        if (isLast && isEdit && onBeforeRemoveLastMedia) {
          const confirmed = await onBeforeRemoveLastMedia();
          if (!confirmed) return;
          if (!currentPostId) return;
          const del = await deletePost(currentPostId);
          if (!del.success) {
            toast.error(del.message || "خطا در حذف پست");
            return;
          }
          onChange([]);
          setPostId(null);
          setSelectedIndex("");
          onAfterEntirePostDeleted?.();
          return;
        }

        if (id.startsWith("temp-") && !mappedServerId) {
          const updated = currentMedia.filter((item) => item.id !== id);
          onChange(updated);
          stopUploadingFor(id);
          revokeBlobUrl(id);
          if (selectedIndexRef.current === id) {
            setSelectedIndex(
              getNextSelectedIdAfterRemoval(updated, indexToRemove),
            );
          }
          return;
        }

        const { success, message } = await DeleteMedia(mappedServerId ?? id);
        if (!success) {
          return toast.error(message || "خطا در حذف رسانه");
        }
        const updated = currentMedia.filter((item) => item.id !== id);
        onChange(updated);
        stopUploadingFor(id);

        if (isLast && !isEdit && currentPostId) {
          const del = await deletePost(currentPostId);
          if (!del.success) {
            toast.error(del.message || "خطا در حذف پست");
          } else {
            setPostId(null);
          }
        }

        if (selectedIndexRef.current === id) {
          setSelectedIndex(
            getNextSelectedIdAfterRemoval(updated, indexToRemove),
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("خطا در حذف رسانه. لطفا دوباره تلاش کنید.");
      } finally {
        stopDeletingFor(id);
      }
    },
    [
      deletingIds,
      onChange,
      postId,
      isEdit,
      onBeforeRemoveLastMedia,
      onAfterEntirePostDeleted,
      setPostId,
      revokeBlobUrl,
      startDeletingFor,
      stopDeletingFor,
      stopUploadingFor,
    ],
  );

  const selected: MediaItem =
    value.find((item) => item.id === selectedIndex) || value[0];
  const isSelectedUploading = selected
    ? uploadingTempIds.has(selected.id)
    : false;

  const horizontalScrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const mouseStartX = useRef<number>(0);
  const lastX = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Momentum scroll animation
  const animateScroll = useCallback(() => {
    if (!horizontalScrollContainerRef.current) return;

    const container = horizontalScrollContainerRef.current;
    velocityRef.current *= 0.95; // Deceleration

    if (Math.abs(velocityRef.current) > 0.5) {
      container.scrollLeft += velocityRef.current;
      animationFrameRef.current = requestAnimationFrame(animateScroll);
    } else {
      velocityRef.current = 0;
      animationFrameRef.current = null;
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!horizontalScrollContainerRef.current) return;

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsMouseDown(true);
    mouseStartX.current = e.clientX;
    lastX.current = e.clientX;
    lastTime.current = Date.now();
    velocityRef.current = 0;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!horizontalScrollContainerRef.current) return;

      const container = horizontalScrollContainerRef.current;
      const currentX = e.clientX;
      const currentTime = Date.now();
      const timeDelta = Math.max(currentTime - lastTime.current, 1);

      const diff = mouseStartX.current - currentX;
      container.scrollLeft += diff;
      mouseStartX.current = currentX;

      // Calculate velocity for momentum
      velocityRef.current = (lastX.current - currentX) / (timeDelta / 16); // Normalize to 60fps
      lastX.current = currentX;
      lastTime.current = currentTime;
    };

    const handleMouseUp = () => {
      setIsMouseDown(false);
      // Start momentum animation
      if (Math.abs(velocityRef.current) > 1) {
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      }
    };

    if (isMouseDown) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isMouseDown, animateScroll]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      touchStartX.current = e.touches[0].clientX;
      lastX.current = e.touches[0].clientX;
      lastTime.current = Date.now();
      velocityRef.current = 0;
    },
    [],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!horizontalScrollContainerRef.current) return;

    const container = horizontalScrollContainerRef.current;
    const touchCurrentX = e.touches[0].clientX;
    const currentTime = Date.now();
    const timeDelta = Math.max(currentTime - lastTime.current, 1);

    const diff = touchStartX.current - touchCurrentX;
    container.scrollLeft += diff;
    touchStartX.current = touchCurrentX;

    // Calculate velocity for momentum
    velocityRef.current = (lastX.current - touchCurrentX) / (timeDelta / 16);
    lastX.current = touchCurrentX;
    lastTime.current = currentTime;
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Start momentum animation for touch
    if (Math.abs(velocityRef.current) > 1) {
      animationFrameRef.current = requestAnimationFrame(animateScroll);
    }
  }, [animateScroll]);

  useEffect(() => {
    const container = horizontalScrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const horizontalDelta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      if (horizontalDelta === 0) return;
      container.scrollLeft += horizontalDelta;
      e.preventDefault();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <section
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-label="File upload drop zone"
      className="relative flex flex-col gap-2 h-full pt-4 pb-4"
    >
      {isDragging && (
        <div className="absolute inset-x-0 inset-y-2 bg-accent border-3 border-blue-500 border-dashed rounded-2xl flex flex-col items-center justify-center z-10">
          <Upload className="size-14 text-blue-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700">
            فایل خود را اینجا رها کنید
          </p>
          <p className="text-sm text-gray-500 mt-1">
            فرمت‌های مجاز: PNG, JPG, WebP
          </p>
        </div>
      )}
      {selected && (
        <div
          className="relative mx-2 border rounded-2xl overflow-hidden flex items-center justify-center bg-accent dark:bg-input/30"
          style={{ height }}
        >
          {selected.type === "IMAGE" ? (
            <Image
              src={selected.url}
              width={selected.width ?? 1}
              height={selected.height ?? 1}
              alt="preview"
              draggable="false"
              className="w-full h-full object-contain"
              priority
            />
          ) : (
            <video
              controls
              className="max-h-full"
              draggable="false"
              src={selected.url}
            >
              <track kind="captions"></track>
            </video>
          )}
          {isSelectedUploading && (
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <span className="rounded-md bg-black/60 px-3 py-1 text-sm text-white">
                در حال آپلود...
              </span>
            </div>
          )}
        </div>
      )}

      {/* لیست تصاویر */}
      <section
        ref={horizontalScrollContainerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="Media thumbnails gallery"
        className={`${selected ? "h-28" : "h-full"} flex gap-2 items-center max-w-svw px-2 overflow-x-auto scroll-none select-none`}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`${selected ? "size-28 min-w-28" : "size-full"} bg-accent dark:bg-input/30 cursor-pointer border-2 border-dashed rounded-2xl flex flex-col items-center justify-center`}
        >
          {value.length === 0 ? (
            <div className="flex flex-col gap-1 items-center text-muted-foreground">
              <ImagePlus className="size-14 mb-4  " />
              <p className="font-bold text-lg">تصویر خود را انتخاب کنید</p>
              <p className="text-sm text-center px-3 leading-relaxed max-w-xs">
                حداکثر {MAX_IMAGES} تصویر و هر تصویر تا {MAX_FILE_SIZE_MB}{" "}
                مگابایت
              </p>
            </div>
          ) : (
            <ImagePlus className="text-muted-foreground" />
          )}
        </button>

        {value.map((item) => {
          const isItemUploading = uploadingTempIds.has(item.id);
          const isItemDeleting = deletingIds.has(item.id);

          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedIndex(item.id)}
                className={`size-28 cursor-pointer rounded-2xl overflow-hidden border align-top
              ${selectedIndex === item.id && "border-blue-500 border-2"}`}
              >
                {item.type === "IMAGE" ? (
                  <Image
                    src={item.url}
                    width={80}
                    height={80}
                    alt="preview"
                    priority
                    draggable="false"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <video
                    src={item.url}
                    draggable="false"
                    className="object-cover w-full h-full"
                  >
                    <track kind="captions"></track>
                  </video>
                )}
              </button>
              {!isItemUploading && (
                <Button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-1 left-1"
                  size="icon-xs"
                  variant="secondary"
                  disabled={isItemDeleting}
                >
                  {isItemDeleting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash />
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </section>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </section>
  );
}
