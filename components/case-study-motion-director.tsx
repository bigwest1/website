"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function CaseStudyMotionDirector({ scopeId }: { scopeId: string }) {
  useEffect(() => {
    const scope = document.getElementById(scopeId);

    if (!scope) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from("[data-case-hero-copy]", {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.04
      });

      gsap.from("[data-case-hero-media]", {
        opacity: 0,
        scale: 1.015,
        duration: 0.72,
        ease: "power2.out"
      });

      gsap.to("[data-case-hero-media]", {
        y: -8,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-case-hero]",
          start: "top top",
          end: "bottom top",
          scrub: 0.5
        }
      });

      gsap.utils.toArray<HTMLElement>("[data-case-reveal]").forEach((element) => {
        if (element.hasAttribute("data-case-hero")) {
          return;
        }

        gsap.from(element, {
          opacity: 0,
          y: 14,
          duration: 0.54,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 82%"
          }
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-case-timeline-item]").forEach((element, index) => {
        gsap.from(element, {
          opacity: 0,
          x: index % 2 === 0 ? -10 : 10,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 84%"
          }
        });
      });

      const progressBar = scope.querySelector<HTMLElement>("[data-case-progress-bar]");

      if (progressBar) {
        gsap.fromTo(
          progressBar,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.35
            }
          }
        );
      }
    }, scope);

    return () => {
      ctx.revert();
    };
  }, [scopeId]);

  return null;
}
