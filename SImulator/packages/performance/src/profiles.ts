import type { PerformanceProfile, PerformanceProfileId } from "./models";

export const performanceProfiles: readonly PerformanceProfile[] = [
  {
    profileId: "brother-mode",
    name: "Brother Mode",
    intent: "Targets the known high-end simulator build without asking the creator to hold back early.",
    targetMachineClass: "i7-8086K / RTX 4080 Super / 64 GB",
    tradeoffSummary: "Allows richer geometry and animation, but still expects discipline in the densest spectacle zones.",
    geometryBudget: 92,
    materialBudget: 86,
    textureBudget: 22,
    animationBudget: 82,
    sceneDensityBudget: 84,
    visibilityBudget: 88,
    notes: [
      "Best profile for the known target machine and flagship development.",
      "Useful when spectacle and ambience are part of the product promise."
    ]
  },
  {
    profileId: "community-safe",
    name: "Community Safe",
    intent: "Protects broader community playback and public-safe release posture.",
    targetMachineClass: "Conservative community baseline",
    tradeoffSummary: "Demands stricter density, texture, and visibility discipline before release claims are credible.",
    geometryBudget: 65,
    materialBudget: 58,
    textureBudget: 14,
    animationBudget: 42,
    sceneDensityBudget: 56,
    visibilityBudget: 56,
    notes: [
      "Preferred posture for public-safe distribution.",
      "Use this profile to catch production risk before the course becomes expensive to simplify."
    ]
  },
  {
    profileId: "showcase",
    name: "Showcase",
    intent: "Supports promo capture, flyovers, and highly staged presentation output.",
    targetMachineClass: "Capture-focused showcase posture",
    tradeoffSummary: "Permits the most visual ambition, but that headroom should not be confused with community-safe readiness.",
    geometryBudget: 100,
    materialBudget: 96,
    textureBudget: 28,
    animationBudget: 96,
    sceneDensityBudget: 96,
    visibilityBudget: 96,
    notes: [
      "Ideal for presentation captures and internal look-dev reviews.",
      "A pass here is not proof that broader playback targets are safe."
    ]
  }
] as const;

export function getPerformanceProfile(profileId: PerformanceProfileId) {
  return performanceProfiles.find((profile) => profile.profileId === profileId) ?? performanceProfiles[0]!;
}
