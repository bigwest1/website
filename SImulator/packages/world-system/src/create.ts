import { z } from "zod";

import {
  districtSchema,
  districtTypeSchema,
  environmentZoneSchema,
  environmentZoneTypeSchema,
  landmarkSchema,
  landmarkTypeSchema,
  supportSpaceSchema,
  supportSpaceTypeSchema,
  visibilityPrioritySchema,
  zoneDensitySchema,
  type District,
  type EnvironmentZone,
  type Landmark,
  type SupportSpace
} from "./models";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const createDistrictRecordInputSchema = z.object({
  districtId: z.string().optional(),
  name: z.string().trim().min(1),
  districtType: districtTypeSchema.optional(),
  theme: z.string().trim().min(1).optional(),
  visualRole: z.string().trim().min(1).optional(),
  mood: z.string().optional(),
  supportRealismNotes: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const createLandmarkRecordInputSchema = z.object({
  landmarkId: z.string().optional(),
  name: z.string().trim().min(1),
  districtRef: z.string().trim().min(1),
  landmarkType: landmarkTypeSchema.optional(),
  visibilityRole: z.string().trim().min(1).optional(),
  visibilityPriority: visibilityPrioritySchema.optional(),
  linkedHoleRefs: z.array(z.string()).optional(),
  assetRefs: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const createSupportSpaceRecordInputSchema = z.object({
  supportSpaceId: z.string().optional(),
  districtRef: z.string().trim().min(1),
  name: z.string().trim().min(1),
  spaceType: supportSpaceTypeSchema.optional(),
  roleSummary: z.string().trim().min(1).optional(),
  playerFacing: z.boolean().optional(),
  linkedHoleRefs: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const createEnvironmentZoneRecordInputSchema = z.object({
  environmentZoneId: z.string().optional(),
  districtRef: z.string().trim().min(1),
  name: z.string().trim().min(1),
  zoneType: environmentZoneTypeSchema.optional(),
  treatmentSummary: z.string().trim().min(1).optional(),
  dominantPalette: z.array(z.string()).optional(),
  density: zoneDensitySchema.optional(),
  linkedHoleRefs: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export type CreateDistrictRecordInput = z.infer<typeof createDistrictRecordInputSchema>;
export type CreateLandmarkRecordInput = z.infer<typeof createLandmarkRecordInputSchema>;
export type CreateSupportSpaceRecordInput = z.infer<typeof createSupportSpaceRecordInputSchema>;
export type CreateEnvironmentZoneRecordInput = z.infer<typeof createEnvironmentZoneRecordInputSchema>;

export function createDistrictRecord(input: CreateDistrictRecordInput): District {
  const parsed = createDistrictRecordInputSchema.parse(input);
  const districtSlug = slugify(parsed.name) || "district";

  return districtSchema.parse({
    districtId: parsed.districtId ?? `district-${districtSlug}`,
    name: parsed.name,
    districtType: parsed.districtType ?? "primary",
    theme: parsed.theme ?? parsed.name,
    visualRole: parsed.visualRole ?? "World composition role to be defined.",
    mood: parsed.mood,
    supportRealismNotes: parsed.supportRealismNotes ?? [],
    notes: parsed.notes
  });
}

export function createLandmarkRecord(input: CreateLandmarkRecordInput): Landmark {
  const parsed = createLandmarkRecordInputSchema.parse(input);
  const landmarkSlug = slugify(parsed.name) || "landmark";

  return landmarkSchema.parse({
    landmarkId: parsed.landmarkId ?? `landmark-${landmarkSlug}`,
    name: parsed.name,
    districtRef: parsed.districtRef,
    landmarkType: parsed.landmarkType ?? "orientation-anchor",
    visibilityRole: parsed.visibilityRole ?? "Primary visual anchor",
    visibilityPriority: parsed.visibilityPriority ?? "medium",
    linkedHoleRefs: parsed.linkedHoleRefs ?? [],
    assetRefs: parsed.assetRefs ?? [],
    notes: parsed.notes
  });
}

export function createSupportSpaceRecord(input: CreateSupportSpaceRecordInput): SupportSpace {
  const parsed = createSupportSpaceRecordInputSchema.parse(input);
  const supportSpaceSlug = slugify(parsed.name) || "support-space";

  return supportSpaceSchema.parse({
    supportSpaceId: parsed.supportSpaceId ?? `support-space-${supportSpaceSlug}`,
    districtRef: parsed.districtRef,
    name: parsed.name,
    spaceType: parsed.spaceType ?? "operations",
    roleSummary: parsed.roleSummary ?? "Support-space function still needs definition.",
    playerFacing: parsed.playerFacing ?? false,
    linkedHoleRefs: parsed.linkedHoleRefs ?? [],
    notes: parsed.notes
  });
}

export function createEnvironmentZoneRecord(input: CreateEnvironmentZoneRecordInput): EnvironmentZone {
  const parsed = createEnvironmentZoneRecordInputSchema.parse(input);
  const zoneSlug = slugify(parsed.name) || "environment-zone";

  return environmentZoneSchema.parse({
    environmentZoneId: parsed.environmentZoneId ?? `environment-zone-${zoneSlug}`,
    districtRef: parsed.districtRef,
    name: parsed.name,
    zoneType: parsed.zoneType ?? "vegetation",
    treatmentSummary: parsed.treatmentSummary ?? "Environmental treatment still needs definition.",
    dominantPalette: parsed.dominantPalette ?? [],
    density: parsed.density ?? "medium",
    linkedHoleRefs: parsed.linkedHoleRefs ?? [],
    notes: parsed.notes
  });
}
