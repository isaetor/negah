import Image from "next/image";
import { notFound } from "next/navigation";
import { getPosts } from "@/actions/post";
import Masonry from "@/components/app/masonry";
import PostCard from "@/components/app/post-card";
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
        <div className="col-span-2 sm:col-span-3 md:col-span-4 min-h-[60vh] h-full max-h-[calc(90vh-80px)] border md:rounded-3xl gap-4 overflow-hidden -mx-4 md:mx-0">
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
              <h1>{post.title}</h1>
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
