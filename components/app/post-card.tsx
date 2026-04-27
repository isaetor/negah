"use client";
import { ArrowUpRight, MoreVertical, Save, Share } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { MediaType } from "@/generated/prisma/browser";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

type Props = {
  post: {
    media: {
      url: string;
      type: MediaType;
      width: number | null;
      height: number | null;
    }[];
    id: string;
    title: string | null;
    url: string | null;
  };
};

const PostCard = ({ post }: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const width = post.media[0]?.width || 200;
  const height = post.media[0]?.height || 600;

  return (
    <Link
      href={`/post/${post.id}`}
      key={post.id}
      className="relative group cursor-pointer rounded-3xl overflow-hidden"
    >
      <div className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
        {!isLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full -z-10" />
        )}
        <Image
          src={post.media[0]?.url}
          alt={post.title || "Post Image"}
          width={width}
          height={height}
          className="w-full h-auto object-cover"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      </div>
      <div className="absolute inset-0 bg-linear-180 flex flex-col justify-between from-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="p-2 flex items-center justify-end gap-1">
          <Button>
            <Save />
            ذخیره
          </Button>
        </div>
        <div className="p-2 flex items-center justify-between gap-1">
          {post.url && (
            <Button className="border-0" size="sm" variant="outline" asChild>
              <Link href={post.url}>
                <ArrowUpRight />
                مشاهده سایت
              </Link>
            </Button>
          )}
          <div className="flex items-center gap-2 ms-auto">
            <Button className="border-0" size="icon-sm" variant="outline">
              <Share />
            </Button>
            <Button className="border-0" size="icon-sm" variant="outline">
              <MoreVertical />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
