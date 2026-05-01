import { getPosts } from "@/actions/post";
import PostList from "@/components/app/home/post-list";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  let page = 1;
  if (params.page) {
    page = parseInt(
      Array.isArray(params.page) ? params.page[0] : params.page,
      10,
    );
  }
  const posts = await getPosts(page);

  return <PostList initPosts={posts} initPage={page} />;
}
