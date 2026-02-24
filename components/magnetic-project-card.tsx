"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useState, type CSSProperties } from "react";
import type { Project } from "@/lib/types";
import { trackPortfolioEvent } from "@/lib/analytics";

export function MagneticProjectCard({ project }: { project: Project }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(y, { stiffness: 120, damping: 20, mass: 0.55 });
  const rotateY = useSpring(x, { stiffness: 120, damping: 20, mass: 0.55 });
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const offsetX = ((localX - rect.width / 2) / rect.width) * 6;
    const offsetY = ((localY - rect.height / 2) / rect.height) * -6;

    x.set(offsetX);
    y.set(offsetY);
    setPointer({
      x: (localX / rect.width) * 100,
      y: (localY / rect.height) * 100
    });
  };

  const resetTilt = () => {
    x.set(0);
    y.set(0);
    setPointer({ x: 50, y: 50 });
  };

  return (
    <motion.article
      className="project-card"
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(67, 210, 202, 0.2), transparent 38%), #fff`
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMove}
      onMouseLeave={resetTilt}
    >
      <div className="project-card-media">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 1040px) 100vw, 33vw"
          style={{ objectFit: "cover", objectPosition: "50% 28%" }}
        />
        <div className="project-card-sheen" aria-hidden="true" />
        <div className="project-card-meta" aria-hidden="true">
          <span>{project.client}</span>
          <span>{project.yearRange}</span>
        </div>
      </div>
      <div className="project-card-content">
        <p className="section-kicker" style={{ marginBottom: "0.35rem" }}>
          {project.role}
        </p>
        <h3 style={{ margin: 0, fontSize: "1.08rem" }}>{project.title}</h3>
        <p style={{ color: "var(--ink-700)", marginBottom: "0.7rem" }}>{project.summary}</p>

        <div className="project-tag-list">
          {project.category.slice(0, 3).map((tag) => (
            <span key={tag} className="project-tag">
              {tag}
            </span>
          ))}
        </div>

        <Link
          className="btn btn-ghost"
          style={{ marginTop: "0.9rem" } as CSSProperties}
          href={`/projects/${project.slug}`}
          onClick={() => trackPortfolioEvent("project_open", { slug: project.slug })}
        >
          View Case Story →
        </Link>
      </div>
    </motion.article>
  );
}
