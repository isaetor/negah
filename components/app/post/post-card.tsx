"use client";
import { ArrowUpRight, MoreVertical, Save, Share } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaType } from "@/generated/prisma/browser";
import { getAspectRatio } from "@/lib/utils";

export type PostProps = {
  media: {
    url: string;
    type: MediaType;
    width: number;
    height: number;
  }[];
  id: string;
  title: string | null;
  url: string | null;
};

const PostCard = ({ post }: { post: PostProps }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const width = post.media[0]?.width;
  const height = post.media[0]?.height;

  const aspectRatio = getAspectRatio(width, height);
  return (
    <div
      key={post.id}
      className="relative group cursor-pointer rounded-[16px] overflow-hidden"
      style={{
        aspectRatio: aspectRatio.isTall
          ? `${aspectRatio.width}/${aspectRatio.width * 2}`
          : aspectRatio.ratio,
      }}
    >
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full -z-10" />
      )}
      <Link href={`/post/${post.id}`}>
        <Image
          src={post.media[0]?.url}
          alt={post.title || "Post Image"}
          width={200}
          height={600}
          className="w-full h-auto object-cover"
          loading="eager"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
        <div className="absolute inset-0 bg-linear-180 from-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </Link>
      <div className="absolute left-2 top-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <Button>
          ذخیره
          <Save />
        </Button>
      </div>
      <div
        className={
          `absolute left-2 bottom-2 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ` +
          (post.url && "right-2")
        }
      >
        {post.url && (
          <Button className="border-0" size="xs" variant="simple" asChild>
            <Link href={post.url}>
              <ArrowUpRight />
              مشاهده سایت
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-2 ms-auto">
          <Button className="border-0" size="icon-xs" variant="simple">
            <Share />
          </Button>
          <Button className="border-0" size="icon-xs" variant="simple">
            <MoreVertical />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
