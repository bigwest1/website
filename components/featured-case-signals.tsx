"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { trackPortfolioEvent } from "@/lib/analytics";

type SignalKey = "problem" | "decisions" | "impact";

type SignalData = {
  label: string;
  headline: string;
  body: string;
  confidence: number;
};

const signalBySlug: Record<string, Record<SignalKey, SignalData>> = {
  "etfo-elementary-teachers-federation-of-ontario": {
    problem: {
      label: "Problem Space",
      headline: "High content depth and broad audience variance",
      body: "Teachers, members, and stakeholders needed the same system to support very different mental models and urgency levels.",
      confidence: 92
    },
    decisions: {
      label: "Key Decisions",
      headline: "IA reset plus clearer interaction hierarchy",
      body: "Navigation simplification and priority-based content architecture reduced search fatigue across primary journeys.",
      confidence: 95
    },
    impact: {
      label: "Impact Signal",
      headline: "Calmer, faster path-to-content",
      body: "The resulting experience improved confidence in wayfinding and gave implementation teams a durable structure to scale.",
      confidence: 94
    }
  },
  "helmsley-charitable-trust": {
    problem: {
      label: "Problem Space",
      headline: "Complex grant narratives and donor trust expectations",
      body: "The site needed to communicate institutional rigor while preserving warmth and clarity for external audiences.",
      confidence: 90
    },
    decisions: {
      label: "Key Decisions",
      headline: "Story-led hierarchy with trust-forward pathways",
      body: "Program content and contribution pathways were restructured around donor intent and comprehension checkpoints.",
      confidence: 93
    },
    impact: {
      label: "Impact Signal",
      headline: "Stronger comprehension and engagement intent",
      body: "Users could quickly understand where funds mattered most, creating more confidence in continued exploration and action.",
      confidence: 91
    }
  },
  "protiviti-imanage-design": {
    problem: {
      label: "Problem Space",
      headline: "Knowledge retrieval bottlenecks in enterprise flows",
      body: "Consulting teams were losing momentum to taxonomy friction and unclear content pathways.",
      confidence: 89
    },
    decisions: {
      label: "Key Decisions",
      headline: "Task-centric navigation and search framing",
      body: "Frequent workflows were prioritized first, with cleaner wayfinding and reduced decision branching.",
      confidence: 94
    },
    impact: {
      label: "Impact Signal",
      headline: "Faster findability for high-value artifacts",
      body: "Teams could move from discovery to action with fewer dead ends and stronger handoff confidence.",
      confidence: 92
    }
  },
  "general-mills-mobile-application": {
    problem: {
      label: "Problem Space",
      headline: "Mobile journeys overloaded with unnecessary steps",
      body: "Users needed to complete high-frequency actions quickly, often while multitasking in constrained contexts.",
      confidence: 91
    },
    decisions: {
      label: "Key Decisions",
      headline: "Flow compression and state clarity",
      body: "Interaction states were tightened and critical paths shortened to reduce taps and lower cognitive load.",
      confidence: 94
    },
    impact: {
      label: "Impact Signal",
      headline: "Higher mobile completion confidence",
      body: "The refined flow architecture supported quicker outcomes and stronger product readiness for iterative releases.",
      confidence: 93
    }
  },
  "voya-financial-retirement-experience": {
    problem: {
      label: "Problem Space",
      headline: "High-stakes decisions hidden in dense interfaces",
      body: "Retirement users needed clear guidance moments, but legacy flows made priorities hard to parse.",
      confidence: 90
    },
    decisions: {
      label: "Key Decisions",
      headline: "Progressive disclosure for planning confidence",
      body: "Content and interactions were reframed to reveal complexity in the right order and at the right time.",
      confidence: 95
    },
    impact: {
      label: "Impact Signal",
      headline: "More confident retirement planning behavior",
      body: "Users could better understand options and next steps, reducing ambiguity in core planning workflows.",
      confidence: 94
    }
  },
  "unitedhealth-group-optumrx-flowrx": {
    problem: {
      label: "Problem Space",
      headline: "Operational risk from unclear workflow states",
      body: "Clinical and operations teams needed rapid comprehension under pressure with minimal room for handoff error.",
      confidence: 92
    },
    decisions: {
      label: "Key Decisions",
      headline: "State simplification and feedback precision",
      body: "State transitions and interaction feedback were tuned to improve decision speed and reduce ambiguity at critical moments.",
      confidence: 96
    },
    impact: {
      label: "Impact Signal",
      headline: "Safer, more predictable execution flow",
      body: "The updated UX model increased operational confidence while preserving speed across high-volume work.",
      confidence: 95
    }
  }
};

const fallbackSignals: Record<SignalKey, SignalData> = {
  problem: {
    label: "Problem Space",
    headline: "Complex workflows with high cognitive load",
    body: "Users needed clearer pathways, stronger hierarchy, and more predictable interactions.",
    confidence: 90
  },
  decisions: {
    label: "Key Decisions",
    headline: "UX structure tuned for clarity and speed",
    body: "Information architecture and interaction logic were iterated through prototyping and stakeholder review.",
    confidence: 93
  },
  impact: {
    label: "Impact Signal",
    headline: "Improved trust and execution confidence",
    body: "The final direction reduced friction and created a stronger implementation-ready experience.",
    confidence: 92
  }
};

export function FeaturedCaseSignals({ slug }: { slug: string }) {
  const [active, setActive] = useState<SignalKey>("problem");
  const signals = useMemo(() => signalBySlug[slug] ?? fallbackSignals, [slug]);
  const current = signals[active];

  return (
    <section className="featured-case-signals glass-card" data-case-reveal>
      <p className="section-kicker">Featured Case Lens</p>
      <h2 className="section-title" style={{ marginBottom: "0.65rem" }}>
        Strategic Signal Explorer
      </h2>
      <p className="section-subtitle" style={{ marginTop: 0 }}>
        Explore how I framed the problem, prioritized decisions, and measured confidence in the final UX direction.
      </p>

      <div className="filter-row" style={{ marginTop: "1rem" }}>
        {(Object.keys(signals) as SignalKey[]).map((key) => (
          <button
            key={key}
            className="filter-chip"
            data-active={active === key}
            type="button"
            onClick={() => {
              setActive(key);
              trackPortfolioEvent("interaction_complete", {
                section: "featured_case_signals",
                mode: key,
                slug
              });
            }}
          >
            {signals[key].label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="featured-case-panel"
        >
          <p className="section-kicker" style={{ marginBottom: "0.5rem" }}>
            {current.label}
          </p>
          <h3 style={{ marginTop: 0 }}>{current.headline}</h3>
          <p>{current.body}</p>
          <div className="confidence-meter">
            <span>Confidence Score</span>
            <div className="confidence-track" aria-hidden="true">
              <motion.div
                className="confidence-fill"
                initial={{ width: 0 }}
                animate={{ width: `${current.confidence}%` }}
                transition={{ duration: 0.36, ease: "easeOut" }}
              />
            </div>
            <strong>{current.confidence}%</strong>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
