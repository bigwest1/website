import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { BeforeAfter } from "@/components/before-after";
import { CaseStudyMotionDirector } from "@/components/case-study-motion-director";
import { FeaturedCaseSignals } from "@/components/featured-case-signals";
import { projects, getProjectBySlug } from "@/lib/projects";
import { getProjectNarrativeBySlug } from "@/lib/project-content";

type ProjectPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export function generateMetadata({ params }: ProjectPageProps): Metadata {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    return {
      title: "Project Not Found | Jesse Westlund"
    };
  }

  return {
    title: `${project.title} | Jesse Westlund Projects`,
    description: project.summary,
    alternates: {
      canonical: `/projects/${project.slug}`
    },
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [{ url: project.image }]
    }
  };
}

function getComparisonImage(projectId: number): string {
  const beforeId = Math.max(1, projectId - 1);
  return `/images/portfolio/${beforeId}.jpg`;
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  const nextProject = projects[(project.id % projects.length)];
  const projectNarrative = getProjectNarrativeBySlug(project.slug);
  const casePageId = `case-${project.slug}`;

  return (
    <section className="section case-page" id={casePageId}>
      <CaseStudyMotionDirector scopeId={casePageId} />
      <div className="case-progress">
        <div className="case-progress-bar" data-case-progress-bar />
      </div>
      <div className="container" style={{ display: "grid", gap: "1.3rem" }}>
        <div className="glass-card case-hero-card" style={{ overflow: "hidden" }} data-case-hero data-case-reveal>
          <div className="case-hero-media" data-case-hero-media>
            <Image src={project.image} alt={project.title} fill sizes="100vw" priority />
          </div>
          <div className="case-hero-copy" data-case-hero-copy>
            <p className="section-kicker">{project.role}</p>
            <h1 className="section-title">{project.title}</h1>
            <p className="section-subtitle">{project.summary}</p>

            <div className="project-tag-list" style={{ marginTop: "0.8rem" }}>
              {project.tags.map((tag) => (
                <span key={tag} className="project-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {project.featured ? <FeaturedCaseSignals slug={project.slug} /> : null}

        <div className="card-grid case-core-cards" data-case-reveal>
          <article className="feature-card">
            <p className="section-kicker">Challenge</p>
            <p>{project.challenge}</p>
          </article>
          <article className="feature-card">
            <p className="section-kicker">Approach</p>
            <p>{project.approach}</p>
          </article>
          <article className="feature-card">
            <p className="section-kicker">Outcome</p>
            <p>{project.outcome}</p>
          </article>
        </div>

        <section data-case-reveal>
          <p className="section-kicker">Interactive Example</p>
          <h2 className="section-title">Before/After Experience Comparison</h2>
          <p className="section-subtitle">
            Slide to compare this project against a prior-state visual reference. This module demonstrates how Jesse
            presents UX impact in a narrative format stakeholders can absorb quickly.
          </p>
          <BeforeAfter before={getComparisonImage(project.id)} after={project.image} />
        </section>

        {projectNarrative ? (
          <section className="glass-card" style={{ padding: "1.2rem" }} data-case-reveal>
            <p className="section-kicker">Extended Narrative</p>
            <MDXRemote source={projectNarrative} />
          </section>
        ) : null}

        <section data-case-reveal>
          <p className="section-kicker">Execution Timeline</p>
          <h2 className="section-title">Design Delivery Story</h2>
          <div className="timeline" style={{ marginTop: "1rem" }}>
            <article className="timeline-item" data-case-timeline-item>
              <h3 style={{ marginTop: 0 }}>1. Align</h3>
              <p>Clarify goals, stakeholder constraints, and user priorities through focused workshops.</p>
            </article>
            <article className="timeline-item" data-case-timeline-item>
              <h3 style={{ marginTop: 0 }}>2. Model</h3>
              <p>Create journey flows, wireframes, and information structure that reduce decision friction.</p>
            </article>
            <article className="timeline-item" data-case-timeline-item>
              <h3 style={{ marginTop: 0 }}>3. Validate</h3>
              <p>Iterate prototypes with feedback loops to improve usability and confidence before build.</p>
            </article>
            <article className="timeline-item" data-case-timeline-item>
              <h3 style={{ marginTop: 0 }}>4. Ship</h3>
              <p>Support implementation and QA so the final experience preserves intent and quality.</p>
            </article>
          </div>
        </section>

        <div className="glass-card case-next" style={{ padding: "1.1rem", display: "grid", gap: "0.6rem" }} data-case-reveal>
          <p className="section-kicker">Next Case Story</p>
          <h3 style={{ margin: 0 }}>{nextProject.title}</h3>
          <p style={{ margin: 0, color: "var(--ink-700)" }}>{nextProject.summary}</p>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href={`/projects/${nextProject.slug}`}>
              View Next Project
            </Link>
            <Link className="btn btn-ghost" href="/contact">
              Discuss a Similar UX Challenge
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
