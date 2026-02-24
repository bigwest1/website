import { type CSSProperties } from "react";
import type { Testimonial } from "@/lib/types";

export function TestimonialGrid({ testimonials }: { testimonials: Testimonial[] }) {
  const tilts = [-0.7, 0.45, -0.35, 0.32, -0.42, 0.55];

  return (
    <section className="section" data-home-section-wrap>
      <div className="container">
        <p className="section-kicker" data-home-section>
          Social Proof
        </p>
        <h2 className="section-title" data-home-section>
          What Teams Say About Working with Jesse
        </h2>
        <p className="section-subtitle" data-home-section>
          Trusted by leaders and collaborators for balancing creative craft with product outcomes.
        </p>

        <div className="quote-row" style={{ marginTop: "1.2rem" }} data-home-stagger>
          {testimonials.slice(0, 6).map((item, index) => (
            <article
              className="quote-card"
              key={item.name}
              style={{ "--quote-tilt": `${tilts[index % tilts.length]}deg` } as CSSProperties}
            >
              <span className="quote-mark" aria-hidden="true">
                &ldquo;
              </span>
              <p>“{item.quote}”</p>
              <strong>{item.name}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
