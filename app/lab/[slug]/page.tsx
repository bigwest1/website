import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const descriptions: Record<string, string> = {
  animation: "Focuses on motion storytelling and sequence timing patterns.",
  boxed: "Explores constrained layout style systems and card-heavy visual density.",
  image: "Image-forward visual hierarchy and foreground emphasis tests.",
  parallax: "Depth-based scroll interactions for narrative pacing.",
  particles: "Atmospheric visual effects experiments for hero environments.",
  ripple: "Wave and fluid-inspired interaction motifs.",
  routed: "Template-era route and section composition experiments.",
  slider: "Carousel and progressive disclosure interaction variants.",
  typed: "Kinetic typography and message sequencing states."
};

export function generateStaticParams() {
  return Object.keys(descriptions).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  if (!descriptions[params.slug]) {
    return { title: "Lab Route Not Found" };
  }

  return {
    title: `Lab: ${params.slug} | Jesse Westlund`,
    description: descriptions[params.slug],
    alternates: { canonical: `/lab/${params.slug}` }
  };
}

export default function LabRoutePage({ params }: { params: { slug: string } }) {
  const description = descriptions[params.slug];

  if (!description) {
    notFound();
  }

  return (
    <section className="section">
      <div className="container glass-card" style={{ padding: "1.3rem" }}>
        <p className="section-kicker">Lab Route</p>
        <h1 className="section-title" style={{ textTransform: "capitalize" }}>
          {params.slug}
        </h1>
        <p className="section-subtitle">{description}</p>
        <p>
          This route documents design experimentation lineage while the primary portfolio maintains a cohesive,
          conversion-focused brand experience.
        </p>
        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/lab">
            Back to Lab Index
          </Link>
          <Link className="btn btn-ghost" href="/projects">
            Return to Projects
          </Link>
        </div>
      </div>
    </section>
  );
}
