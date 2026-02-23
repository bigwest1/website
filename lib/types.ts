export type ProjectCategory =
  | "ux"
  | "strategy"
  | "prototype"
  | "wireframe"
  | "ui"
  | "animation"
  | "motion";

export type InteractionDemoType = "ux-process-map" | "motion-breakdown";

export interface Project {
  id: number;
  slug: string;
  title: string;
  client: string;
  image: string;
  legacyUrl: string;
  tags: string[];
  category: ProjectCategory[];
  role: string;
  yearRange: string;
  tools: string[];
  summary: string;
  challenge: string;
  approach: string;
  outcome: string;
  featured: boolean;
  interactionDemo: InteractionDemoType;
}

export interface BlogPostFrontmatter {
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  heroImage?: string;
}

export interface BlogPost extends BlogPostFrontmatter {
  slug: string;
  content: string;
}

export interface BlogPostPreview extends BlogPostFrontmatter {
  slug: string;
}

export interface Testimonial {
  name: string;
  quote: string;
}

export type PortfolioEventName =
  | "hero_cta_click"
  | "resume_download"
  | "project_open"
  | "interaction_complete"
  | "blog_open"
  | "contact_submit_success"
  | "contact_submit_error";

export interface InteractionCandidate {
  name: string;
  purpose: string;
  section: string;
  brandFit: number;
  professionalism: number;
  playfulness: number;
  performance: number;
  maintainability: number;
  accessibilityFallback: number;
  decision: "approved" | "approved-with-constraints" | "rejected";
  notes: string;
}
