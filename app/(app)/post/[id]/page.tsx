import Image from "next/image";
import { notFound } from "next/navigation";
import { getPosts } from "@/actions/post";
import Masonry from "@/components/app/masonry";
import PostCard from "@/components/app/post-card";
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

  function getAspectRatio(width: number, height: number) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

    const divisor = gcd(width, height);
    const aspectWidth = width / divisor;
    const aspectHeight = height / divisor;

    const heightToWidthRatio = height / width;

    // تشخیص عکس بلند
    let status = "normal";
    if (heightToWidthRatio > 1.5) {
      status = "portrait_tall"; // عکس بلند / عمودی
    }
    if (heightToWidthRatio > 2.5) {
      status = "very_tall"; // عکس خیلی بلند
    }
    if (heightToWidthRatio > 4) {
      status = "extremely_tall"; // عکس بسیار بلند (مثل بنر موبایل)
    }

    return {
      ratio: `${aspectWidth}/${aspectHeight}`,
      ratioDecimal: +(width / height).toFixed(2),
      heightToWidthRatio: +heightToWidthRatio.toFixed(2),
      status: status,
      isTall: heightToWidthRatio > 1.5,
    };
  }
  const isExtremelyTall =
    getAspectRatio(post.media[0].width ?? 0, post.media[0].height ?? 0)
      .status === "extremely_tall";
  return (
    <div className="container mx-auto px-4">
      <Masonry>
        <div className="col-span-2 sm:col-span-3 md:col-span-5 min-h-[60vh] h-full max-h-[calc(90vh-80px)] border md:rounded-3xl gap-4 overflow-hidden -mx-4 md:-mx-0">
          <div className="grid md:grid-cols-2 h-full">
            <div
              className="max-h-[calc(90vh-80px)] contain-strict justify-self-center size-full overflow-y-auto bg-muted"
              style={{
                aspectRatio: getAspectRatio(
                  post.media[0].width ?? 0,
                  post.media[0].height ?? 0,
                ).ratio,
              }}
            >
              <Image
                src={post.media[0].url}
                alt={post.title ?? "post title"}
                width={post.media[0].width ?? 0}
                height={post.media[0].height ?? 0}
                className={`${isExtremelyTall ? "w-full" : "h-full w-full"} object-contain`}
              />
            </div>
            <div className="p-4 md:border-s">
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
