import { ImagePlus, Trash, Upload } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMediaDimensions } from "@/lib/utils";
import { Button } from "../ui/button";

type MediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  width: number;
  height: number;
  fileSize: number;
  order: number;
};

interface FileUploadProps {
  value?: MediaItem[];
  onChange: (val: MediaItem[]) => void;
}
const MAX_IMAGES = 20;
const MAX_FILE_SIZE_MB = 3;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default function FileUpload({ value = [], onChange }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  //? تنظیم ارتفاع بر اساس اندازه صفحه
  const [height, setHeight] = useState(0);
  const isMobile = useIsMobile();
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined") return 0;
    let calculatedH = window.innerHeight - 209;
    if (isMobile) {
      calculatedH = calculatedH - 56;
    }
    setHeight(calculatedH);
  }, [isMobile]);
  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, [calculateHeight]);

  const [selectedIndex, setSelectedIndex] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleAddFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newFiles = Array.from(files);
      const existingImageCount = value.length;

      const errors: string[] = [];
      const validFiles: MediaItem[] = [];

      for (const file of newFiles) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name} فرمت معتبر نیست (PNG, JPG, WEBP)`);
          continue;
        }

        if (existingImageCount + validFiles.length >= MAX_IMAGES) {
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
        const dims = await getMediaDimensions(file);

        //! upload file and create media and create draft post

        validFiles.push({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file), //? uploaded url
          type: dims.type,
          width: dims.width,
          height: dims.height,
          fileSize: file.size,
          order: value.length + validFiles.length,
        });
      }

      if (errors.length > 0) {
        toast.error(errors.join("\n"));
      }

      if (validFiles.length > 0) {
        onChange([...value, ...validFiles]);
        setSelectedIndex(validFiles[0].id);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onChange, value],
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
    (id: string) => {
      const indexToRemove = value.findIndex((item) => item.id === id);
      if (indexToRemove === -1) return;

      const updated = value.filter((item) => item.id !== id);
      onChange(updated);

      if (selectedIndex === id) {
        let nextSelectedIndexId = "";
        if (updated.length > 0) {
          nextSelectedIndexId =
            updated[indexToRemove === 0 ? 0 : indexToRemove - 1].id;
        }
        setSelectedIndex(nextSelectedIndexId);
      }
    },
    [onChange, value, selectedIndex],
  );

  const selected: MediaItem =
    value.find((item) => item.id === selectedIndex) || value[0];

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
          <Upload className="w-10 h-10 text-blue-500 mb-2" />
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
          {selected.type === "image" ? (
            <Image
              src={selected.url}
              width={selected.width}
              height={selected.height}
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
        </div>
      )}
      <div
        className={`${selected ? "h-28" : "h-full"} flex gap-2 items-center max-w-svw px-2 overflow-x-auto  scroll-none`}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`${selected ? "size-28 min-w-28" : "size-full"} bg-accent dark:bg-input/30 cursor-pointer border border-dashed rounded-2xl flex flex-col items-center justify-center`}
        >
          <ImagePlus className="text-muted-foreground" />
        </button>

        {value.map((item) => (
          <div key={item.id} className="relative">
            <button
              type="button"
              onClick={() => setSelectedIndex(item.id)}
              className={`size-28 cursor-pointer rounded-2xl overflow-hidden border align-top
              ${selectedIndex === item.id && "border-blue-500 border-2"}`}
            >
              {item.type === "image" ? (
                <Image
                  src={selected.url}
                  width={80}
                  height={80}
                  alt="preview"
                  priority
                  draggable="false"
                  className="object-cover w-full h-full"
                />
              ) : (
                <video
                  src={selected.url}
                  draggable="false"
                  className="object-cover w-full h-full"
                >
                  <track kind="captions"></track>
                </video>
              )}
            </button>
            <Button
              type="button"
              onClick={() => handleRemove(item.id)}
              className="absolute top-1 left-1"
              size="icon-xs"
              variant="secondary"
            >
              <Trash />
            </Button>
          </div>
        ))}
      </div>

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
