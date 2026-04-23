import { PostSidebar } from "@/components/app/post/post-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PostStatus } from "@/generated/prisma/enums";
import { getUser } from "@/lib/dal";
import prisma from "@/lib/prisma";

const PostLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getUser();
  if (!user) return;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      userId: user.id,
      status: PostStatus.DRAFT,
    },
    select: {
      id: true,
      title: true,
      media: {
        select: {
          id: true,
          url: true,
        },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  return (
    <SidebarProvider
      defaultOpen={posts.length > 0}
      style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
    >
      <SidebarInset>{children}</SidebarInset>
      <PostSidebar posts={posts} />
    </SidebarProvider>
  );
};

export default PostLayout;
