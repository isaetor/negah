import Image from "next/image";
import { notFound } from "next/navigation";
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

  return (
    <div className="container mx-auto px-4">
      <h1>{post.title}</h1>
      <p>{post.description}</p>
      <Image
        src={post.media[0].url}
        alt={post.title ?? ""}
        width={post.media[0].width ?? 0}
        height={post.media[0].height ?? 0}
      />
    </div>
  );
};

export default PostPage;
