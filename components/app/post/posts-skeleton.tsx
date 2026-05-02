"use client";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateRandomArray } from "@/lib/utils";

const PostsSkeleton = () => {
  const randomHeights = useMemo(
    () =>
      generateRandomArray(20, 200, 500).map((height, i) => ({
        id: `skeleton-${i}-${height}`,
        height,
      })),
    [],
  );

  return randomHeights.map(({ id, height }) => (
    <Skeleton
      key={id}
      className="rounded-3xl"
      style={{ height }}
      data-span="1"
    />
  ));
};

export default PostsSkeleton;
