import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOtp(length = 6) {
  return Array.from({ length })
    .map(() => Math.floor(Math.random() * 10))
    .join("");
}

export const DisplayName = (firstName: string, lastName: string) => {
  const displayName =
    firstName || lastName ? `${firstName} ${lastName}` : "کاربر نگاه";
  return displayName;
};

export type MediaDimensions =
  | {
      type: "IMAGE";
      width: number;
      height: number;
    }
  | {
      type: "VIDEO";
      width: number;
      height: number;
      duration: number;
    };

export const getMediaDimensions = (file: File): Promise<MediaDimensions> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        resolve({
          type: "IMAGE",
          width: img.width,
          height: img.height,
        });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => reject("تصویر قابل بارگذاری نیست");
      img.src = url;
      return;
    }

    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");

      video.onloadedmetadata = () => {
        resolve({
          type: "VIDEO",
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
        URL.revokeObjectURL(url);
      };

      video.onerror = () => reject("ویدیو قابل بارگذاری نیست");
      video.src = url;
      return;
    }

    reject("فرمت پشتیبانی نمی‌شود");
  });
};

export function debounce<Args extends unknown[], Return>(
  func: (...args: Args) => Return,
  delay: number,
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function generateRandomArray(count = 10, min = 200, max = 500) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    arr.push(randomNum);
  }
  return arr;
}

export function getAspectRatio(width: number, height: number) {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const divisor = gcd(width, height);
  const aspectWidth = width / divisor;
  const aspectHeight = height / divisor;

  const heightToWidthRatio = height / width;

  return {
    ratio: `${aspectWidth}/${aspectHeight}`,
    width: aspectWidth,
    height: aspectHeight,
    isTall: heightToWidthRatio > 4,
  };
}
