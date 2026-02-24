"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const tabs = {
  strategy: {
    label: "Strategy",
    title: "Strategic UX Leadership",
    summary: "Clarify priorities, align stakeholders, and frame product decisions that ship with confidence.",
    proof: [
      "Facilitated cross-functional discovery and prioritization workshops.",
      "Translated research into decision-ready product direction.",
      "Built scalable IA and journey systems for complex ecosystems."
    ],
    meters: [
      { label: "Discovery & Framing", value: 96 },
      { label: "Stakeholder Alignment", value: 94 },
      { label: "UX Decision Quality", value: 95 }
    ]
  },
  interaction: {
    label: "Interaction",
    title: "Interaction Design Craft",
    summary: "Design behaviors that feel intentional, reduce friction, and elevate product trust.",
    proof: [
      "Designed interaction systems for enterprise and consumer-facing products.",
      "Created polished micro-behaviors with accessibility-aware patterns.",
      "Balanced visual personality with usability-first decision making."
    ],
    meters: [
      { label: "Flow Clarity", value: 95 },
      { label: "Interaction Detail", value: 97 },
      { label: "Usability Confidence", value: 94 }
    ]
  },
  delivery: {
    label: "Delivery",
    title: "Execution and Delivery Reliability",
    summary: "Bridge design and engineering with practical artifacts that protect UX quality through launch.",
    proof: [
      "Produced implementation-ready specifications and prototype logic.",
      "Supported engineering handoff with state-by-state interaction intent.",
      "Maintained quality through launch QA and iterative refinements."
    ],
    meters: [
      { label: "Handoff Clarity", value: 95 },
      { label: "Delivery Momentum", value: 93 },
      { label: "Launch Readiness", value: 96 }
    ]
  }
} as const;

type TabKey = keyof typeof tabs;

export function SkillsHistoryLab() {
  const [active, setActive] = useState<TabKey>("strategy");
  const current = tabs[active];

  return (
    <section className="section" data-home-section-wrap>
      <div className="container">
        <p className="section-kicker" data-home-section>
          Capability Cockpit
        </p>
        <h2 className="section-title" data-home-section>
          Interactive UX Capability Snapshot
        </h2>
        <p className="section-subtitle" data-home-section>
          Switch perspectives to see how strategic thinking, interaction craft, and delivery discipline work together.
        </p>

        <div className="skills-cockpit" data-home-stagger>
          <div className="skills-menu">
            {(Object.keys(tabs) as TabKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className="skills-tab"
                data-active={active === key}
                onClick={() => setActive(key)}
              >
                <span>{tabs[key].label}</span>
                <small>{tabs[key].title}</small>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              key={active}
              className="glass-card skills-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3>{current.title}</h3>
              <p>{current.summary}</p>

              <div className="skills-meter-grid">
                {current.meters.map((meter) => (
                  <div className="skills-meter" key={meter.label}>
                    <div className="skills-meter-label">
                      <span>{meter.label}</span>
                      <strong>{meter.value}%</strong>
                    </div>
                    <div className="skills-meter-track" aria-hidden="true">
                      <motion.div
                        className="skills-meter-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${meter.value}%` }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <ul className="skills-proof-list">
                {current.proof.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
