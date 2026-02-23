import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lab | Jesse Westlund",
  description: "Interaction experiments and legacy creative exploration patterns from Jesse Westlund.",
  alternates: { canonical: "/lab" }
};

const labs = [
  "animation",
  "boxed",
  "image",
  "parallax",
  "particles",
  "ripple",
  "routed",
  "slider",
  "typed"
];

export default function LabPage() {
  return (
    <section className="section">
      <div className="container">
        <p className="section-kicker">Creative Lab</p>
        <h1 className="section-title">Archived Exploration Modes</h1>
        <p className="section-subtitle">
          These routes preserve legacy experimentation history while the main portfolio stays focused and modern.
        </p>

        <div className="card-grid" style={{ marginTop: "1rem" }}>
          {labs.map((entry) => (
            <article key={entry} className="feature-card">
              <h2 style={{ marginTop: 0, textTransform: "capitalize" }}>{entry}</h2>
              <p>
                Legacy reference mode for <strong>{entry}</strong> interactions and styling experiments.
              </p>
              <Link className="btn btn-ghost" href={`/lab/${entry}`}>
                Open Lab Route
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
