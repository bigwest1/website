"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function HomePremiumMotion({ scopeId }: { scopeId: string }) {
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
      gsap.from("[data-home-hero-reveal]", {
        opacity: 0,
        y: 16,
        duration: 0.58,
        ease: "power2.out",
        stagger: 0.06
      });

      gsap.utils.toArray<HTMLElement>("[data-home-section-wrap]").forEach((element) => {
        const targets = element.querySelectorAll("[data-home-section]");

        if (!targets.length) {
          return;
        }

        gsap.from(targets, {
          opacity: 0,
          y: 24,
          duration: 0.68,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 78%"
          }
        });
      });

      const allowParallax = window.innerWidth >= 1024;

      gsap.utils.toArray<HTMLElement>("[data-home-parallax]").forEach((element, index) => {
        if (!allowParallax) {
          return;
        }

        const depth = index % 2 === 0 ? -12 : -8;

        gsap.fromTo(
          element,
          { y: 0 },
          {
            y: depth,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.45
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-home-stagger]").forEach((element) => {
        const children = Array.from(element.children);

        gsap.from(children, {
          opacity: 0,
          y: 14,
          duration: 0.52,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 82%"
          }
        });
      });
    }, scope);

    return () => {
      ctx.revert();
    };
  }, [scopeId]);

  return null;
}
