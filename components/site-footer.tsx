import Link from "next/link";
import { siteConfig, resourceLinks } from "@/lib/site";
import { TrackedLink } from "@/components/tracked-link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <p className="section-kicker">Built for Hiring Confidence</p>
          <h2 className="section-title">Ready to Build Something Better Together?</h2>
          <p className="section-subtitle">
            I design experiences that are strategic, usable, and memorable. If you want UX leadership that can
            bridge research, execution, and delivery, I would love to connect.
          </p>
        </div>

        <div className="glass-card" style={{ padding: "1.2rem" }}>
          <p style={{ marginTop: 0, fontWeight: 700 }}>Connect</p>
          <p style={{ margin: "0.4rem 0" }}>
            <Link href={`mailto:${siteConfig.email}`}>{siteConfig.email}</Link>
          </p>
          <p style={{ margin: "0.4rem 0" }}>
            <Link href="https://www.linkedin.com/in/jessewestlund/" target="_blank" rel="noreferrer">
              LinkedIn Profile
            </Link>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.9rem" }}>
            {resourceLinks.map((resource) => (
              <TrackedLink
                key={resource.href}
                className="btn btn-ghost"
                href={resource.href}
                event="resume_download"
                eventProps={{ format: resource.href.endsWith(".pdf") ? "pdf" : "docx", location: "footer" }}
              >
                {resource.label}
              </TrackedLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
