"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link className="nav-logo" href="/" aria-label="Go to home">
          <Image
            src="/images/JesseWestlundUPtop.png"
            alt="Jesse Westlund signature"
            width={180}
            height={56}
            priority
          />
          <span>UX Portfolio</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {primaryNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} className={`nav-link ${active ? "active" : ""}`} href={item.href}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
