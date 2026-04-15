import { startTransition, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  performanceProfiles,
  type PerformanceProfileId
} from "@course-creator-os/performance";
import { createProject, type ProjectCreationIntentInput } from "@course-creator-os/project-model";
import { createProjectBundle } from "@course-creator-os/storage/project-bundle";
import {
  Button,
  Inline,
  MetricChip,
  SectionHeader,
  Stack,
  SurfaceCard,
  TextField,
  SelectField,
  TogglePillGroup
} from "@course-creator-os/ui";

import { setActiveProject } from "../../app/project-session";
import {
  createProjectInDesktop,
  type ProjectCreationResult
} from "../../app/services/project-creation";
import { StatusPill } from "../../components/StatusPill";

type WizardStepId =
  | "project-basics"
  | "theme-style"
  | "output-target"
  | "course-scope"
  | "validation-release"
  | "review-create";

type WizardFormState = {
  name: string;
  slugOverride: string;
  projectRoot: string;
  primaryTheme: string;
  courseType: ProjectCreationIntentInput["courseType"];
  activeStylePack: string;
  realismTarget: number;
  spectacleTarget: number;
  targetHardwareProfile: string;
  activeOutputProfiles: PerformanceProfileId[];
  holeCount: number;
  projectMode: ProjectCreationIntentInput["projectMode"];
  activeValidationProfile: ProjectCreationIntentInput["activeValidationProfile"];
};

type WizardFieldName =
  | "name"
  | "slugOverride"
  | "projectRoot"
  | "primaryTheme"
  | "activeOutputProfiles";

type ThemePreset = {
  key: string;
  label: string;
  note: string;
  primaryTheme: string;
  courseType: WizardFormState["courseType"];
  activeStylePack: string;
  realismTarget: number;
  spectacleTarget: number;
};

const wizardSteps: Array<{
  id: WizardStepId;
  title: string;
  description: string;
}> = [
  {
    id: "project-basics",
    title: "Project Basics",
    description: "Name the project, lock the slug, and choose the target project root."
  },
  {
    id: "theme-style",
    title: "Theme & Style Direction",
    description: "Set the world identity, course type, and the realism-versus-spectacle posture."
  },
  {
    id: "output-target",
    title: "Output & Hardware Target",
    description: "Declare who the course should run for and which output profiles need coverage."
  },
  {
    id: "course-scope",
    title: "Course Scope",
    description: "Define the playable footprint and the seeded planning structure."
  },
  {
    id: "validation-release",
    title: "Validation & Release Mode",
    description: "Choose the release posture and how strict the product should be from the start."
  },
  {
    id: "review-create",
    title: "Review & Create",
    description: "Review the generated structure, then write the manifest, project files, and starter docs."
  }
];

const themePresets: ThemePreset[] = [
  {
    key: "theme-park-flagship",
    label: "Flagship Theme Park",
    note: "Premium resort-scale theme park direction with strong district identity and spectacle planning.",
    primaryTheme: "Modern premium theme park resort",
    courseType: "theme-park",
    activeStylePack: "premium-theme-park",
    realismTarget: 72,
    spectacleTarget: 84
  },
  {
    key: "community-resort",
    label: "Community Safe Resort",
    note: "Balanced scenic resort direction with broad playback targets and cleaner public-safe posture.",
    primaryTheme: "Modern coastal resort course",
    courseType: "resort",
    activeStylePack: "coastal-resort",
    realismTarget: 78,
    spectacleTarget: 58
  },
  {
    key: "fantasy-night",
    label: "Fantasy Night Showcase",
    note: "High-style fantasy direction with stronger cinematic lighting and showcase ambitions.",
    primaryTheme: "Stylized night fantasy course",
    courseType: "fantasy",
    activeStylePack: "fantasy-spectacle",
    realismTarget: 42,
    spectacleTarget: 92
  }
];

const courseTypeOptions: Array<{ label: string; value: string }> = [
  { label: "Theme Park", value: "theme-park" },
  { label: "Resort", value: "resort" },
  { label: "Parkland", value: "parkland" },
  { label: "Links", value: "links" },
  { label: "Desert", value: "desert" },
  { label: "Mountain", value: "mountain" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Urban", value: "urban" },
  { label: "Historical", value: "historical" },
  { label: "Surreal", value: "surreal" }
];

const stylePackOptions: Array<{ label: string; value: string }> = [
  { label: "Premium Theme Park", value: "premium-theme-park" },
  { label: "Coastal Resort", value: "coastal-resort" },
  { label: "Fantasy Spectacle", value: "fantasy-spectacle" },
  { label: "Urban Night", value: "urban-night" },
  { label: "Naturalistic Links", value: "naturalistic-links" },
  { label: "Manual / Custom", value: "manual-custom" }
];

const hardwareProfileOptions: Array<{ label: string; value: string }> = [
  {
    label: "Brother Mode Target",
    value: "i7-8086K / RTX 4080 Super / 64 GB / NVMe"
  },
  {
    label: "Community Safe Authoring Target",
    value: "Balanced community target / RTX 3070-class / 32 GB / NVMe"
  },
  {
    label: "Showcase Capture Workstation",
    value: "Showcase workstation / RTX 4090-class / 64 GB / NVMe"
  }
];

const validationProfileOptions: Array<{ label: string; value: string }> = [
  { label: "Balanced", value: "balanced" },
  { label: "Strict", value: "strict" },
  { label: "Showcase Review", value: "showcase-review" }
];

const holeCountOptions: Array<{ label: string; value: string }> = [
  { label: "9 Holes", value: "9" },
  { label: "18 Holes", value: "18" }
];

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "new-course";
}

function getDefaultProjectRootBase() {
  return window.localStorage.getItem("cco:create:last-root-base") ?? "~/Course Creator OS Projects";
}

function getDefaultFormState(): WizardFormState {
  const defaultSlug = slugify("New Course");

  return {
    name: "New Course",
    slugOverride: "",
    projectRoot: `${getDefaultProjectRootBase()}/${defaultSlug}`,
    primaryTheme: "Modern premium theme park resort",
    courseType: "theme-park",
    activeStylePack: "premium-theme-park",
    realismTarget: 72,
    spectacleTarget: 84,
    targetHardwareProfile: hardwareProfileOptions[0]!.value,
    activeOutputProfiles: ["community-safe", "brother-mode"],
    holeCount: 18,
    projectMode: "public-safe",
    activeValidationProfile: "balanced"
  };
}

function extractRootBase(projectRoot: string) {
  const normalized = projectRoot.trim().replace(/[\\/]+$/, "");
  const slashIndex = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));

  if (slashIndex <= 0) {
    return normalized;
  }

  return normalized.slice(0, slashIndex);
}

function createIntentFromForm(
  form: WizardFormState,
  derivedSlug: string,
): ProjectCreationIntentInput {
  return {
    name: form.name.trim() || "Untitled Course",
    slug: derivedSlug,
    projectMode: form.projectMode,
    holeCount: form.holeCount,
    primaryTheme: form.primaryTheme.trim() || "Course direction to be defined",
    courseType: form.courseType,
    realismTarget: form.realismTarget,
    spectacleTarget: form.spectacleTarget,
    targetHardwareProfile: form.targetHardwareProfile,
    activeValidationProfile: form.activeValidationProfile,
    activeOutputProfiles: form.activeOutputProfiles,
    activeStylePack: form.activeStylePack.trim() ? form.activeStylePack : null
  };
}

function validateForm(
  form: WizardFormState,
  derivedSlug: string,
): Partial<Record<WizardFieldName, string>> {
  const errors: Partial<Record<WizardFieldName, string>> = {};

  if (!form.name.trim()) {
    errors.name = "Project name is required.";
  }

  if (form.slugOverride.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slugOverride.trim())) {
    errors.slugOverride = "Use lowercase letters, numbers, and hyphens only.";
  }

  if (!derivedSlug) {
    errors.slugOverride = "A valid slug is required.";
  }

  if (!form.projectRoot.trim()) {
    errors.projectRoot = "Project root is required.";
  }

  if (!form.primaryTheme.trim()) {
    errors.primaryTheme = "Primary theme is required.";
  }

  if (form.activeOutputProfiles.length === 0) {
    errors.activeOutputProfiles = "Select at least one output profile.";
  }

  return errors;
}

function getStepFieldNames(stepId: WizardStepId): WizardFieldName[] {
  switch (stepId) {
    case "project-basics":
      return ["name", "slugOverride", "projectRoot"];
    case "theme-style":
      return ["primaryTheme"];
    case "output-target":
      return ["activeOutputProfiles"];
    default:
      return [];
  }
}

function getOutputProfileRecommendation(form: WizardFormState) {
  if (form.projectMode === "public-safe") {
    return "Recommended for public-safe work: Community Safe + Brother Mode.";
  }

  return "Recommended for private experimentation: Brother Mode + Showcase.";
}

export function CreateWizard() {
  const navigate = useNavigate();
  const [form, setForm] = useState<WizardFormState>(() => getDefaultFormState());
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [projectRootTouched, setProjectRootTouched] = useState(false);
  const [stepErrors, setStepErrors] = useState<Partial<Record<WizardFieldName, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<ProjectCreationResult | null>(null);

  const activeStep = wizardSteps[activeStepIndex]!;
  const derivedSlug = form.slugOverride.trim() || slugify(form.name);
  const validationErrors = validateForm(form, derivedSlug);
  const previewProject = createProject(createIntentFromForm(form, derivedSlug));
  const previewBundle = createProjectBundle(previewProject);

  useEffect(() => {
    if (projectRootTouched) {
      return;
    }

    setForm((current) => ({
      ...current,
      projectRoot: `${getDefaultProjectRootBase()}/${derivedSlug}`
    }));
  }, [derivedSlug, projectRootTouched]);

  function updateForm<K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) {
    setSubmissionError(null);
    setStepErrors((current) => {
      const next = { ...current };
      const fieldKey = key as WizardFieldName;
      delete next[fieldKey];
      return next;
    });
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function applyThemePreset(preset: ThemePreset) {
    setSubmissionError(null);
    setForm((current) => ({
      ...current,
      primaryTheme: preset.primaryTheme,
      courseType: preset.courseType,
      activeStylePack: preset.activeStylePack,
      realismTarget: preset.realismTarget,
      spectacleTarget: preset.spectacleTarget
    }));
  }

  function toggleOutputProfile(profileId: PerformanceProfileId) {
    setSubmissionError(null);
    setForm((current) => {
      const exists = current.activeOutputProfiles.includes(profileId);

      if (exists && current.activeOutputProfiles.length === 1) {
        return current;
      }

      return {
        ...current,
        activeOutputProfiles: exists
          ? current.activeOutputProfiles.filter((value) => value !== profileId)
          : [...current.activeOutputProfiles, profileId]
      };
    });
  }

  function advanceStep() {
    const nextErrors = validateForm(form, derivedSlug);
    const relevantKeys = getStepFieldNames(activeStep.id);
    const currentStepErrors = Object.fromEntries(
      relevantKeys
        .filter((key) => nextErrors[key])
        .map((key) => [key, nextErrors[key]]),
    ) as Partial<Record<WizardFieldName, string>>;

    if (Object.keys(currentStepErrors).length > 0) {
      setStepErrors(currentStepErrors);
      return;
    }

    setStepErrors({});
    setActiveStepIndex((current) => Math.min(current + 1, wizardSteps.length - 1));
  }

  async function handleCreate() {
    const nextErrors = validateForm(form, derivedSlug);

    if (Object.keys(nextErrors).length > 0) {
      setStepErrors(nextErrors);
      setActiveStepIndex(wizardSteps.length - 1);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await createProjectInDesktop(
        createIntentFromForm(form, derivedSlug),
        form.projectRoot,
      );

      window.localStorage.setItem("cco:create:last-root-base", extractRootBase(result.projectRoot));
      startTransition(() => {
        setActiveProject(result.project, {
          persistenceMode: result.storageMode,
          projectRoot: result.projectRoot,
          manifestPath: result.manifestPath,
          savedAt: result.project.manifest.updatedAt
        });
      });
      setCreatedResult(result);
      setActiveStepIndex(wizardSteps.length - 1);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Project creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel create-wizard-shell">
      <div className="create-wizard-layout">
        <aside className="create-wizard-steps">
          <SectionHeader
            eyebrow="Create"
            title="Guided project setup"
            description="Strong defaults, real file output, and clear release posture from the first minute."
          />
          <div className="wizard-stepper wizard-stepper-rich">
            {wizardSteps.map((step, index) => {
              const isCurrent = index === activeStepIndex;
              const isComplete = index < activeStepIndex;

              return (
                <button
                  key={step.id}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`wizard-step wizard-step-rich ${isCurrent ? "is-active" : ""} ${
                    isComplete ? "is-complete" : ""
                  }`}
                  onClick={() => setActiveStepIndex(index)}
                  type="button"
                >
                  <span className="wizard-index">{index + 1}</span>
                  <div className="wizard-step-copy">
                    <strong>{step.title}</strong>
                    <span>{step.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="create-wizard-main">
          <SurfaceCard padding={8} tone="raised" border="accent" className="create-wizard-stage">
            {createdResult ? (
              <Stack gap={6}>
                <SectionHeader
                  eyebrow="Project Created"
                  title={`${createdResult.project.manifest.name} is ready for planning`}
                  description="The manifest, project scaffold, and starter docs were generated successfully."
                  actions={
                    <StatusPill
                      label={
                        createdResult.storageMode === "tauri-filesystem"
                          ? "Project Files Written"
                          : "Preview Bundle Saved"
                      }
                      tone="success"
                    />
                  }
                />
                <div className="wizard-success-grid">
                  <MetricChip label="Manifest" value={createdResult.manifestPath} note="Primary project truth entrypoint" />
                  <MetricChip
                    label="Files Created"
                    tone="success"
                    value={createdResult.fileCount}
                    note={createdResult.storageMode === "tauri-filesystem" ? "Written to disk" : "Saved as browser preview bundle"}
                  />
                  <MetricChip label="Project Root" value={createdResult.projectRoot} note="Folder initialized for Course Creator OS" />
                </div>
                <SurfaceCard tone="contrast" padding={6}>
                  <Stack gap={3}>
                    <p className="eyebrow">Starter Output</p>
                    <ul className="rail-list wizard-file-list">
                      {createdResult.createdFiles.slice(0, 10).map((file) => (
                        <li key={file.relativePath}>
                          <strong>{file.relativePath}</strong>
                          <span>Created during initial scaffold.</span>
                        </li>
                      ))}
                    </ul>
                  </Stack>
                </SurfaceCard>
                <Inline gap={3}>
                  <Button tone="primary" onClick={() => navigate("/plan")}>
                    Open Course Bible
                  </Button>
                  <Button tone="secondary" onClick={() => navigate("/gameplay")}>
                    Review Gameplay Setup
                  </Button>
                </Inline>
              </Stack>
            ) : (
              <Stack gap={6}>
                <SectionHeader
                  eyebrow={`Step ${activeStepIndex + 1} of ${wizardSteps.length}`}
                  title={activeStep.title}
                  description={activeStep.description}
                  actions={<StatusPill label="Guided Defaults" tone="info" />}
                />

                {activeStep.id === "project-basics" ? (
                  <div className="wizard-form-grid">
                    <TextField
                      label="Project Name"
                      hint="This becomes the manifest name and the primary shell identity."
                      error={stepErrors.name}
                      value={form.name}
                      onChange={(event) => updateForm("name", event.target.value)}
                    />
                    <TextField
                      label="Project Slug Override"
                      hint={`Leave blank to auto-generate from the name. Current slug: ${derivedSlug}`}
                      error={stepErrors.slugOverride}
                      value={form.slugOverride}
                      onChange={(event) => updateForm("slugOverride", event.target.value)}
                    />
                    <TextField
                      label="Project Root"
                      hint="The desktop build writes the manifest, project sections, and starter docs to this folder."
                      error={stepErrors.projectRoot}
                      value={form.projectRoot}
                      onChange={(event) => {
                        setProjectRootTouched(true);
                        updateForm("projectRoot", event.target.value);
                      }}
                    />
                  </div>
                ) : null}

                {activeStep.id === "theme-style" ? (
                  <Stack gap={6}>
                    <div className="wizard-selection-grid">
                      {themePresets.map((preset) => {
                        const selected =
                          preset.primaryTheme === form.primaryTheme &&
                          preset.courseType === form.courseType &&
                          preset.activeStylePack === form.activeStylePack;

                        return (
                          <button
                            key={preset.key}
                            aria-pressed={selected}
                            className={`wizard-selection-card ${selected ? "is-selected" : ""}`}
                            onClick={() => applyThemePreset(preset)}
                            type="button"
                          >
                            <StatusPill label={selected ? "Selected" : "Preset"} tone={selected ? "success" : "info"} />
                            <strong>{preset.label}</strong>
                            <span>{preset.note}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="wizard-form-grid">
                      <TextField
                        label="Primary Theme"
                        hint="This becomes the guiding world identity for the course."
                        error={stepErrors.primaryTheme}
                        value={form.primaryTheme}
                        onChange={(event) => updateForm("primaryTheme", event.target.value)}
                      />
                      <SelectField
                        label="Course Type"
                        options={courseTypeOptions}
                        value={form.courseType}
                        onChange={(event) => updateForm("courseType", event.target.value as WizardFormState["courseType"])}
                      />
                      <SelectField
                        label="Style Pack"
                        options={stylePackOptions}
                        value={form.activeStylePack}
                        onChange={(event) => updateForm("activeStylePack", event.target.value)}
                      />
                    </div>

                    <div className="wizard-range-grid">
                      <label className="wizard-range-card">
                        <span className="wizard-range-label">Realism Target</span>
                        <strong>{form.realismTarget}</strong>
                        <input
                          className="wizard-range-input"
                          max={100}
                          min={0}
                          onChange={(event) => updateForm("realismTarget", Number(event.target.value))}
                          type="range"
                          value={form.realismTarget}
                        />
                        <span>Higher values push believable world logic and grounded materials.</span>
                      </label>
                      <label className="wizard-range-card">
                        <span className="wizard-range-label">Spectacle Target</span>
                        <strong>{form.spectacleTarget}</strong>
                        <input
                          className="wizard-range-input"
                          max={100}
                          min={0}
                          onChange={(event) => updateForm("spectacleTarget", Number(event.target.value))}
                          type="range"
                          value={form.spectacleTarget}
                        />
                        <span>Higher values prioritize signature reveals, event choreography, and visual payoff.</span>
                      </label>
                    </div>
                  </Stack>
                ) : null}

                {activeStep.id === "output-target" ? (
                  <Stack gap={6}>
                    <SelectField
                      label="Target Hardware Profile"
                      hint="Choose the primary playback target this project should respect first."
                      options={hardwareProfileOptions}
                      value={form.targetHardwareProfile}
                      onChange={(event) => updateForm("targetHardwareProfile", event.target.value)}
                    />
                    <SurfaceCard tone="contrast" padding={6}>
                      <Stack gap={4}>
                        <SectionHeader
                          eyebrow="Output Profiles"
                          title="Pick the profiles this project must satisfy"
                          description={getOutputProfileRecommendation(form)}
                        />
                        {stepErrors.activeOutputProfiles ? (
                          <p className="wizard-inline-error">{stepErrors.activeOutputProfiles}</p>
                        ) : null}
                        <div className="wizard-selection-grid">
                          {performanceProfiles.map((profile) => {
                            const selected = form.activeOutputProfiles.includes(profile.profileId);

                            return (
                              <button
                                key={profile.profileId}
                                aria-pressed={selected}
                                className={`wizard-selection-card ${selected ? "is-selected" : ""}`}
                                onClick={() => toggleOutputProfile(profile.profileId)}
                                type="button"
                              >
                                <StatusPill label={selected ? "Included" : "Optional"} tone={selected ? "success" : "default"} />
                                <strong>{profile.name}</strong>
                                <span>{profile.notes[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </Stack>
                    </SurfaceCard>
                  </Stack>
                ) : null}

                {activeStep.id === "course-scope" ? (
                  <Stack gap={6}>
                    <SelectField
                      label="Hole Count"
                      hint="Seed the project with the correct hole structure from the beginning."
                      options={holeCountOptions}
                      value={String(form.holeCount)}
                      onChange={(event) => updateForm("holeCount", Number(event.target.value))}
                    />
                    <div className="wizard-success-grid">
                      <MetricChip label="Seeded Holes" value={form.holeCount} note="Hole registry, pacing scaffold, and initial metadata" />
                      <MetricChip label="Tee + Pin Scaffolds" value="1 + 1" note="Initial simulator setup generated for every hole" />
                      <MetricChip label="Starter Districts" value="1" note="Core world identity district initialized" />
                    </div>
                    <SurfaceCard tone="contrast" padding={6}>
                      <Stack gap={3}>
                        <p className="eyebrow">Course Scope Promise</p>
                        <p className="body-copy">
                          The wizard seeds holes, simulator logic, versioning, packaging state, and starter docs so planning can begin immediately without a messy blank slate.
                        </p>
                      </Stack>
                    </SurfaceCard>
                  </Stack>
                ) : null}

                {activeStep.id === "validation-release" ? (
                  <Stack gap={6}>
                    <div className="wizard-toggle-group">
                      <label className="wizard-toggle-label">Release Mode</label>
                      <TogglePillGroup
                        ariaLabel="Release Mode"
                        options={[
                          { label: "Public Safe", value: "public-safe" },
                          { label: "Experimental Private", value: "experimental-private" }
                        ]}
                        onChange={(value) => updateForm("projectMode", value)}
                        value={form.projectMode}
                      />
                    </div>
                    <SelectField
                      label="Validation Profile"
                      hint="Strictness controls how aggressively the app pushes completeness and release discipline."
                      options={validationProfileOptions}
                      value={form.activeValidationProfile}
                      onChange={(event) =>
                        updateForm(
                          "activeValidationProfile",
                          event.target.value as WizardFormState["activeValidationProfile"],
                        )
                      }
                    />
                    <SurfaceCard tone="contrast" padding={6}>
                      <Stack gap={3}>
                        <p className="eyebrow">Release Posture</p>
                        <p className="body-copy">
                          {form.projectMode === "public-safe"
                            ? "Public-safe mode keeps broader playback expectations and community readiness visible from the start."
                            : "Experimental-private mode allows more aggressive iteration while still preserving a clear route back to validation discipline."}
                        </p>
                      </Stack>
                    </SurfaceCard>
                  </Stack>
                ) : null}

                {activeStep.id === "review-create" ? (
                  <Stack gap={6}>
                    <SurfaceCard tone="contrast" padding={6}>
                      <Stack gap={3}>
                        <SectionHeader
                          eyebrow="Ready To Write"
                          title="Project scaffold preview"
                          description="This is the real manifest and file structure that will be created on completion."
                        />
                        <div className="wizard-review-grid">
                          <div>
                            <span className="wizard-review-label">Project Root</span>
                            <strong>{form.projectRoot}</strong>
                          </div>
                          <div>
                            <span className="wizard-review-label">Manifest Slug</span>
                            <strong>{derivedSlug}</strong>
                          </div>
                          <div>
                            <span className="wizard-review-label">Theme</span>
                            <strong>{form.primaryTheme}</strong>
                          </div>
                          <div>
                            <span className="wizard-review-label">Profiles</span>
                            <strong>{form.activeOutputProfiles.join(", ")}</strong>
                          </div>
                        </div>
                      </Stack>
                    </SurfaceCard>
                    <SurfaceCard tone="ghost" padding={1} border="subtle">
                      <ul className="rail-list wizard-file-list">
                        {previewBundle.slice(0, 12).map((file) => (
                          <li key={file.relativePath}>
                            <strong>{file.relativePath}</strong>
                            <span>Initialized during project creation.</span>
                          </li>
                        ))}
                      </ul>
                    </SurfaceCard>
                  </Stack>
                ) : null}

                {submissionError ? (
                  <SurfaceCard tone="contrast" border="strong" padding={4} className="wizard-error-card">
                    <p className="wizard-inline-error">{submissionError}</p>
                  </SurfaceCard>
                ) : null}

                <Inline justify="space-between" className="wizard-actions">
                  <Button
                    disabled={activeStepIndex === 0 || isSubmitting}
                    onClick={() => setActiveStepIndex((current) => Math.max(current - 1, 0))}
                    tone="ghost"
                  >
                    Back
                  </Button>
                  <Inline gap={3}>
                    {activeStepIndex < wizardSteps.length - 1 ? (
                      <Button onClick={advanceStep} tone="primary">
                        Continue
                      </Button>
                    ) : (
                      <Button disabled={isSubmitting} onClick={handleCreate} tone="primary">
                        {isSubmitting ? "Creating Project..." : "Create Project"}
                      </Button>
                    )}
                  </Inline>
                </Inline>
              </Stack>
            )}
          </SurfaceCard>
        </div>

        <aside className="create-wizard-summary">
          <SurfaceCard padding={6} tone="contrast" border="accent">
            <Stack gap={6}>
              <SectionHeader
                eyebrow="Summary"
                title="Premium setup snapshot"
                description="The right rail stays focused on what the wizard is actually going to create."
              />
              <div className="wizard-success-grid">
                <MetricChip label="Course Type" value={form.courseType} note={form.primaryTheme} />
                <MetricChip label="Release Mode" value={form.projectMode} note={form.activeValidationProfile} />
                <MetricChip label="Hole Count" value={form.holeCount} note={`${previewProject.holes.length} seeded hole records`} />
                <MetricChip label="Outputs" value={form.activeOutputProfiles.length} note={form.activeOutputProfiles.join(", ")} />
              </div>
              <SurfaceCard tone="ghost" padding={4}>
                <Stack gap={3}>
                  <p className="eyebrow">Create Output</p>
                  <ul className="rail-list wizard-file-list">
                    <li>
                      <strong>Manifest</strong>
                      <span>{derivedSlug}/project.manifest.json</span>
                    </li>
                    <li>
                      <strong>Starter Docs</strong>
                      <span>README, setup, next steps, and course bible markdown</span>
                    </li>
                    <li>
                      <strong>Structured Data</strong>
                      <span>Course bible, holes, simulator logic, world, preview, and versioning sections</span>
                    </li>
                  </ul>
                </Stack>
              </SurfaceCard>
            </Stack>
          </SurfaceCard>
        </aside>
      </div>
    </section>
  );
}
