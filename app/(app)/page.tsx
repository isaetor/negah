import { getPosts } from "@/actions/post";
import MasonryGallery from "@/components/app/masonry-gallery";

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto px-4 space-y-4 pt-4">
      <MasonryGallery posts={posts} />
    </div>
  );
}
