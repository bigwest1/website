"use client";

import Image from "next/image";
import { useId, useState } from "react";

export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [split, setSplit] = useState(55);
  const sliderId = useId();

  return (
    <div className="glass-card before-after" style={{ padding: "1rem" }}>
      <div
        className="before-after-frame"
        style={{
          position: "relative",
          borderRadius: "18px",
          overflow: "hidden",
          aspectRatio: "16 / 9",
          border: "1px solid rgba(31, 59, 89, 0.14)"
        }}
      >
        <Image
          src={before}
          alt="Before design state"
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${split}%`,
            overflow: "hidden",
            borderRight: "3px solid rgba(255,255,255,0.85)"
          }}
        >
          <Image src={after} alt="After design state" fill sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
        <div className="before-after-handle" style={{ left: `${split}%` }} aria-hidden="true">
          <span />
        </div>
        <span className="before-after-label before-after-label-left">Before</span>
        <span className="before-after-label before-after-label-right">After</span>
      </div>

      <label htmlFor={sliderId} style={{ display: "block", marginTop: "0.8rem", fontWeight: 700 }}>
        Compare before and after
      </label>
      <input
        id={sliderId}
        type="range"
        min={10}
        max={90}
        value={split}
        onChange={(event) => setSplit(Number(event.currentTarget.value))}
        style={{ width: "100%" }}
        className="before-after-slider"
      />
    </div>
  );
}
