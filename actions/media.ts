"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { deleteFromStorage, uploadToStorage } from "@/lib/storage";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function isValidImageSignature(buffer: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/png") {
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return sig.every((b, i) => buffer[i] === b);
  }
  if (mime === "image/webp") {
    return (
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export const UploadMedia = async (
  postId: string,
  file: File,
  width: number,
  height: number,
  type: "IMAGE" | "VIDEO",
  order: number,
) => {
  const user = await getUser();

  if (!user || !user.username) {
    return {
      success: false,
      message: "لطفا ابتدا وارد شوید",
    };
  }

  try {
    const mediaCount = await prisma.media.count({
      where: { postId },
    });

    if (mediaCount >= 20) {
      return {
        success: false,
        message: "حداکثر 20 رسانه در پست مجاز است",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = file.type;

    if (!ALLOWED_MIME.has(mime)) {
      throw new Error(`نوع فایل مجاز نیست: ${mime}`);
    }

    const size = buffer.length;
    if (size > MAX_FILE_SIZE) {
      throw new Error(`حداکثر حجم مجاز 3 مگابایت است`);
    }

    if (!isValidImageSignature(buffer, mime)) {
      throw new Error(`امضای فایل معتبر نیست`);
    }

    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.name);
    const filename = `${uniqueId}${ext}`;

    const result = await uploadToStorage(buffer, filename, mime);

    if (!result.success) {
      throw new Error(result.message ?? "Upload failed");
    }

    const media = await prisma.media.create({
      data: {
        postId,
        userId: user.id,
        url: result.url as string,
        type,
        width,
        height,
        fileSize: size,
        order,
      },
    });

    revalidatePath("/create");
    revalidatePath("/edit");
    return {
      success: true,
      media: {
        id: media.id,
        url: media.url,
        type: media.type,
        width: width,
        height: height,
        fileSize: size,
        order: media.order,
      },
    };
  } catch (error) {
    console.error("[uploadMedia] خطا:", error);
    return {
      success: false,
      message: (error as Error).message || "خطا در آپلود فایل",
    };
  }
};

export const DeleteMedia = async (mediaId: string) => {
  const user = await getUser();

  if (!user) {
    return {
      success: false,
      message: "لطفا ابتدا وارد شوید",
    };
  }

  try {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error("رسانه یافت نشد");
    }

    // Delete from storage
    const filename = media.url.split("/").pop();
    if (filename) {
      await deleteFromStorage(filename);
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("[deleteMedia] خطا:", error);
    return {
      success: false,
      message: (error as Error).message || "خطا در حذف فایل",
    };
  }
};
