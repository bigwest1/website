import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { BlogPost, BlogPostPreview } from "@/lib/types";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function getBlogFileNames(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .sort();
}

export function getAllBlogPosts(): BlogPostPreview[] {
  return getBlogFileNames()
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(BLOG_DIR, fileName);
      const source = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(source);

      return {
        slug,
        title: String(data.title ?? slug),
        excerpt: String(data.excerpt ?? ""),
        publishedAt: String(data.publishedAt ?? "2025-01-01"),
        readTime: String(data.readTime ?? "5 min"),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        heroImage: data.heroImage ? String(data.heroImage) : undefined
      };
    })
    .sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1));
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  const fullPath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    return undefined;
  }

  const source = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(source);

  return {
    slug,
    content,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ""),
    publishedAt: String(data.publishedAt ?? "2025-01-01"),
    readTime: String(data.readTime ?? "5 min"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    heroImage: data.heroImage ? String(data.heroImage) : undefined
  };
}
