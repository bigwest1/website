"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const tabs = {
  process: {
    label: "Process Leadership",
    points: [
      "Discovery workshops that align business, product, and user priorities.",
      "Research synthesis translated into strategic product decisions.",
      "Prototype-driven validation before costly engineering effort."
    ]
  },
  craft: {
    label: "Design Craft",
    points: [
      "Interaction systems that feel intuitive and differentiated.",
      "High-fidelity workflows with clear state logic and micro-behavior intent.",
      "Visual storytelling that keeps experiences both premium and approachable."
    ]
  },
  delivery: {
    label: "Delivery Confidence",
    points: [
      "Cross-functional alignment between UX, PM, and engineering.",
      "Design-to-dev handoff with documented interaction rationale.",
      "Launch-ready experience quality with iterative post-release learning."
    ]
  }
} as const;

type TabKey = keyof typeof tabs;

export function SkillsHistoryLab() {
  const [active, setActive] = useState<TabKey>("process");

  return (
    <section className="section" data-home-section-wrap>
      <div className="container">
        <p className="section-kicker" data-home-section>
          Skills and History
        </p>
        <h2 className="section-title" data-home-section>
          Interactive UX Capability Snapshot
        </h2>
        <p className="section-subtitle" data-home-section>
          Explore how I combine strategy, interaction design, and delivery systems to create outcomes teams can trust.
        </p>

        <div className="filter-row" style={{ marginTop: "1rem" }} data-home-stagger>
          {(Object.keys(tabs) as TabKey[]).map((key) => (
            <button
              key={key}
              className="filter-chip"
              data-active={active === key}
              type="button"
              onClick={() => setActive(key)}
            >
              {tabs[key].label}
            </button>
          ))}
        </div>

        <motion.div
          key={active}
          className="glass-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          style={{ padding: "1.2rem", marginTop: "1rem" }}
          data-home-section
        >
          <h3 style={{ marginTop: 0 }}>{tabs[active].label}</h3>
          <ul>
            {tabs[active].points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
