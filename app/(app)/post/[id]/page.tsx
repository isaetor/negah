import { notFound } from "next/navigation";
import { getPosts } from "@/actions/post";
import Masonry from "@/components/app/masonry";
import PostCard from "@/components/app/post/post-card";
import PostDetail from "@/components/app/post/post-detail";
import { PostStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

const PostPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const post = await prisma.post.findFirst({
    where: { id, status: PostStatus.PUBLISHED },
    include: {
      media: true,
    },
  });

  if (!post || post.media.length === 0) {
    notFound();
  }
  const posts = await getPosts();

  return (
    <div className="p-4 md:py-0">
      <Masonry>
        <PostDetail post={post} />
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </Masonry>
    </div>
  );
};

export default PostPage;
