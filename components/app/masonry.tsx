"use client";

import useMasonry from "@/hooks/use-masonry";

const Masonry = ({ children }: { children: React.ReactNode }) => {
  const masonryContainer = useMasonry();

  return (
    <div
      ref={masonryContainer}
      className="grid items-start gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
    >
      {children}
    </div>
  );
};

export default Masonry;
