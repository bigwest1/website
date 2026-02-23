"use client";

import { track } from "@vercel/analytics";
import type { PortfolioEventName } from "@/lib/types";

export function trackPortfolioEvent(
  name: PortfolioEventName,
  properties: Record<string, string | number | boolean> = {}
): void {
  track(name, properties);
}
