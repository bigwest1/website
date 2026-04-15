import { Badge } from "@course-creator-os/ui";

type StatusPillTone = "default" | "success" | "warning" | "danger" | "info";

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
};

export function StatusPill({ label, tone = "default" }: StatusPillProps) {
  return <Badge tone={tone === "danger" ? "error" : tone}>{label}</Badge>;
}
