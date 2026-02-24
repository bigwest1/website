import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return { title: "Post Not Found | Jesse Westlund" };
  }

  return {
    title: `${post.title} | Jesse Westlund Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.heroImage ? [{ url: post.heroImage }] : undefined
    }
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="section">
      <div className="container article-shell">
        <article className="glass-card" style={{ padding: "1.2rem" }}>
          {post.heroImage ? (
            <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: "18px", overflow: "hidden" }}>
              <Image
                src={post.heroImage}
                alt={post.title}
                fill
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "50% 30%" }}
                priority
              />
            </div>
          ) : null}

          <div className="article-meta" style={{ marginTop: "0.9rem" }}>
            <span>{post.publishedAt}</span>
            <span>•</span>
            <span>{post.readTime}</span>
            {post.tags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>

          <header style={{ marginTop: "1rem", display: "grid", gap: "0.55rem" }}>
            <p className="section-kicker" style={{ margin: 0 }}>
              UX Perspective
            </p>
            <h1 className="mdx-h1" style={{ margin: 0 }}>
              {post.title}
            </h1>
            <p className="section-subtitle" style={{ margin: 0 }}>
              {post.excerpt}
            </p>
          </header>

          <MDXRemote source={post.content} />
        </article>
      </div>
    </section>
  );
}
