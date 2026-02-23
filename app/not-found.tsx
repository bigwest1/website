import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container glass-card" style={{ padding: "1.3rem" }}>
        <p className="section-kicker">404</p>
        <h1 className="section-title">This route is no longer here.</h1>
        <p className="section-subtitle">
          The site was rebuilt and modernized. Use the links below to jump into the current portfolio experience.
        </p>
        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link href="/projects" className="btn btn-ghost">
            View Projects
          </Link>
          <Link href="/blog" className="btn btn-ghost">
            Read Blog
          </Link>
        </div>
      </div>
    </section>
  );
}
