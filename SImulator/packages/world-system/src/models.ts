import { z } from "zod";

export const districtTypes = [
  "primary",
  "arrival",
  "garden",
  "entertainment",
  "finale",
  "natural",
  "resort",
  "urban",
  "heritage",
  "fantasy",
  "service"
] as const;
export const landmarkTypes = [
  "orientation-anchor",
  "signature-moment",
  "set-piece",
  "skyline-marker",
  "supporting-feature"
] as const;
export const visibilityPriorities = ["low", "medium", "high", "hero"] as const;
export const supportSpaceTypes = [
  "guest-services",
  "operations",
  "backstage",
  "hospitality",
  "transit",
  "maintenance",
  "utilities",
  "landscape-support",
  "attraction-support",
  "waterfront"
] as const;
export const environmentZoneTypes = [
  "vegetation",
  "water",
  "lighting",
  "terrain",
  "audio",
  "atmosphere",
  "materials",
  "weather",
  "shoreline"
] as const;
export const zoneDensities = ["low", "medium", "high", "hero"] as const;

export const districtTypeSchema = z.enum(districtTypes);
export const landmarkTypeSchema = z.enum(landmarkTypes);
export const visibilityPrioritySchema = z.enum(visibilityPriorities);
export const supportSpaceTypeSchema = z.enum(supportSpaceTypes);
export const environmentZoneTypeSchema = z.enum(environmentZoneTypes);
export const zoneDensitySchema = z.enum(zoneDensities);

export const districtSchema = z.object({
  districtId: z.string(),
  name: z.string(),
  districtType: districtTypeSchema,
  theme: z.string(),
  visualRole: z.string(),
  mood: z.string().optional(),
  supportRealismNotes: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const landmarkSchema = z.object({
  landmarkId: z.string(),
  name: z.string(),
  districtRef: z.string(),
  landmarkType: landmarkTypeSchema.default("orientation-anchor"),
  visibilityRole: z.string(),
  visibilityPriority: visibilityPrioritySchema.default("medium"),
  linkedHoleRefs: z.array(z.string()).default([]),
  assetRefs: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const supportSpaceSchema = z.object({
  supportSpaceId: z.string(),
  districtRef: z.string(),
  name: z.string(),
  spaceType: supportSpaceTypeSchema,
  roleSummary: z.string(),
  playerFacing: z.boolean().default(false),
  linkedHoleRefs: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const environmentZoneSchema = z.object({
  environmentZoneId: z.string(),
  districtRef: z.string(),
  name: z.string(),
  zoneType: environmentZoneTypeSchema,
  treatmentSummary: z.string(),
  dominantPalette: z.array(z.string()).default([]),
  density: zoneDensitySchema.default("medium"),
  linkedHoleRefs: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export type DistrictType = z.infer<typeof districtTypeSchema>;
export type LandmarkType = z.infer<typeof landmarkTypeSchema>;
export type VisibilityPriority = z.infer<typeof visibilityPrioritySchema>;
export type SupportSpaceType = z.infer<typeof supportSpaceTypeSchema>;
export type EnvironmentZoneType = z.infer<typeof environmentZoneTypeSchema>;
export type ZoneDensity = z.infer<typeof zoneDensitySchema>;
export type District = z.infer<typeof districtSchema>;
export type Landmark = z.infer<typeof landmarkSchema>;
export type SupportSpace = z.infer<typeof supportSpaceSchema>;
export type EnvironmentZone = z.infer<typeof environmentZoneSchema>;
