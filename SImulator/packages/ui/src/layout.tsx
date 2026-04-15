import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import type { RadiusToken, SpaceToken, ValidationTone } from "@course-creator-os/design-tokens";

import { cx } from "./utils";

function spaceVar(token: SpaceToken) {
  return `var(--cco-space-${token})`;
}

function radiusVar(token: RadiusToken) {
  return `var(--cco-radius-${token})`;
}

type SurfaceTone = "default" | "raised" | "contrast" | "ghost";
type SurfaceBorder = "subtle" | "default" | "accent" | "strong";

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: SpaceToken;
  tone?: SurfaceTone;
  border?: SurfaceBorder;
};

export function SurfaceCard({
  children,
  className,
  padding = 6,
  tone = "default",
  border = "default",
  style,
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={cx("cco-ui-surface", className)}
      data-tone={tone}
      data-border={border}
      style={
        {
          padding: spaceVar(padding),
          ...style
        } satisfies CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}

type StackProps = HTMLAttributes<HTMLDivElement> & {
  gap?: SpaceToken;
  align?: CSSProperties["alignItems"];
};

export function Stack({
  children,
  className,
  gap = 4,
  align,
  style,
  ...props
}: StackProps) {
  return (
    <div
      className={cx("cco-ui-stack", className)}
      style={
        {
          gap: spaceVar(gap),
          alignItems: align,
          ...style
        } satisfies CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}

type InlineProps = HTMLAttributes<HTMLDivElement> & {
  gap?: SpaceToken;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;
};

export function Inline({
  children,
  className,
  gap = 3,
  align = "center",
  justify = "flex-start",
  wrap = true,
  style,
  ...props
}: InlineProps) {
  return (
    <div
      className={cx("cco-ui-inline", className)}
      style={
        {
          gap: spaceVar(gap),
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? "wrap" : "nowrap",
          ...style
        } satisfies CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}

type SplitPaneProps = HTMLAttributes<HTMLDivElement> & {
  sidebar: ReactNode;
  sidebarPosition?: "start" | "end";
  sidebarWidth?: string;
  gap?: SpaceToken;
};

export function SplitPane({
  children,
  className,
  sidebar,
  sidebarPosition = "end",
  sidebarWidth = "320px",
  gap = 6,
  style,
  ...props
}: SplitPaneProps) {
  const columns =
    sidebarPosition === "start"
      ? `${sidebarWidth} minmax(0, 1fr)`
      : `minmax(0, 1fr) ${sidebarWidth}`;

  return (
    <div
      className={cx("cco-ui-split-pane", className)}
      style={
        {
          display: "grid",
          gridTemplateColumns: columns,
          gap: spaceVar(gap),
          alignItems: "start",
          ...style
        } satisfies CSSProperties
      }
      {...props}
    >
      {sidebarPosition === "start" ? (
        <>
          <aside>{sidebar}</aside>
          <div>{children}</div>
        </>
      ) : (
        <>
          <div>{children}</div>
          <aside>{sidebar}</aside>
        </>
      )}
    </div>
  );
}

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function SectionHeader({
  className,
  eyebrow,
  title,
  description,
  actions,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cx("cco-ui-section-header", className)} {...props}>
      <div className="cco-ui-section-header-copy">
        {eyebrow ? <p className="cco-ui-eyebrow">{eyebrow}</p> : null}
        <h3>{title}</h3>
        {description ? <p className="cco-ui-section-description">{description}</p> : null}
      </div>
      {actions ? <div className="cco-ui-section-actions">{actions}</div> : null}
    </div>
  );
}

type MetricChipProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "default" | ValidationTone | "accent";
};

export function MetricChip({
  className,
  label,
  value,
  note,
  tone = "default",
  ...props
}: MetricChipProps) {
  return (
    <div className={cx("cco-ui-metric-chip", className)} data-tone={tone} {...props}>
      <span className="cco-ui-metric-label">{label}</span>
      <strong className="cco-ui-metric-value">{value}</strong>
      {note ? <span className="cco-ui-metric-note">{note}</span> : null}
    </div>
  );
}

type EmptyStatePanelProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyStatePanel({
  className,
  eyebrow,
  title,
  description,
  action,
  ...props
}: EmptyStatePanelProps) {
  return (
    <SurfaceCard className={cx("cco-ui-empty-state", className)} padding={8} tone="contrast" {...props}>
      <Stack gap={4}>
        {eyebrow ? <p className="cco-ui-eyebrow">{eyebrow}</p> : null}
        <h3>{title}</h3>
        <p className="cco-ui-section-description">{description}</p>
        {action ? <div className="cco-ui-empty-state-action">{action}</div> : null}
      </Stack>
    </SurfaceCard>
  );
}

type ContextToolbarProps = HTMLAttributes<HTMLDivElement> & {
  padding?: SpaceToken;
  radius?: RadiusToken;
};

export function ContextToolbar({
  children,
  className,
  padding = 3,
  radius = "md",
  style,
  ...props
}: ContextToolbarProps) {
  return (
    <div
      className={cx("cco-ui-context-toolbar", className)}
      style={
        {
          padding: `${spaceVar(padding)} ${spaceVar(padding)}`,
          borderRadius: radiusVar(radius),
          ...style
        } satisfies CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
