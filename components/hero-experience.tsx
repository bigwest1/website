"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { trackPortfolioEvent } from "@/lib/analytics";

const ThreeConstellation = dynamic(
  () => import("@/components/three-constellation").then((mod) => mod.ThreeConstellation),
  { ssr: false }
);

type ExperienceMode = "strategy" | "interaction" | "delivery";

const modeMap: Record<
  ExperienceMode,
  {
    label: string;
    headline: string;
    body: string;
    panelTitle: string;
    panelSubtitle: string;
  }
> = {
  strategy: {
    label: "UX Strategy",
    headline: "Design direction that aligns product goals with user reality.",
    body: "I lead discovery-to-decision UX work that turns complexity into confidence for stakeholders and teams.",
    panelTitle: "Strategic UX Thinking",
    panelSubtitle: "Research, synthesis, and decision frameworks that move products forward."
  },
  interaction: {
    label: "Interaction Craft",
    headline: "Interfaces people understand quickly and actually enjoy using.",
    body: "I design interaction systems that feel intuitive, human, and memorable without sacrificing clarity.",
    panelTitle: "Interaction Systems",
    panelSubtitle: "From micro-behaviors to end-to-end flows, every detail earns its place."
  },
  delivery: {
    label: "Execution",
    headline: "From concept to production-ready UX, with momentum intact.",
    body: "I bridge design, product, and engineering so ideas ship with quality, speed, and measurable impact.",
    panelTitle: "Design-to-Delivery",
    panelSubtitle: "Cross-functional collaboration, implementation support, and launch-ready UX artifacts."
  }
};

export function HeroExperience() {
  const [mode, setMode] = useState<ExperienceMode>("strategy");
  const current = useMemo(() => modeMap[mode], [mode]);

  return (
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="container hero-grid">
        <div>
          <p className="section-kicker" data-home-hero-reveal>
            Jesse Westlund
          </p>
          <h1 className="hero-title" data-home-hero-reveal>
            UX Portfolio Built to Stand Out and Ship Real Value.
          </h1>

          <div className="mode-switch" role="tablist" aria-label="Choose focus" data-home-hero-reveal>
            {(Object.keys(modeMap) as ExperienceMode[]).map((key) => (
              <button
                key={key}
                className="mode-pill"
                data-active={mode === key}
                onClick={() => {
                  setMode(key);
                  trackPortfolioEvent("interaction_complete", { section: "hero", mode: key });
                }}
                type="button"
              >
                {modeMap[key].label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              data-home-hero-reveal
            >
              <h2 style={{ marginBottom: "0.7rem" }}>{current.headline}</h2>
              <p className="hero-subtitle">{current.body}</p>
            </motion.div>
          </AnimatePresence>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", marginTop: "1.1rem" }} data-home-hero-reveal>
            <Link
              href="/projects"
              className="btn btn-primary"
              onClick={() => trackPortfolioEvent("hero_cta_click", { target: "projects" })}
            >
              Explore Projects
            </Link>
            <Link
              href="/contact"
              className="btn btn-ghost"
              onClick={() => trackPortfolioEvent("hero_cta_click", { target: "contact" })}
            >
              Hire Jesse
            </Link>
            <Link
              href="/Jesse_Westlund_UX_Designer_Resume.pdf"
              className="btn btn-ghost"
              onClick={() => trackPortfolioEvent("resume_download", { format: "pdf" })}
            >
              Download Resume
            </Link>
          </div>

          <div className="hero-metric-grid" data-home-hero-reveal data-home-parallax>
            <div className="hero-metric">
              <strong>18+</strong>
              <span>Years shaping digital experiences</span>
            </div>
            <div className="hero-metric">
              <strong>46</strong>
              <span>Documented portfolio projects</span>
            </div>
            <div className="hero-metric">
              <strong>End-to-End</strong>
              <span>Research, design, prototyping, delivery</span>
            </div>
          </div>
        </div>

        <div className="hero-panel" data-home-hero-reveal data-home-parallax>
          <div className="hero-panel-content">
            <span className="badge">Signature Interaction Surface</span>
            <h3 style={{ marginTop: "0.8rem" }}>{current.panelTitle}</h3>
            <p>{current.panelSubtitle}</p>
          </div>
          <ThreeConstellation />
        </div>
      </div>
    </section>
  );
}
