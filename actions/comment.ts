"use server";

import { getUser, verifySession } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { commentSchema } from "@/lib/validations/comment";

export const getComments = async (
  postId: string,
  page: number = 1,
  limit: number = 12,
) => {
  try {
    const currentUser = await verifySession();
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            username: true,
          },
        },
        likes: currentUser?.userId
          ? {
              where: { userId: currentUser.userId },
              select: { userId: true },
              take: 1,
            }
          : false,
      },
    });

    const commentIds = comments.map((c) => c.id);
    const likesCount = await prisma.commentLike.groupBy({
      by: ["commentId"],
      where: {
        commentId: { in: commentIds },
      },
      _count: {
        userId: true,
      },
    });

    const likesCountMap = new Map(
      likesCount.map((item) => [item.commentId, item._count.userId]),
    );

    const mainComments = comments.filter((c) => !c.parentId);
    const replies = comments.filter((c) => c.parentId);

    const getAllReplies = (commentId: string) => {
      const directReplies = replies.filter((r) => r.parentId === commentId);
      const allReplies = [...directReplies];

      for (const reply of directReplies) {
        allReplies.push(...getAllReplies(reply.id));
      }

      return allReplies;
    };

    return mainComments.map((comment) => {
      const processedReplies = getAllReplies(comment.id).map((reply) => ({
        ...reply,
        likeCount: likesCountMap.get(reply.id) || 0,
        isLikedByCurrentUser: currentUser?.userId
          ? reply.likes?.length > 0
          : false,
        likes: undefined,
      }));

      return {
        ...comment,
        likeCount: likesCountMap.get(comment.id) || 0,
        isLikedByCurrentUser: currentUser?.userId
          ? comment.likes?.length > 0
          : false,
        replies: processedReplies,
        likes: undefined,
      };
    });
  } catch (error) {
    console.error("[getCommentsOptimized] خطا:", error);
    throw new Error("Failed to fetch comments");
  }
};

export const createComment = async (
  postId: string,
  data: {
    content: string;
  },
  editId: string | null,
  parentId: string | null,
) => {
  const result = commentSchema.safeParse({ ...data });

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
        id: true,
      },
    });

    if (!post) {
      return {
        success: false,
        message: "پست یافت نشد",
      };
    }

    if (parentId) {
      const commentReply = await prisma.comment.findUnique({
        where: { id: parentId },
        select: {
          id: true,
        },
      });
      if (!commentReply) {
        return {
          success: false,
          message: "دیدگاه مورد نظر جهت پاسخ به آن یافت نشد",
        };
      }
    }

    let comment = {
      id: "",
      content: "",
      createdAt: new Date(),
    };

    if (editId) {
      comment = await prisma.comment.update({
        where: { id: editId },
        data: {
          content: result.data.content,
          //   updatedAt: new Date(),
        },
      });
    } else {
      comment = await prisma.comment.create({
        data: {
          postId: post.id,
          content: result.data.content,
          userId: user.id,
          parentId: parentId,
        },
      });
    }

    return {
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
      },
      message: editId
        ? "دیدگاه بروزرسانی شد"
        : parentId
          ? "پاسخ ثبت شد"
          : "دیدگاه شما ثبت شد",
    };
  } catch (error) {
    console.error("[createComment] خطا:", error);
    return {
      success: false,
      message: "خطا در هنگام افزودن دیدگاه",
    };
  }
};

export const deleteComment = async (commentIds: string[]) => {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        message: "لطفا ابتدا وارد شوید",
      };
    }

    if (commentIds.length === 0) {
      return {
        success: false,
        message: "هیچ دیدگاهی برای حذف انتخاب نشده است",
      };
    }

    const comments = await prisma.comment.findMany({
      where: {
        id: { in: commentIds },
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (comments.length === 0) {
      return {
        success: false,
        message: "دیدگاه معتبری برای حذف یافت نشد",
      };
    }

    await prisma.comment.deleteMany({
      where: {
        id: { in: comments.map((comment) => comment.id) },
        userId: user.id,
      },
    });

    return {
      success: true,
      message:
        comments.length === 1 ? "پست حذف شد" : "پست های انتخاب شده حذف شدند",
    };
  } catch (error) {
    console.error("[deletePosts] خطا:", error);
    return {
      success: false,
      message: "خطا در حذف گروهی پست ها",
    };
  }
};

export const ToggleLikeComment = async (commentId: string) => {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        message: "لطفا ابتدا وارد شوید",
      };
    }

    if (!commentId) {
      return {
        success: false,
        message: "هیچ دیدگاهی برای پسندیدن انتخاب نشده است",
      };
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          commentId_userId: {
            commentId: commentId,
            userId: user.id,
          },
        },
      });

      return {
        success: true,
        isLiked: false,
      };
    } else {
      await prisma.commentLike.create({
        data: {
          commentId: commentId,
          userId: user.id,
        },
      });

      return {
        success: true,
        isLiked: true,
      };
    }
  } catch (error) {
    console.error("[ToggleLikeComment] خطا:", error);
    return {
      success: false,
      message: "خطا در ثبت لایک",
    };
  }
};
