import type { ValidationValidator } from "../models";
import { assetHealthValidator } from "./asset-health";
import { courseBibleCompletenessValidator } from "./course-bible-completeness";
import { holeMetadataValidator } from "./hole-metadata";
import { packagingReadinessValidator } from "./packaging-readiness";
import { performanceValidator } from "./performance";
import { playabilityValidator } from "./playability";
import { previewReadinessValidator } from "./preview-readiness";
import { projectIntegrityValidator } from "./project-integrity";
import { publishSafeReadinessValidator } from "./publish-safe-readiness";
import { simulatorLogicValidator } from "./simulator-logic";
import { styleConsistencyValidator } from "./style-consistency";

export const validationValidators: ValidationValidator[] = [
  {
    validatorId: "project-integrity",
    label: "Project Integrity Validator",
    category: "Project Integrity",
    validate: projectIntegrityValidator
  },
  {
    validatorId: "course-bible-completeness",
    label: "Course Bible Completeness Validator",
    category: "Course Bible Completeness",
    validate: courseBibleCompletenessValidator
  },
  {
    validatorId: "hole-metadata",
    label: "Hole Metadata Validator",
    category: "Hole Metadata Completeness",
    validate: holeMetadataValidator
  },
  {
    validatorId: "simulator-logic",
    label: "Simulator Logic Validator",
    category: "Simulator Logic Correctness",
    validate: simulatorLogicValidator
  },
  {
    validatorId: "asset-health",
    label: "Asset Health Validator",
    category: "Asset Health",
    validate: assetHealthValidator
  },
  {
    validatorId: "style-consistency",
    label: "Style Consistency Validator",
    category: "Style Consistency",
    validate: styleConsistencyValidator
  },
  {
    validatorId: "playability",
    label: "Playability Validator",
    category: "Playability",
    validate: playabilityValidator
  },
  {
    validatorId: "performance",
    label: "Performance Validator",
    category: "Performance Risk",
    validate: performanceValidator
  },
  {
    validatorId: "preview-readiness",
    label: "Preview Readiness Validator",
    category: "Preview Readiness",
    validate: previewReadinessValidator
  },
  {
    validatorId: "packaging-readiness",
    label: "Packaging Readiness Validator",
    category: "Packaging Readiness",
    validate: packagingReadinessValidator
  },
  {
    validatorId: "publish-safe-readiness",
    label: "Publish-Safe Readiness Validator",
    category: "Publish-Safe Readiness",
    validate: publishSafeReadinessValidator
  }
];
