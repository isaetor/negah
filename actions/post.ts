"use server";

import prisma from "@/lib/prisma";

// import path from "node:path";
// import { getUser } from "@/lib/dal";
// import { deleteFromLiara, uploadToLiara } from "@/lib/liara-storage";
// import { type PostInput, postSchema } from "@/lib/validations/post";

// const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
// const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// function isValidImageSignature(buffer: Buffer, mime: string): boolean {
//   if (mime === "image/jpeg") {
//     return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
//   }
//   if (mime === "image/png") {
//     const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
//     return sig.every((b, i) => buffer[i] === b);
//   }
//   if (mime === "image/webp") {
//     return (
//       buffer.slice(0, 4).toString("ascii") === "RIFF" &&
//       buffer.slice(8, 12).toString("ascii") === "WEBP"
//     );
//   }
//   return false;
// }

// export const CreatePost = async (data: PostInput) => {
//   const user = await getUser();

//   if (!user || (user && !user.username)) {
//     return {
//       success: false,
//       message: "لطفا ابتدا وارد شوید",
//       auth: false,
//     };
//   }
//   const validatedFields = postSchema.safeParse(data);
//   if (!validatedFields.success) {
//     return {
//       success: false,
//       message: "اطلاعات وارد شده معتبر نیستند",
//     };
//   }

//   const uploaded = [];
//   try {
//     for (const media of validatedFields.data.media) {
//       const mime = media.file.type;
//       const size = media.file.size ?? 0;
//       if (!ALLOWED_MIME.has(mime)) {
//         throw new Error(`نوع فایل مجاز نیست: ${mime}`);
//       }

//       if (size > MAX_FILE_SIZE) {
//         throw new Error(`حداکثر حجم مجاز 5 مگابایت است`);
//       }

//       const arrayBuffer = await media.file.arrayBuffer();
//       const buffer = Buffer.from(arrayBuffer);
//       if (!isValidImageSignature(buffer, mime)) {
//         throw new Error(`امضای فایل معتبر نیست`);
//       }

//       const uniqueId = crypto.randomUUID();
//       const ext = path.extname(media.file.name);
//       const filename = `${uniqueId}${ext}`;

//       const result = await uploadToLiara(buffer, filename, mime);

//       if (!result.success) throw new Error(result.message ?? "Upload failed");
//       uploaded.push({ ...result, id: media.id, filename: filename });
//     }
//   } catch (err) {
//     const failedMessage = (err as Error).message;
//     for (const uploadItem of uploaded) {
//       await deleteFromLiara(uploadItem.filename);
//     }
//     return {
//       success: false,
//       message: `آپلود فایل شکست خورد: ${failedMessage}`,
//     };
//   }

//   try {
//     await connectToDatabase();

//     const postDoc = await Post.create({
//       owner: user.id,
//       title: validatedFields.data.title,
//       description: validatedFields.data.description,
//       visibility: validatedFields.data.visibility,
//     });

//     const uploadedIds: Types.ObjectId[] = [];
//     await Promise.all(
//       uploaded.map(async (item) => {
//         const data = validatedFields.data.media.find(
//           (media) => media.id === item.id,
//         );
//         const created = await Media.create({
//           post: postDoc.id,
//           url: item.url,
//           type: data?.type,
//           width: data?.width,
//           height: data?.height,
//           fileSize: data?.fileSize,
//           order: data?.order,
//         });
//         uploadedIds.push(created.id);
//       }),
//     );

//     postDoc.media = uploadedIds;
//     await postDoc.save();

//     return {
//       success: true,
//       message: "پست با موفقیت ایجاد شد",
//       postId: postDoc.id,
//     };
//   } catch (error) {
//     console.error("[createPost] خطا:", error);
//     for (const uploadItem of uploaded) {
//       await deleteFromLiara(uploadItem.filename);
//     }
//     return {
//       success: false,
//       message: "خطا در ایجاد پست",
//     };
//   }
// };

export const getPosts = async () => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        url: true,
        media: {
          select: { url: true, type: true, width: true, height: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw new Error("Failed to fetch posts");
  }
};
