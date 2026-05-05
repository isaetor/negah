"use client";
import {
  AlertTriangle,
  Download,
  EllipsisVertical,
  Heart,
  LinkIcon,
  MessageCircle,
  Save,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DownloadMedia } from "@/actions/media";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAspectRatio } from "@/lib/utils";
import PostComments from "./post-comments";

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
  userId: string | null;
};

const PostDetail = ({ post, userId }: Props) => {
  const aspectRatio = getAspectRatio(post.media[0].width, post.media[0].height);
  const [showMore, setShowMore] = useState(false);
  const [showMoreNeeded, setShowMoreNeeded] = useState(false);
  const [open, setOpen] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!descriptionRef.current) return;
    const el = descriptionRef.current;
    setShowMoreNeeded(el.scrollHeight > 84);
  }, []);

  const handleDownload = async () => {
    const url = post.media[0].url;

    const result = await DownloadMedia(url);

    if (result.success && result.data) {
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.contentType });

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } else {
      console.error("Download failed:", result.message);
    }
  };

  return (
    <div
      data-span="4"
      className={`col-span-4 md:h-[80vh] overflow-hidden border-b md:border rounded-b-[16px] md:rounded-[16px] gap-4 ${isMobile ? "not-md:-top-4! not-md:-left-4! not-md:-right-4! not-md:w-auto!" : "not-md:-mx-4 not-md:-mt-4"}`}
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
            width={400}
            height={800}
            loading="eager"
            className={`${aspectRatio.isTall ? "w-full" : "w-full h-full"} object-contain`}
          />
        </div>
        <div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <div className="flex items-center ml-2 -mr-3">
                <Button variant={"ghost"} size={"icon-lg"}>
                  <Heart />
                </Button>
                <span className="font-bold">24</span>
              </div>
              <Button
                variant={"ghost"}
                size={"icon-lg"}
                onClick={() => setOpen(true)}
              >
                <MessageCircle />
              </Button>
              <Button
                variant={"ghost"}
                size={"icon-lg"}
                onClick={handleDownload}
              >
                <Download />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size={"icon-lg"}>
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem>
                    <Share2 />
                    اشتراک گذاری تصویر
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LinkIcon />
                    کپی پیوند
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <AlertTriangle />
                    گزارش تصویر
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button>
              ذخیره
              <Save />
            </Button>
          </div>
          <div
            id="post"
            className="flex flex-col justify-between overflow-y-auto md:h-[calc(80vh-80px)]"
          >
            <div id="detail" className="flex flex-col gap-4 px-4 pb-4">
              <div className="space-y-2">
                <Link href={"/"} className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarImage
                      src={"/avatars/default.png"}
                      alt={"user avatar"}
                    />
                  </Avatar>
                  <span>سعید ترکمان</span>
                </Link>
                <h1 className="font-bold text-2xl">{post.title}</h1>
              </div>
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
            {isMobile ? (
              <Drawer onOpenChange={setOpen} open={open}>
                <DrawerContent className="h-[90svh]">
                  <DrawerHeader>
                    <DrawerTitle>نظرات کاربران</DrawerTitle>
                  </DrawerHeader>
                  <PostComments postId={post.id} userId={userId} />
                </DrawerContent>
              </Drawer>
            ) : (
              <div className="hidden md:block">
                <h2 className="font-bold mb-2 px-4">نظرات کاربران</h2>
                <PostComments postId={post.id} userId={userId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
