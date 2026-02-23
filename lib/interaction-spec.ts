import type { InteractionCandidate } from "@/lib/types";

export const interactionMatrix: InteractionCandidate[] = [
  {
    name: "Framer Motion",
    purpose: "Narrative transitions and controlled component animation",
    section: "Global",
    brandFit: 10,
    professionalism: 9,
    playfulness: 8,
    performance: 9,
    maintainability: 9,
    accessibilityFallback: 9,
    decision: "approved",
    notes: "Primary animation system for UI states and route-level storytelling"
  },
  {
    name: "GSAP + ScrollTrigger",
    purpose: "Signature hero arcs and timeline choreography",
    section: "Home, Project Detail",
    brandFit: 9,
    professionalism: 8,
    playfulness: 9,
    performance: 8,
    maintainability: 8,
    accessibilityFallback: 8,
    decision: "approved-with-constraints",
    notes: "Use only in high-value sections, never for base navigation behavior"
  },
  {
    name: "Lenis",
    purpose: "Smooth but subtle scroll behavior",
    section: "Global",
    brandFit: 8,
    professionalism: 9,
    playfulness: 7,
    performance: 8,
    maintainability: 9,
    accessibilityFallback: 9,
    decision: "approved",
    notes: "Disabled automatically for reduced-motion and low-power contexts"
  },
  {
    name: "React Three Fiber",
    purpose: "Selective experiential moments",
    section: "Hero",
    brandFit: 8,
    professionalism: 8,
    playfulness: 10,
    performance: 7,
    maintainability: 7,
    accessibilityFallback: 7,
    decision: "approved-with-constraints",
    notes: "One controlled hero canvas only; fallback to static gradient composition"
  },
  {
    name: "Generic particle rain effects",
    purpose: "Pure decoration",
    section: "Global",
    brandFit: 2,
    professionalism: 3,
    playfulness: 5,
    performance: 3,
    maintainability: 5,
    accessibilityFallback: 4,
    decision: "rejected",
    notes: "Feels template-like and distracts from UX credibility"
  }
];

export const rejectedPatterns = [
  "Unbounded autoplay animation loops that compete with content",
  "Effect-heavy transitions without clear narrative purpose",
  "Any interaction that blocks keyboard navigation or basic mobile behavior",
  "Visual gimmicks that weaken trust in professional UX expertise"
];

export const interactionLanguage = {
  tempo: "180ms, 320ms, 560ms progression",
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  depth: "layered shadows + parallax-lite only where meaningfully tied to content",
  cursorBehavior: "magnetic micro-interactions reserved for cards and CTAs",
  hoverIntent: "150ms delay for premium feel and reduced jitter"
};
