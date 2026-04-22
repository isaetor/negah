"use server";

import { PostStatus } from "@/generated/prisma/enums";
import { getUser } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { deleteFromStorage } from "@/lib/storage";

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

export const deletePost = async (postId: string) => {
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
        media: { select: { url: true } },
      },
    });

    if (!post || post.userId !== user.id) {
      return {
        success: false,
        message: "پست یافت نشد",
      };
    }

    for (const m of post.media) {
      const filename = m.url.split("/").pop();
      if (filename) {
        await deleteFromStorage(filename);
      }
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return {
      success: true,
      message: "پست حذف شد",
    };
  } catch (error) {
    console.error("[deletePost] خطا:", error);
    return {
      success: false,
      message: "خطا در حذف پست",
    };
  }
};

export const updatePost = async (
  postId: string,
  data: {
    title?: string;
    description?: string;
    url?: string;
    status: PostStatus;
  },
) => {
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
      select: { userId: true },
    });

    if (!post || post.userId !== user.id) {
      return {
        success: false,
        message: "پست یافت نشد",
      };
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title || undefined,
        description: data.description || undefined,
        url: data.url || undefined,
        status: data.status,
        updatedAt: new Date(),
      },
    });

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
      message: "",
    };
  }
};
