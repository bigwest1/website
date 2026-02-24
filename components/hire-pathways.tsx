"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { trackPortfolioEvent } from "@/lib/analytics";

type PathKey = "recruiter" | "product" | "freelance";

const pathways: Record<
  PathKey,
  {
    label: string;
    headline: string;
    body: string;
    bullets: string[];
    ctaLabel: string;
    ctaHref: string;
  }
> = {
  recruiter: {
    label: "Recruiter View",
    headline: "Need a senior UX designer who can lead and deliver?",
    body: "This path highlights strategic leadership, cross-functional execution, and portfolio outcomes that are easy to evaluate quickly.",
    bullets: [
      "18+ years across enterprise, healthcare, education, and product ecosystems.",
      "End-to-end UX ownership from discovery through implementation support.",
      "Clear case narratives showing challenge, approach, and measurable outcomes."
    ],
    ctaLabel: "Review Signature Case Studies",
    ctaHref: "/projects"
  },
  product: {
    label: "Product Team View",
    headline: "Looking for a UX partner who can unblock delivery?",
    body: "This path focuses on how Jesse aligns PM, engineering, and design while preserving quality under real product constraints.",
    bullets: [
      "Decision-ready prototypes that reduce delivery ambiguity.",
      "Interaction systems designed for scalability and handoff clarity.",
      "Practical collaboration style that keeps teams moving with confidence."
    ],
    ctaLabel: "See Delivery-Focused Work",
    ctaHref: "/projects"
  },
  freelance: {
    label: "Client View",
    headline: "Want your product experience to feel premium and perform?",
    body: "This path spotlights consultative UX work built to elevate trust, improve usability, and move your business goals forward.",
    bullets: [
      "UX strategy grounded in your audience and market context.",
      "Creative interaction direction that stands out without sacrificing clarity.",
      "A reliable design partner from kickoff through launch."
    ],
    ctaLabel: "Start a Project Conversation",
    ctaHref: "/contact"
  }
};

export function HirePathways() {
  const [active, setActive] = useState<PathKey>("recruiter");
  const current = pathways[active];

  return (
    <section className="section pathway-section" data-home-section-wrap>
      <div className="container">
        <div className="glass-card pathway-shell" data-home-section>
          <div>
            <p className="section-kicker">Choose Your Path</p>
            <h2 className="section-title">A Portfolio Experience Tailored to Who Is Hiring</h2>
            <p className="section-subtitle">
              Select the lens that matches your hiring context to quickly evaluate fit, strengths, and outcomes.
            </p>
          </div>

          <div className="pathway-tabs" role="tablist" aria-label="Select hiring lens" data-home-stagger>
            {(Object.keys(pathways) as PathKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className="pathway-tab"
                data-active={active === key}
                onClick={() => {
                  setActive(key);
                  trackPortfolioEvent("interaction_complete", { section: "hire_pathways", mode: key });
                }}
              >
                {pathways[key].label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              key={active}
              className="pathway-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3>{current.headline}</h3>
              <p>{current.body}</p>
              <ul className="pathway-list">
                {current.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="pathway-actions">
                <Link
                  className="btn btn-primary"
                  href={current.ctaHref}
                  onClick={() => trackPortfolioEvent("hero_cta_click", { target: `pathway_${active}` })}
                >
                  {current.ctaLabel}
                </Link>
                <Link className="btn btn-ghost" href="/contact">
                  Talk with Jesse
                </Link>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
