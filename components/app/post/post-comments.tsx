"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Ellipsis,
  Heart,
  Loader2,
  SendHorizontal,
  Trash,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Controller,
  type SubmitHandler,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import toast from "react-hot-toast";
import {
  createComment,
  deleteComment,
  getComments,
  ToggleLikeComment,
} from "@/actions/comment";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/components/ui/custom/responsive-alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { getRelativeTime } from "@/lib/utils";
import { type CommentInput, commentSchema } from "@/lib/validations/comment";

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  createdAt: Date;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  replies?: Comment[];
}

const PostComments = ({
  postId,
  userId,
}: {
  postId: string;
  userId: string | null;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [reply, setReply] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const loadCommets = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getComments(postId);

      if (result.length > 0) {
        setComments(result);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadCommets();
  }, [loadCommets]);

  const form = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  type CommentFromServer = {
    id: string;
    content: string;
    createdAt: Date;
    user: Comment["user"];
    replies?: CommentFromServer[];
  };

  const normalizeComment = (comment: CommentFromServer): Comment => {
    return {
      ...comment,
      likeCount: 0,
      isLikedByCurrentUser: false,
      replies: comment.replies?.map(normalizeComment) || [],
    };
  };

  const onSubmit: SubmitHandler<CommentInput> = async (data) => {
    if (data.content.length === 0 && !userId) return;
    setSubmitting(true);
    try {
      const result = await createComment(
        postId,
        data,
        editId,
        reply ? reply.id : null,
      );
      if (result.success && result.comment) {
        form.reset();

        let newComments = [...comments];

        if (editId) {
          newComments = newComments.map((comment) => {
            if (comment.id === editId) {
              return {
                ...comment,
                content: result.comment.content,
              };
            }

            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === editId
                    ? {
                        ...reply,
                        content: result.comment.content,
                      }
                    : reply,
                ),
              };
            }
            return comment;
          });
        } else if (reply?.id) {
          const newReply = normalizeComment(result.comment);

          newComments = newComments.map((comment) => {
            if (comment.id === reply.id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: [...comment.replies, newReply],
              };
            }
            return comment;
          });
        } else {
          const newComment = normalizeComment(result.comment);
          newComments = [newComment, ...newComments];
        }

        setComments(newComments);
        setEditId(null);
        setReply(null);
        toast.success(result.message);
      } else {
        console.error("Error creating comment:", result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!userId) {
      toast.error("برای لایک کردن باید وارد شوید");
      return;
    }
    if (!deleteCommentId) return;
    setIsDeleting(true);
    try {
      const del = await deleteComment([deleteCommentId]);
      if (del.success) {
        setComments(
          comments.filter((comment) => comment.id !== deleteCommentId),
        );
        setDeleteCommentId(null);
        setOpen(false);
      } else {
        toast.error(del.message || "خطا در حذف دیدگاه");
      }
    } catch (error) {
      console.error(error);
      toast.error("خطا در حذف دیدگاه. لطفا دوباره تلاش کنید.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!userId) {
      toast.error("برای لایک کردن باید وارد شوید");
      return;
    }

    try {
      const result = await ToggleLikeComment(commentId);

      if (result.success) {
        // به‌روزرسانی state
        setComments((prevComments) => {
          return prevComments.map((comment) => {
            // به‌روزرسانی کامنت اصلی
            if (comment.id === commentId) {
              return {
                ...comment,
                likeCount: result.isLiked
                  ? comment.likeCount + 1
                  : comment.likeCount - 1,
                isLikedByCurrentUser: result.isLiked || false,
              };
            }

            // جستجو در ریپلای‌ها
            if (comment.replies && comment.replies?.length > 0) {
              return {
                ...comment,
                replies: comment.replies.map((reply) => {
                  if (reply.id === commentId) {
                    return {
                      ...reply,
                      likeCount: result.isLiked
                        ? comment.likeCount + 1
                        : comment.likeCount - 1,
                      isLikedByCurrentUser: result.isLiked || false,
                    };
                  }
                  return reply;
                }),
              };
            }

            return comment;
          });
        });
      } else {
        toast.error(result.message || "");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("خطا در ثبت لایک");
    }
  };

  return (
    <div id="commets" className="flex flex-col gap-2 justify-between px-4 pb-4">
      <div
        className={`h-[calc(90svh-145px)] md:h-60 ${isLoading ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {isLoading ? (
          <>
            <div className="flex items-start gap-2 mb-4">
              <Skeleton className="size-7 rounded-full" />
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                  <Skeleton className="size-8" />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 mb-4">
              <Skeleton className="size-7 rounded-full" />
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                  <Skeleton className="size-8" />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 mb-4">
              <Skeleton className="size-7 rounded-full" />
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                  <Skeleton className="size-8" />
                </div>
              </div>
            </div>
          </>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            هنوز دیدگاهی ثبت نشده است
          </p>
        ) : (
          comments.map((comment) => {
            return (
              <div key={comment.id} className="mb-4">
                <CommentItem
                  postId={postId}
                  userId={userId}
                  comment={comment}
                  handleLike={handleLike}
                  setEditId={setEditId}
                  setReply={setReply}
                  setDeleteCommentId={setDeleteCommentId}
                  setOpen={setOpen}
                  form={form}
                />
                {comment.replies?.map((reply) => (
                  <div key={reply.id} className="mr-10">
                    <CommentItem
                      postId={postId}
                      userId={userId}
                      comment={reply}
                      handleLike={handleLike}
                      setEditId={setEditId}
                      setReply={setReply}
                      setDeleteCommentId={setDeleteCommentId}
                      setOpen={setOpen}
                      form={form}
                    />
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
      {userId ? (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            name="content"
            control={form.control}
            render={({ field }) => {
              return (
                <Field>
                  <InputGroup>
                    <InputGroupInput
                      id="comment-input"
                      maxLength={400}
                      {...field}
                      placeholder={
                        editId
                          ? "ویرایش دیدگاه خود"
                          : reply
                            ? `پاسخ به ${reply.name}`
                            : "دیدگاه خود را بنویسید"
                      }
                    />
                    {form.getValues("content").length > 0 && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="submit"
                          variant="ghost"
                          size={"icon-sm"}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <SendHorizontal className="rotate-180" />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
              );
            }}
          />
        </form>
      ) : (
        <div className="flex items-center justify-between gap-4 h-11 text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="size-4" />
            جهت ثبت دیدگاه ابتدا وارد شود
          </div>
          <Button size={"sm"} variant={"outline"} asChild>
            <Link href={`/auth?callbackUrl=/post/${postId}`}>ورود به حساب</Link>
          </Button>
        </div>
      )}
      {userId && (
        <ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
          <ResponsiveAlertDialogContent>
            <ResponsiveAlertDialogHeader>
              <ResponsiveAlertDialogTitle>
                حذف دیدگاه
              </ResponsiveAlertDialogTitle>
              <ResponsiveAlertDialogDescription>
                آیا از حذف دائمی این دیدگاه اطمینان دارید؟ این عمل قابل بازگشت
                نیست و دیدگاه به طور کامل از سیستم پاک خواهد شد.
              </ResponsiveAlertDialogDescription>
            </ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogFooter>
              <Button
                type="button"
                variant="outlineDestructive"
                size="sm"
                className="col-span-2"
                disabled={isDeleting}
                onClick={handleDeleteComment}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    در حال حذف دیدگاه
                  </>
                ) : (
                  <>
                    <Trash />
                    حذف دیدگاه
                  </>
                )}
              </Button>
            </ResponsiveAlertDialogFooter>
          </ResponsiveAlertDialogContent>
        </ResponsiveAlertDialog>
      )}
    </div>
  );
};

export default PostComments;

export const CommentItem = ({
  postId,
  userId,
  comment,
  setReply,
  setEditId,
  setDeleteCommentId,
  setOpen,
  handleLike,
  form,
}: {
  postId: string;
  userId: string | null;
  comment: Comment;
  setReply: (value: { id: string; name: string } | null) => void;
  setEditId: (value: string | null) => void;
  setDeleteCommentId: (deleteCommentId: string) => void;
  setOpen: (open: boolean) => void;
  handleLike: (commentId: string) => void;
  form: UseFormReturn<CommentInput>;
}) => {
  const router = useRouter();
  const displayName =
    comment.user.firstName || comment.user.lastName
      ? `${comment.user.firstName || ""} ${comment.user.lastName || ""}`
      : comment.user.username || "کاربر ناشناس";
  return (
    <div className="flex items-start gap-2 mb-4">
      <Avatar size="sm">
        <AvatarImage
          src={comment.user.avatar || "/avatars/default.png"}
          alt={"user avatar"}
        />
      </Avatar>
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {getRelativeTime(comment.createdAt)}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-full">
            <p className="text-sm">{comment.content}</p>
            <div className="flex items-center ">
              <Button
                size={"xs"}
                variant={"simple"}
                className="-mr-2"
                onClick={() => {
                  if (userId) {
                    setEditId(null);
                    setReply({ id: comment.id, name: displayName });
                    document.getElementById("comment-input")?.focus();
                  } else {
                    router.push(`/auth?callbackUrl=/post/${postId}`);
                  }
                }}
              >
                پاسخ
              </Button>
              {userId === comment.user.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size={"icon-xs"}>
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditId(comment.id);

                        setReply(null);
                        setTimeout(() => {
                          document.getElementById("comment-input")?.focus();
                          form.setValue("content", comment.content);
                        }, 300);
                      }}
                    >
                      <Edit />
                      ویرایش
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setDeleteCommentId(comment.id);
                        setOpen(true);
                      }}
                    >
                      <Trash />
                      حذف دیدگاه
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center text-xs">
            <Button
              size={"icon-xs"}
              variant={"simple"}
              className="-mt-1.5"
              onClick={() => handleLike(comment.id)}
            >
              <Heart
                className={
                  comment.isLikedByCurrentUser
                    ? "fill-red-500 stroke-red-500"
                    : ""
                }
              />
            </Button>
            {comment.likeCount > 0 && comment.likeCount}
          </div>
        </div>
      </div>
    </div>
  );
};
