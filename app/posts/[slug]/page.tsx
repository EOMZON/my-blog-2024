import { getPostBySlug } from '@/lib/notion';
import { MDXRemote } from 'next-mdx-remote/rsc';

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Post not found</h1>
        <p>The requested post could not be found or there was an error fetching it from Notion.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <div className="prose lg:prose-xl">
        <MDXRemote source={post.content} />
      </div>
    </div>
  );
}