import { Heart } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPosts } from "@/actions/post";
import Masonry from "@/components/app/masonry";
import PostCard from "@/components/app/post-card";
import { Button } from "@/components/ui/button";
import { PostStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { getAspectRatio } from "@/lib/utils";

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

  const isTall = getAspectRatio(
    post.media[0].width,
    post.media[0].height,
  ).isTall;
  return (
    <div className="p-4 md:py-0">
      <Masonry>
        <div
          data-span="4"
          className="min-h-[60vh] h-full max-h-[calc(90vh-80px)] border-b md:border rounded-b-3xl md:rounded-3xl gap-4 not-md:-top-4! not-md:-left-4! not-md:-right-4! not-md:w-auto!"
        >
          <div className="grid md:grid-cols-2 h-full">
            <div
              className="max-h-[calc(90vh-80px)] contain-strict justify-self-center size-full overflow-y-auto"
              style={{
                aspectRatio: getAspectRatio(
                  post.media[0].width,
                  post.media[0].height,
                ).ratio,
              }}
            >
              <Image
                src={post.media[0].url}
                alt={post.title ?? "post title"}
                width={post.media[0].width}
                height={post.media[0].height}
                className={`${isTall ? "w-full" : "h-full w-full"} object-contain`}
              />
            </div>
            <div className="p-4">
              <div>
                <Button>
                  <Heart />
                </Button>
              </div>
              <h1 className="font-bold text-2xl">{post.title}</h1>
              <p>{post.description}</p>
            </div>
          </div>
        </div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </Masonry>
    </div>
  );
};

export default PostPage;
