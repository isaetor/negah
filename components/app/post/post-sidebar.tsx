"use client";
import { Loader2, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deletePost } from "@/actions/post";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { ResponsiveAlertDialog, ResponsiveAlertDialogContent, ResponsiveAlertDialogDescription, ResponsiveAlertDialogFooter, ResponsiveAlertDialogHeader, ResponsiveAlertDialogTitle } from "@/components/ui/custom/responsive-alert-dialog";

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
  }[];
}) {
  const router = useRouter();
  const [isDeleted, setIsDeleted] = useState(false)
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState("")

  const handleDeletePost = async () => {
    if (!deleteId) return
    setIsDeleted(true)
    try {
      const del = await deletePost(deleteId);
      if (!del.success) {
        toast.error(del.message || "خطا در حذف پست");
        return;
      }
      setOpen(false)
      router.push("/create");
    } catch (error) {
      console.error(error);
      toast.error("خطا در حذف پست. لطفا دوباره تلاش کنید.");
    } finally {
      setIsDeleted(false)
    }
  };

  return (
    <>
      <Sidebar {...props}>
        <SidebarContent className="border-r">
          <SidebarGroup>
            <SidebarGroupLabel>پست های پیش فرض</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {posts.map((post) => (
                  <Link key={post.id} href={`/edit/${post.id}`} className="group">
                    <SidebarMenuItem className="border bg-background rounded-xl flex items-start gap-3 p-1">
                      <Image
                        src={post.media[0]?.url ?? "https://via.placeholder.com/70"}
                        width={70}
                        height={70}
                        alt={post.title || "title post"}
                        className="rounded-lg aspect-square object-cover"
                      />
                      <div className="flex justify-between w-full gap-2 py-2 pl-2">
                        <p className={`max-w-44 line-clamp-2 ${!post.title ? "text-muted-foreground text-xs" : ""}`}>
                          {post.title || "بدون عنوان"}
                        </p>
                        <Button
                          size={"icon-xs"}
                          variant={"outlineDestructive"}
                          onClick={() => {
                            setDeleteId(post.id)
                            setOpen(true)
                          }}
                          disabled={isDeleted}
                        >
                          <Trash />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  </Link>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <ResponsiveAlertDialog
        open={open}
        onOpenChange={setOpen}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>آیا از حذف این پست مطمئن هستید؟</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>با حذف این پست، تمام محتوای آن از جمله متن، ویدیو و تمام تصاویر برای همیشه پاک خواهد شد. این عمل غیرقابل بازگشت است.</ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <Button
              type="button"
              variant="outlineDestructive"
              size="sm"
              className="col-span-2 md:w-28"
              onClick={() => {
                handleDeletePost();
              }}
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
