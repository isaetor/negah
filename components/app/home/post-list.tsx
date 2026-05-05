"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPosts } from "@/actions/post";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import Masonry from "../masonry";
import type { PostProps } from "../post/post-card";
import PostCard from "../post/post-card";
import PostsSkeleton from "../post/posts-skeleton";

type PostListProps = {
  initPosts: PostProps[];
  initPage: number;
};

const PostList = ({ initPosts, initPage }: PostListProps) => {
  const [posts, setPosts] = useState(initPosts);
  const [page, setPage] = useState(initPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initPosts.length >= 12);
  const observerRef = useRef<HTMLDivElement>(null);

  const mounted = useMounted();

  const loadPosts = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        }

        const newPosts = await getPosts(pageNum);

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
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (page > initPage) {
      loadPosts(page, true);
    }
  }, [page, initPage, loadPosts]);

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
    <div className="p-4 md:py-0">
      <Masonry gap={16}>
        {posts.map((post) => (
          <PostCard
            data-height={post.media[0].height}
            key={post.id}
            post={post}
          />
        ))}
        <div ref={observerRef} className="h-20" />

        {mounted && <PostsSkeleton />}
      </Masonry>
      {!mounted && (
        <div className="flex items-center gap-4 justify-center py-4">
          {page > 1 && (
            <Button variant={"outline"} size={"sm"} asChild>
              <Link rel="prev" href={page === 2 ? "/" : `/?page=${page - 1}`}>
                <ChevronRight />
                صفحه قبل
              </Link>
            </Button>
          )}
          {posts.length > 0 && (
            <Button variant={"outline"} size={"sm"} asChild>
              <Link rel="next" href={`/?page=${page + 1}`}>
                صفحه بعد
                <ChevronLeft />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PostList;
