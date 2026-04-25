"use client";
import { ImageOff, Loader2, Plus, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { deletePosts } from "@/actions/post";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/components/ui/custom/responsive-alert-dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePostForm } from "@/lib/contexts/post-form-context";

function getRemainingDays(createdAt: Date) {
  const now = new Date();
  const target = new Date(createdAt);
  target.setDate(target.getDate() + 30);
  const remainingMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
}

export function PostSidebar({
  posts,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  posts: {
    id: string;
    title: string | null;
    media: {
      id: string;
      url: string | null;
    }[];
    createdAt: Date;
  }[];
}) {
  const router = useRouter();
  const { postId, isUploading } = usePostForm();
  const [isDeleted, setIsDeleted] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const postIds = useMemo(() => posts.map((post) => post.id), [posts]);
  const allSelected = posts.length > 0 && selectedIds.length === posts.length;
  const hasSelection = selectedIds.length > 0;

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => postIds.includes(id)));
  }, [postIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : postIds);
  };

  const openDeleteDialog = (ids: string[]) => {
    if (ids.length === 0) return;
    setDeleteIds(ids);
    setOpen(true);
  };

  const handleCreatePostClick = () => {
    router.push(`/create?new=${Date.now()}`);
  };

  const handleDeletePost = async () => {
    if (deleteIds.length === 0) return;
    setIsDeleted(true);
    try {
      const del = await deletePosts(deleteIds);
      if (!del.success) {
        toast.error(del.message || "خطا در حذف پست");
        return;
      }
      setSelectedIds((prev) => prev.filter((id) => !deleteIds.includes(id)));
      setDeleteIds([]);
      setOpen(false);
      router.push("/create");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("خطا در حذف پست. لطفا دوباره تلاش کنید.");
    } finally {
      setIsDeleted(false);
    }
  };

  return (
    <>
      <Sidebar {...props} className="border-r">
        {posts.length === 0 ? (
          <Empty className="h-full bg-background/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ImageOff />
              </EmptyMedia>
              <EmptyTitle>هیچ پیش‌نویسی وجود ندارد</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                برای شروع، روی دکمه زیر کلیک کنید و اولین پست خود را ایجاد کنید.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading || isDeleted}
                onClick={handleCreatePostClick}
              >
                <Plus />
                افزودن پست
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <SidebarHeader className="border-b bg-background p-0 h-14 flex items-center justify-center">
              پست های پیش‌نویس
            </SidebarHeader>
            <SidebarContent className="p-2">
              {posts.length > 1 && (
                <div className="flex items-center justify-between gap-2 h-6">
                  <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      disabled={isDeleted}
                    />
                    انتخاب همه
                  </Label>
                  {selectedIds.length > 0 && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outlineDestructive"
                      onClick={() => openDeleteDialog(selectedIds)}
                      disabled={!hasSelection || isDeleted}
                    >
                      <Trash />
                      حذف همه
                    </Button>
                  )}
                </div>
              )}

              <SidebarMenu className="gap-2">
                {posts.map((post) => {
                  const isCurrentUploading = postId === post.id && isUploading;
                  const isChecked = selectedIds.includes(post.id);
                  const remainingDays = getRemainingDays(post.createdAt);
                  const remainingClass =
                    remainingDays < 7
                      ? "text-destructive"
                      : "text-muted-foreground";

                  return (
                    <SidebarMenuItem
                      key={post.id}
                      className="relative flex items-center gap-2"
                    >
                      {posts.length > 1 && (
                        <Checkbox
                          checked={isChecked}
                          disabled={isDeleted || isCurrentUploading}
                          onCheckedChange={() => toggleSelect(post.id)}
                        />
                      )}
                      <div className="flex items-start border flex-1 bg-background rounded-xl p-2 ">
                        <Link
                          href={`/edit/${post.id}`}
                          className={`flex items-center gap-3 flex-1 ${
                            isCurrentUploading
                              ? "pointer-events-none opacity-50"
                              : ""
                          }`}
                        >
                          <Image
                            src={post.media[0]?.url ?? "/placeholder.png"}
                            width={80}
                            height={80}
                            alt={post.title || "title post"}
                            className="rounded-lg aspect-square object-cover"
                          />
                          <div className="flex flex-col justify-between w-full h-20 gap-2 py-2 pl-2 min-w-0">
                            <p
                              className={`line-clamp-2 leading-5 text-xs ${!post.title && "text-muted-foreground"}`}
                            >
                              {post.title || "بدون عنوان"}
                            </p>
                            <p
                              className={`text-xs leading-3 ${remainingClass}`}
                            >
                              {remainingDays} روز اعتبار دارد
                            </p>
                          </div>
                        </Link>

                        <Button
                          type="button"
                          size="icon-xs"
                          variant="outlineDestructive"
                          onClick={() => openDeleteDialog([post.id])}
                          disabled={isDeleted || isCurrentUploading}
                        >
                          <Trash />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
            <SidebarRail />

            <SidebarFooter className="border-t h-14 p-0">
              <Button
                type="button"
                variant="outline"
                className="w-full h-full rounded-none border-0"
                disabled={isUploading || isDeleted}
                onClick={handleCreatePostClick}
              >
                <Plus />
                افزودن پست
              </Button>
            </SidebarFooter>
          </>
        )}
      </Sidebar>
      <ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              {deleteIds.length > 1
                ? "آیا از حذف پست های انتخاب شده مطمئن هستید؟"
                : "آیا از حذف این پست مطمئن هستید؟"}
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              با حذف این پست، تمام محتوای آن از جمله متن، ویدیو و تمام تصاویر
              برای همیشه پاک خواهد شد. این عمل غیرقابل بازگشت است.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <Button
              type="button"
              variant="outlineDestructive"
              size="sm"
              className="col-span-2 md:w-28"
              onClick={handleDeletePost}
            >
              {isDeleted ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Trash />
                  حذف پست
                </>
              )}
            </Button>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}
