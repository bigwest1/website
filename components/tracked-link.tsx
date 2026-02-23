"use client";

import Link, { type LinkProps } from "next/link";
import { trackPortfolioEvent } from "@/lib/analytics";
import type { PortfolioEventName } from "@/lib/types";

type TrackedLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  event: PortfolioEventName;
  eventProps?: Record<string, string | number | boolean>;
  target?: string;
  rel?: string;
};

export function TrackedLink({ children, className, event, eventProps, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      className={className}
      onClick={() => {
        trackPortfolioEvent(event, eventProps ?? {});
      }}
    >
      {children}
    </Link>
  );
}
