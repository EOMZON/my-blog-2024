import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPosts } from '@/lib/notion';

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Frontend Learning Blog</h1>
      {posts.length > 0 ? (
        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post.id} className="border p-4 rounded-lg">
              <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <Link href={`/posts/${post.slug}`} passHref>
                <Button>Read More</Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl mb-4">No posts available or there was an error fetching posts.</p>
          <p>Please check your console for more information.</p>
        </div>
      )}
    </div>
  );
}