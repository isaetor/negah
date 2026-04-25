"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import { getPosts } from "@/actions/post";
import PostCard from "@/components/app/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { generateRandomArray } from "@/lib/utils";

type Post = {
  media: {
    height: number | null;
    type: "IMAGE" | "VIDEO";
    width: number | null;
    url: string;
  }[];
  id: string;
  title: string | null;
  url: string | null;
};

const breakpointColumnsObj = {
  default: 6,
  1100: 4,
  700: 3,
  500: 2,
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const newPosts = await getPosts(pageNum, 12);

        if (newPosts.length < 12) {
          setHasMore(false);
        }

        if (append) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  useEffect(() => {
    if (page > 1) {
      loadPosts(page, true);
    }
  }, [page, loadPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  return (
    <div className="container mx-auto px-4 space-y-4 pt-4">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-2"
        columnClassName="flex flex-col gap-2"
      >
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        <div ref={observerRef} className="h-20" />
        {/* {generateRandomArray(15).map((num) => (
          <Skeleton
            key={num}
            className="rounded-3xl"
            style={{
              height: num,
            }}
          />
        ))} */}
      </Masonry>
    </div>
  );
}
