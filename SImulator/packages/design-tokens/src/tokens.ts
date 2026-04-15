const primitiveColors = {
  navy950: "#030813",
  navy925: "#06101c",
  navy900: "#071423",
  navy850: "#0a172b",
  navy800: "#0f1f39",
  navy750: "#122848",
  navy700: "#16305b",
  navy650: "#1e3d74",
  steel500: "#476789",
  steel400: "#6f8fb7",
  steel300: "#95aecf",
  steel200: "#bfd0e6",
  mist100: "#edf4ff",
  azure500: "#238cff",
  azure400: "#4da3ff",
  azure300: "#75b9ff",
  cyan300: "#79d0ff",
  mint400: "#3dd9b8",
  gold400: "#f4c35d",
  coral400: "#ff7a6e"
} as const;

const typography = {
  family: {
    base: "\"Sora\", \"Avenir Next\", \"Segoe UI\", sans-serif",
    display: "\"Sora\", \"Avenir Next\", \"Segoe UI\", sans-serif",
    mono: "\"JetBrains Mono\", \"SFMono-Regular\", monospace"
  },
  size: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "24px",
    "2xl": "34px"
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700"
  },
  lineHeight: {
    tight: "1.15",
    snug: "1.3",
    normal: "1.55",
    relaxed: "1.7"
  },
  tracking: {
    tight: "-0.03em",
    normal: "0",
    wide: "0.14em"
  }
} as const;

const spaceScale = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px"
} as const;

const spacingAliases = {
  px: spaceScale[1],
  xs: spaceScale[2],
  sm: spaceScale[3],
  md: spaceScale[4],
  lg: "20px",
  xl: spaceScale[6],
  "2xl": spaceScale[8],
  "3xl": "40px"
} as const;

const radius = {
  sm: "12px",
  md: "18px",
  lg: "24px",
  xl: "30px",
  pill: "999px"
} as const;

const elevation = {
  sm: "0 12px 28px rgba(2, 9, 20, 0.18)",
  md: "0 18px 40px rgba(2, 9, 20, 0.28)",
  lg: "0 24px 80px rgba(2, 9, 20, 0.46)"
} as const;

const shadow = {
  sm: elevation.sm,
  md: elevation.md,
  lg: elevation.lg,
  soft: elevation.md,
  depth: elevation.lg
} as const;

const motion = {
  fast: "140ms",
  base: "220ms",
  slow: "320ms",
  ease: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  easeEmphasized: "cubic-bezier(0.16, 1, 0.3, 1)"
} as const;

const semantic = {
  bg: {
    app: {
      primary: primitiveColors.navy925,
      secondary: primitiveColors.navy950,
      canvas: "#050d18"
    },
    panel: {
      primary: primitiveColors.navy800,
      secondary: primitiveColors.navy850,
      interactive: primitiveColors.navy750
    },
    surface: {
      elevated: "#152744",
      sunk: "#081524",
      overlay: "rgba(4, 12, 22, 0.82)"
    }
  },
  text: {
    primary: primitiveColors.mist100,
    secondary: primitiveColors.steel200,
    tertiary: "#7487a5",
    inverse: primitiveColors.navy925
  },
  border: {
    subtle: "rgba(118, 150, 193, 0.12)",
    default: "rgba(118, 150, 193, 0.18)",
    strong: "rgba(118, 150, 193, 0.28)",
    accent: "rgba(77, 163, 255, 0.42)"
  },
  accent: {
    primary: primitiveColors.azure400,
    secondary: primitiveColors.steel400,
    soft: primitiveColors.azure300,
    glow: "rgba(77, 163, 255, 0.28)",
    quiet: "rgba(77, 163, 255, 0.12)"
  },
  validation: {
    info: {
      background: "rgba(121, 208, 255, 0.12)",
      border: "rgba(121, 208, 255, 0.28)",
      text: "#b7e6ff"
    },
    success: {
      background: "rgba(61, 217, 184, 0.12)",
      border: "rgba(61, 217, 184, 0.3)",
      text: "#c6f7eb"
    },
    warning: {
      background: "rgba(244, 195, 93, 0.13)",
      border: "rgba(244, 195, 93, 0.3)",
      text: "#ffe8b6"
    },
    error: {
      background: "rgba(255, 122, 110, 0.13)",
      border: "rgba(255, 122, 110, 0.3)",
      text: "#ffd2cc"
    }
  },
  state: {
    success: primitiveColors.mint400,
    warning: primitiveColors.gold400,
    error: primitiveColors.coral400,
    info: primitiveColors.cyan300
  },
  focus: {
    ring: "0 0 0 3px rgba(77, 163, 255, 0.22)"
  }
} as const;

export const designTokens = {
  theme: {
    name: "Course Creator OS Navy",
    mode: "dark",
    character: "premium-creative-suite"
  },
  primitive: {
    color: primitiveColors,
    typography,
    spacing: spaceScale,
    radius,
    elevation,
    motion
  },
  semantic,
  color: primitiveColors,
  typography,
  spacing: spacingAliases,
  radius,
  elevation,
  motion,
  bg: semantic.bg,
  panel: {
    primary: semantic.bg.panel.primary,
    secondary: semantic.bg.panel.secondary,
    interactive: semantic.bg.panel.interactive
  },
  text: semantic.text,
  accent: semantic.accent,
  border: semantic.border,
  validation: semantic.validation,
  state: semantic.state,
  focus: semantic.focus,
  font: {
    family: typography.family,
    size: typography.size,
    weight: typography.weight,
    lineHeight: typography.lineHeight,
    tracking: typography.tracking
  },
  space: spaceScale,
  shadow
} as const;

export type DesignTokens = typeof designTokens;
export type SpaceToken = keyof typeof spaceScale;
export type RadiusToken = keyof typeof radius;
export type ElevationToken = keyof typeof elevation;
export type ValidationTone = keyof typeof semantic.validation;
