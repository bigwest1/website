import Link from "next/link";
import { HeroExperience } from "@/components/hero-experience";
import { ProjectExplorer } from "@/components/project-explorer";
import { SkillsHistoryLab } from "@/components/skills-history-lab";
import { TestimonialGrid } from "@/components/testimonial-grid";
import { HomePremiumMotion } from "@/components/home-premium-motion";
import { featuredProjects, projects } from "@/lib/projects";
import { testimonials } from "@/lib/testimonials";

export default function HomePage() {
  return (
    <div id="home-page-shell">
      <HomePremiumMotion scopeId="home-page-shell" />
      <HeroExperience />

      <section className="section" data-home-section-wrap>
        <div className="container card-grid">
          <article className="feature-card" data-home-section>
            <p className="section-kicker">Why It Feels Different</p>
            <h3>Playful, but never random.</h3>
            <p>
              Every interaction is designed to reinforce clarity, confidence, and craft. Fun is part of the brand,
              but professionalism stays intact.
            </p>
          </article>
          <article className="feature-card" data-home-section>
            <p className="section-kicker">What You See</p>
            <h3>Proof, not buzzwords.</h3>
            <p>
              This portfolio demonstrates strategy, process, interaction detail, and delivery execution across sectors
              and product contexts.
            </p>
          </article>
          <article className="feature-card" data-home-section>
            <p className="section-kicker">Why Teams Hire Jesse</p>
            <h3>Creative + structured UX leadership.</h3>
            <p>
              From discovery to launch, Jesse brings rigor, momentum, and design quality that helps teams ship with
              conviction.
            </p>
          </article>
        </div>
      </section>

      <ProjectExplorer
        projects={featuredProjects.length ? featuredProjects : projects.slice(0, 9)}
        heading="Featured Work with Strategic and Interaction Depth"
        subheading="A curated look at case stories that show how Jesse translates complexity into product experiences users trust."
      />

      <SkillsHistoryLab />

      <TestimonialGrid testimonials={testimonials} />

      <section className="section" data-home-parallax>
        <div className="container glass-card" style={{ padding: "1.3rem", display: "grid", gap: "0.7rem" }} data-home-stagger>
          <p className="section-kicker">Keep Exploring</p>
          <h2 className="section-title">See the Full Portfolio and UX Writing</h2>
          <p className="section-subtitle">
            Dive into all 46 projects, detailed case narratives, and blog perspectives on UX strategy, AI workflows,
            and design delivery.
          </p>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/projects">
              View All Projects
            </Link>
            <Link className="btn btn-ghost" href="/blog">
              Read UX Articles
            </Link>
            <Link className="btn btn-ghost" href="/contact">
              Start a Conversation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
