import type { Metadata } from "next";
import Image from "next/image";
import { getAllBlogPosts } from "@/lib/blog";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Blog | Jesse Westlund",
  description:
    "UX design articles from Jesse Westlund on strategy, AI-enhanced workflows, interaction quality, and product delivery.",
  alternates: {
    canonical: "/blog"
  }
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <section className="section">
      <div className="container">
        <p className="section-kicker">UX Writing</p>
        <h1 className="section-title">Ideas, Patterns, and Practical UX Strategy</h1>
        <p className="section-subtitle">
          Insights on user experience design, collaboration, automation, accessibility, and modern design systems.
        </p>

        <div className="blog-grid" style={{ marginTop: "1.2rem" }}>
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              <div style={{ position: "relative" }}>
                <Image
                  src={post.heroImage ?? "/images/blog/1.jpg"}
                  alt={post.title}
                  fill
                  sizes="(max-width: 1040px) 100vw, 33vw"
                  style={{ objectFit: "cover", objectPosition: "50% 28%" }}
                />
              </div>
              <div className="blog-card-content">
                <div className="article-meta">
                  <span>{post.publishedAt}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 style={{ marginBottom: "0.5rem", fontSize: "1.2rem" }}>
                  <TrackedLink href={`/blog/${post.slug}`} event="blog_open" eventProps={{ slug: post.slug }}>
                    {post.title}
                  </TrackedLink>
                </h2>
                <p style={{ color: "var(--ink-700)" }}>{post.excerpt}</p>
                <TrackedLink className="btn btn-ghost" href={`/blog/${post.slug}`} event="blog_open" eventProps={{ slug: post.slug }}>
                  Read Article
                </TrackedLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
