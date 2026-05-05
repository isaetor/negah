"use server";

import { revalidatePath } from "next/cache";
import { PostStatus } from "@/generated/prisma/enums";
import { getUser } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { deleteFromStorage } from "@/lib/storage";
import { postSchema } from "@/lib/validations/post";

export const createPost = async () => {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        message: "لطفا ابتدا وارد شوید",
      };
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        status: PostStatus.DRAFT,
      },
      select: {
        id: true,
      },
    });

    return {
      success: true,
      postId: post.id,
    };
  } catch (error) {
    console.error("[createPost] خطا:", error);
    return {
      success: false,
      message: "خطای سرور در ایجاد پست",
    };
  }
};

export const deletePosts = async (postIds: string[]) => {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        message: "لطفا ابتدا وارد شوید",
      };
    }

    if (postIds.length === 0) {
      return {
        success: false,
        message: "هیچ پستی برای حذف انتخاب نشده است",
      };
    }

    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        userId: user.id,
      },
      select: {
        id: true,
        media: { select: { url: true } },
      },
    });

    if (posts.length === 0) {
      return {
        success: false,
        message: "پست معتبری برای حذف یافت نشد",
      };
    }

    for (const post of posts) {
      for (const m of post.media) {
        const filename = m.url.split("/").pop();
        if (filename) {
          await deleteFromStorage(filename);
        }
      }
    }

    await prisma.post.deleteMany({
      where: {
        id: { in: posts.map((post) => post.id) },
        userId: user.id,
      },
    });

    revalidatePath("/create");
    revalidatePath("/edit");
    return {
      success: true,
      message:
        posts.length === 1 ? "پست حذف شد" : "پست های انتخاب شده حذف شدند",
    };
  } catch (error) {
    console.error("[deletePosts] خطا:", error);
    return {
      success: false,
      message: "خطا در حذف گروهی پست ها",
    };
  }
};

export const updatePost = async (
  postId: string,
  data: {
    title: string;
    description?: string;
    url?: string;
  },
  status: PostStatus,
) => {
  const result = postSchema.safeParse({ ...data });

  if (!result.success) {
    return {
      success: false,
      message: "تمامی مقادیر به مورد نیاز ثبت نشده است",
    };
  }

  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        message: "لطفا ابتدا وارد شوید",
      };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
        media: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!post || post.userId !== user.id) {
      return {
        success: false,
        message: "پست یافت نشد",
      };
    }

    if (post.media.length === 0) {
      return {
        success: false,
        message: "برای ذخیره پست، حداقل یک تصویر آپلود کنید",
      };
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        title: result.data.title,
        description: result.data.description,
        url: result.data.url,
        status: status,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/create");
    revalidatePath("/edit");
    return {
      success: true,
      message: "پست ذخیره شد",
    };
  } catch (error) {
    console.error("[updatePost] خطا:", error);
    return {
      success: false,
      message: "خطا در ذخیره پست",
    };
  }
};

export const getPosts = async (page: number = 1, limit: number = 24) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
    console.error("[getPosts] خطا:", error);
    throw new Error("Failed to fetch posts");
  }
};

export const getPostById = async (id: string) => {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        message: "لطفا ابتدا وارد شوید",
      };
    }

    const row = await prisma.post.findUnique({
      where: { id: id },
      select: {
        userId: true,
        id: true,
        status: true,
        title: true,
        description: true,
        url: true,
        media: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            url: true,
            type: true,
            width: true,
            height: true,
            fileSize: true,
            order: true,
          },
        },
      },
    });

    if (!row || row.userId !== user.id) {
      return {
        success: false,
        message: "پست مورد نظر یافت نشد",
      };
    }

    const { userId: _owner, ...post } = row;
    return {
      success: true,
      post,
    };
  } catch (error) {
    console.error("[getPostById] خطا:", error);
    return {
      success: false,
      message: "خطا در دریافت پست",
    };
  }
};
