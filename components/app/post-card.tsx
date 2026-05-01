"use client";
import { ArrowUpRight, MoreVertical, Save, Share } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { MediaType } from "@/generated/prisma/browser";
import { getAspectRatio } from "@/lib/utils";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

type Props = {
  post: {
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
};

const PostCard = ({ post }: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const width = post.media[0]?.width;
  const height = post.media[0]?.height;

  const aspectRatio = getAspectRatio(width, height);
  return (
    <Link
      href={`/post/${post.id}`}
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
      <div className="absolute inset-0 bg-linear-180 flex flex-col justify-between from-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="p-2 flex items-center justify-end gap-1">
          <Button>
            <Save />
            ذخیره
          </Button>
        </div>
        <div className="p-2 flex items-center justify-between gap-1">
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
    </Link>
  );
};

export default PostCard;
