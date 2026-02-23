import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Jesse Westlund",
  description: "Get in touch with Jesse Westlund for UX design leadership, consulting, or full project collaboration.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container contact-grid" style={{ alignItems: "start" }}>
        <div className="glass-card" style={{ padding: "1.2rem" }}>
          <p className="section-kicker">Let’s Connect</p>
          <h1 className="section-title">Hire Jesse for UX Work That Moves Products Forward</h1>
          <p className="section-subtitle">
            Whether you need UX strategy, design system direction, interaction design, or delivery support, I can help
            your team ship with more clarity and confidence.
          </p>
          <p>
            <strong>Email:</strong> <Link href={`mailto:${siteConfig.email}`}>{siteConfig.email}</Link>
          </p>
          <p>
            <strong>Phone:</strong> <Link href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</Link>
          </p>
          <p>
            <strong>Location:</strong> {siteConfig.location}
          </p>
          <p>
            <strong>LinkedIn:</strong>{" "}
            <Link href={siteConfig.linkedin} target="_blank" rel="noreferrer">
              Connect directly
            </Link>
          </p>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
