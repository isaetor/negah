"use client";
import { Download, Heart, MessageCircle, Save, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAspectRatio } from "@/lib/utils";

type Props = {
  post: {
    media: {
      url: string;
      type: string;
      width: number;
      height: number;
    }[];
    id: string;
    title: string | null;
    description: string | null;
    url: string | null;
  };
};

const PostDetail = ({ post }: Props) => {
  const aspectRatio = getAspectRatio(post.media[0].width, post.media[0].height);
  const [showMore, setShowMore] = useState(false);
  const [showMoreNeeded, setShowMoreNeeded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!descriptionRef.current) return;
    const el = descriptionRef.current;
    setShowMoreNeeded(el.scrollHeight > 84);
  }, []);

  return (
    <div
      data-span="4"
      className="col-span-4 md:h-[80vh] overflow-hidden border-b border rounded-b-[16px] md:rounded-[16px] gap-4 not-md:-top-4! not-md:-left-4! not-md:-right-4! not-md:w-auto!"
    >
      <div className="grid md:grid-cols-2 min-h-full">
        <div
          className="md:max-h-[80vh] contain-strict justify-self-center size-full md:overflow-y-auto"
          style={{
            aspectRatio: aspectRatio.ratio,
          }}
        >
          <Image
            src={post.media[0].url}
            alt={post.title ?? "post title"}
            width={post.media[0].width}
            height={post.media[0].height}
            className={`${aspectRatio.isTall ? "w-full" : "w-full h-full"} object-contain`}
          />
        </div>
        <div className="py-2 px-4 md:p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center ml-2 -mr-3">
                <Button variant={"ghost"} size={"icon-lg"}>
                  <Heart />
                </Button>
                <span className="font-bold">24</span>
              </div>
              <Button variant={"ghost"} size={"icon-lg"}>
                <MessageCircle />
              </Button>
              <Button variant={"ghost"} size={"icon-lg"}>
                <Share2 />
              </Button>
              <Button variant={"ghost"} size={"icon-lg"}>
                <Download />
              </Button>
            </div>
            <Button>
              ذخیره
              <Save />
            </Button>
          </div>
          <h1 className="font-bold text-2xl">{post.title}</h1>
          {post.description && (
            <div className="flex flex-col gap-1">
              <h2 className="font-bold">توضیحات</h2>
              <p
                ref={descriptionRef}
                className={`text-muted-foreground leading-7 ${!showMore && showMoreNeeded ? "line-clamp-3" : ""}`}
              >
                {post.description}
              </p>
              {showMoreNeeded && (
                <Button
                  variant={"simple"}
                  size={"xs"}
                  className="text-foreground mr-auto w-auto"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? "نمایش کمتر" : "مشاهده بیشتر"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
