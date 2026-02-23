import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Jesse Westlund",
  description:
    "Career timeline, design philosophy, and capability profile for Jesse Westlund, UX Designer and Consultant.",
  alternates: { canonical: "/about" }
};

const timeline = [
  {
    years: "2014 - Present",
    role: "Senior UX Designer",
    org: "Protiviti",
    summary: "Led end-to-end UX initiatives across enterprise products, translating business complexity into usable digital systems."
  },
  {
    years: "2012 - 2014",
    role: "Senior UX Designer",
    org: "RBA",
    summary: "Delivered cross-platform UX solutions and supported client teams through design strategy and rapid prototyping."
  },
  {
    years: "2010 - 2012",
    role: "User Experience Designer",
    org: "Magenic",
    summary: "Facilitated requirements workshops and produced prototype-driven design outcomes for large client engagements."
  },
  {
    years: "2006 - 2010",
    role: "New Media and Creative Leadership Roles",
    org: "UHG + Portolanos",
    summary: "Built a foundation in visual storytelling, interaction craft, and high-energy multidisciplinary production."
  }
];

export default function AboutPage() {
  return (
    <section className="section">
      <div className="container" style={{ display: "grid", gap: "1.2rem" }}>
        <div>
          <p className="section-kicker">About Jesse</p>
          <h1 className="section-title">Creative UX Leadership with Delivery Depth</h1>
          <p className="section-subtitle">
            I design user experiences that balance strategic thinking, interaction clarity, and practical implementation.
            My approach is collaborative, outcome-driven, and built for real-world product momentum.
          </p>
        </div>

        <div className="timeline">
          {timeline.map((entry) => (
            <article key={entry.years} className="timeline-item">
              <p className="section-kicker" style={{ marginBottom: "0.35rem" }}>
                {entry.years}
              </p>
              <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>{entry.role}</h2>
              <p style={{ marginTop: 0, fontWeight: 700 }}>{entry.org}</p>
              <p style={{ marginBottom: 0 }}>{entry.summary}</p>
            </article>
          ))}
        </div>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <p className="section-kicker">Personal Brand Traits</p>
          <div className="project-tag-list">
            <span className="project-tag">Strategic</span>
            <span className="project-tag">Playful</span>
            <span className="project-tag">Collaborative</span>
            <span className="project-tag">Execution-Focused</span>
            <span className="project-tag">User-Centered</span>
            <span className="project-tag">Technology-Forward</span>
          </div>
          <div style={{ display: "flex", gap: "0.7rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/projects">
              Explore Project Archive
            </Link>
            <Link className="btn btn-ghost" href="/about/photos">
              View Photos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
