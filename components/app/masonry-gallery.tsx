"use client";
import { ExternalLink, MoreVertical, Save, Share } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Masonry from "react-masonry-css";
import type { MediaType } from "@/generated/prisma/browser";
import { Button } from "../ui/button";

const breakpointColumnsObj = {
  default: 6,
  1100: 4,
  700: 3,
  500: 2,
};

type Props = {
  posts: {
    media: {
      height: number | null;
      type: MediaType;
      width: number | null;
      url: string;
    }[];
    id: string;
    title: string | null;
    url: string | null;
  }[];
};

const MasonryGallery = ({ posts }: Props) => {
  const postsWithCover = posts.filter((post) => post.media[0]?.url);

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex gap-2"
      columnClassName="flex flex-col gap-2"
    >
      {postsWithCover.map((post) => {
        const cover = post.media[0];
        return (
          <Link
            href={`/edit/${post.id}`}
            key={post.id}
            className="relative group cursor-pointer"
          >
            <Image
              src={cover.url}
              alt={post.title || "Post Image"}
              width={cover.width || 600}
              height={cover.height || 900}
              loading="eager"
              className="rounded-2xl"
            />
            <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Button
                size="xs"
                // onClick={(e) => {
                //   e.preventDefault();
                //   handleSaveClick(post);
                // }}
              >
                <Save />
                ذخیره
              </Button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {post.url && (
                <div className="w-full">
                  <Button className="w-full" size="xs" variant="secondary">
                    <ExternalLink />
                    {post.url}
                  </Button>
                </div>
              )}
              <Button size="icon-xs" variant="secondary">
                <Share />
              </Button>
              <Button size="icon-xs" variant="secondary">
                <MoreVertical />
              </Button>
            </div>
          </Link>
        );
      })}
    </Masonry>
  );
};

export default MasonryGallery;
