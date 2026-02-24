import Link from "next/link";
import { HeroExperience } from "@/components/hero-experience";
import { ProjectExplorer } from "@/components/project-explorer";
import { SkillsHistoryLab } from "@/components/skills-history-lab";
import { TestimonialGrid } from "@/components/testimonial-grid";
import { HomePremiumMotion } from "@/components/home-premium-motion";
import { HirePathways } from "@/components/hire-pathways";
import { featuredProjects, projects } from "@/lib/projects";
import { testimonials } from "@/lib/testimonials";

export default function HomePage() {
  return (
    <div id="home-page-shell">
      <HomePremiumMotion scopeId="home-page-shell" />
      <HeroExperience />
      <HirePathways />

      <section className="section" data-home-section-wrap>
        <div className="container card-grid">
          <article className="feature-card" data-home-section>
            <p className="section-kicker">What You Get</p>
            <h3>Strategic clarity from day one.</h3>
            <p>
              Discovery, prioritization, and interaction direction are structured so teams can make confident product
              decisions fast.
            </p>
          </article>
          <article className="feature-card" data-home-section>
            <p className="section-kicker">How Work Ships</p>
            <h3>Creative UX with implementation rigor.</h3>
            <p>
              Every case story connects design intent to delivery realities, helping product and engineering teams stay
              aligned.
            </p>
          </article>
          <article className="feature-card" data-home-section>
            <p className="section-kicker">Why Teams Return</p>
            <h3>A partner mindset, not just design output.</h3>
            <p>
              Jesse brings momentum, candor, and craft, so stakeholders feel supported and users get a noticeably better
              experience.
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
