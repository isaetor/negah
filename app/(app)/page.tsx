import { getPosts } from "@/actions/post";
import Masonry from "@/components/app/masonry";
import PostCard from "@/components/app/post-card";

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="p-4 md:py-0">
      <Masonry>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </Masonry>
    </div>
  );
}
