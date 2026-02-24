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
        y: 22,
        duration: 0.72,
        ease: "power3.out",
        stagger: 0.08
      });

      gsap.utils.toArray<HTMLElement>("[data-home-section-wrap]").forEach((element) => {
        const targets = element.querySelectorAll("[data-home-section]");

        if (!targets.length) {
          return;
        }

        gsap.from(targets, {
          opacity: 0,
          y: 30,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 80%"
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
          y: 18,
          duration: 0.62,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 82%"
          }
        });
      });

      gsap.utils.toArray<HTMLElement>(".project-card").forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 20,
          scale: 0.98,
          duration: 0.65,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%"
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
