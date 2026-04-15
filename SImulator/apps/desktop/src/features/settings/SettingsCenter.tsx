import {
  Button,
  MetricChip,
  SelectField,
  TextField,
  TogglePillGroup
} from "@course-creator-os/ui";

import {
  setDiagnosticsEnabled,
  setIntegrationEnabled,
  setThemeMode,
  setToolEnabled,
  updateProjectDefaults,
  updateToolPath,
  refreshIntegrationHealth,
  useAppSettings
} from "../../app/settings-session";
import { useProjectSession } from "../../app/project-session";
import { StatusPill } from "../../components/StatusPill";

function toneForIntegrationStatus(status: "connected" | "needs-config" | "disabled" | "degraded" | "error") {
  switch (status) {
    case "connected":
      return "success";
    case "needs-config":
    case "degraded":
      return "warning";
    case "error":
      return "danger";
    case "disabled":
    default:
      return "info";
  }
}

function toneForRuntimeStatusPill(
  status: "verified" | "partially-verified" | "degraded" | "unavailable" | "preview-only",
) {
  switch (status) {
    case "verified":
      return "success";
    case "partially-verified":
      return "warning";
    case "unavailable":
      return "danger";
    case "degraded":
      return "danger";
    case "preview-only":
    default:
      return "info";
  }
}

function toneForRuntimeMetric(
  status: "verified" | "partially-verified" | "degraded" | "unavailable" | "preview-only",
) {
  switch (status) {
    case "verified":
      return "success";
    case "partially-verified":
      return "warning";
    case "unavailable":
      return "error";
    case "degraded":
      return "error";
    case "preview-only":
    default:
      return "info";
  }
}

export function SettingsCenter() {
  const {
    appConfig,
    integrationDefinitions,
    integrationHealth,
    integrationHealthSummary,
    nativeRuntimeReport,
    saveStatus,
    toolDefinitions,
    verificationStatus
  } = useAppSettings();
  const { projectRoot, persistenceMode } = useProjectSession();
  const gsproExportIntegration = integrationHealth.find(
    (integration) => integration.integrationId === "gspro-export",
  );

  return (
    <div className="mode-stack settings-center">
      <section className="panel package-center-hero">
        <div>
          <p className="eyebrow">Settings</p>
          <h3>App defaults, tool paths, and managed integration posture</h3>
          <p className="body-copy">
            Integration settings should stay explicit and understandable. The UI configures bridge
            boundaries and health posture, but never takes a direct dependency on tool-specific execution details.
          </p>
        </div>
        <div className="package-center-hero-meta">
          <StatusPill label={integrationHealthSummary.overallStatus} tone={toneForIntegrationStatus(integrationHealthSummary.overallStatus)} />
          <StatusPill label={nativeRuntimeReport.status} tone={toneForRuntimeStatusPill(nativeRuntimeReport.status)} />
          <StatusPill label={saveStatus.label} tone="info" />
        </div>
      </section>

      <div className="package-center-metrics">
        <MetricChip label="Connected" value={integrationHealthSummary.connectedCount} tone="success" />
        <MetricChip label="Needs Config" value={integrationHealthSummary.needsConfigCount} tone={integrationHealthSummary.needsConfigCount > 0 ? "warning" : "success"} />
        <MetricChip label="Degraded" value={integrationHealthSummary.degradedCount} tone={integrationHealthSummary.degradedCount > 0 ? "warning" : "success"} />
        <MetricChip label="Diagnostics" value={appConfig.diagnosticsEnabled ? "On" : "Off"} tone={appConfig.diagnosticsEnabled ? "info" : "warning"} />
        <MetricChip label="Native Runtime" value={nativeRuntimeReport.status} note={nativeRuntimeReport.shellRuntime} tone={toneForRuntimeMetric(nativeRuntimeReport.status)} />
        <MetricChip
          label="Host Session"
          value={nativeRuntimeReport.hostSessionReady ? "Verified" : "Pending"}
          note={nativeRuntimeReport.hostSessionEvidencePath ?? "No live host-session evidence captured yet"}
          tone={
            nativeRuntimeReport.hostSessionReady
              ? "success"
              : nativeRuntimeReport.status === "degraded" || nativeRuntimeReport.status === "unavailable"
                ? "error"
                : "warning"
          }
        />
        <MetricChip
          label="GSPro Export Tool"
          value={gsproExportIntegration?.status ?? "needs-config"}
          note={gsproExportIntegration?.issueSummary ?? "No external GSPro export tool has been assessed yet"}
          tone={
            gsproExportIntegration?.status === "connected"
              ? "success"
              : gsproExportIntegration?.status === "error"
                ? "error"
                : "warning"
          }
        />
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Project Defaults</p>
              <h3>Baseline posture for new projects</h3>
            </div>
          </div>
          <div className="settings-form-grid">
            <SelectField
              label="Default project mode"
              options={[
                { label: "Public-Safe", value: "public-safe" },
                { label: "Experimental Private", value: "experimental-private" }
              ]}
              value={appConfig.projectDefaults.defaultProjectMode}
              onChange={(event) =>
                updateProjectDefaults((defaults) => ({
                  ...defaults,
                  defaultProjectMode: event.currentTarget.value as typeof defaults.defaultProjectMode
                }))
              }
            />
            <SelectField
              label="Validation profile"
              options={[
                { label: "Balanced", value: "balanced" },
                { label: "Strict", value: "strict" },
                { label: "Showcase Review", value: "showcase-review" }
              ]}
              value={appConfig.projectDefaults.defaultValidationProfile}
              onChange={(event) =>
                updateProjectDefaults((defaults) => ({
                  ...defaults,
                  defaultValidationProfile: event.currentTarget.value as typeof defaults.defaultValidationProfile
                }))
              }
            />
            <SelectField
              label="Default output profile"
              options={[
                { label: "Brother Mode", value: "brother-mode" },
                { label: "Community Safe", value: "community-safe" },
                { label: "Showcase", value: "showcase" }
              ]}
              value={appConfig.projectDefaults.defaultOutputProfile}
              onChange={(event) =>
                updateProjectDefaults((defaults) => ({
                  ...defaults,
                  defaultOutputProfile: event.currentTarget.value as typeof defaults.defaultOutputProfile
                }))
              }
            />
            <TextField
              label="Default hole count"
              type="number"
              min={1}
              max={18}
              value={String(appConfig.projectDefaults.defaultHoleCount)}
              onChange={(event) => {
                const parsed = Number(event.currentTarget.value);
                if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 18) {
                  updateProjectDefaults((defaults) => ({
                    ...defaults,
                    defaultHoleCount: parsed
                  }));
                }
              }}
            />
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Shell Behavior</p>
              <h3>Appearance and diagnostics posture</h3>
            </div>
            <Button
              onClick={() => {
                void refreshIntegrationHealth(projectRoot, persistenceMode);
              }}
              size="sm"
              tone="secondary"
            >
              Refresh Health
            </Button>
          </div>
          <div className="issue-card-list">
            <article className="module-card">
              <p className="module-card-title">Theme mode</p>
              <p className="body-copy">Keep the shell locked to a calm dark-first posture unless the environment requires system sync.</p>
              <TogglePillGroup
                ariaLabel="Theme mode"
                options={[
                  { label: "Dark", value: "dark" },
                  { label: "System", value: "system" }
                ]}
                value={appConfig.themeMode}
                onChange={setThemeMode}
              />
            </article>
            <article className="module-card">
              <p className="module-card-title">Diagnostics visibility</p>
              <p className="body-copy">Keep logging and health surfaces enabled so integrations fail explicitly rather than silently.</p>
              <TogglePillGroup
                ariaLabel="Diagnostics enabled"
                options={[
                  { label: "Enabled", value: "enabled" },
                  { label: "Muted", value: "disabled" }
                ]}
                value={appConfig.diagnosticsEnabled ? "enabled" : "disabled"}
                onChange={(value) => setDiagnosticsEnabled(value === "enabled")}
              />
            </article>
            <article className="module-card">
              <p className="module-card-title">Next action</p>
              <p className="body-copy">{verificationStatus.detail}</p>
              <p className="muted-copy">{saveStatus.detail}</p>
            </article>
            <article className="module-card">
              <p className="module-card-title">Native runtime posture</p>
              <p className="body-copy">{nativeRuntimeReport.summary}</p>
              <p className="muted-copy">{nativeRuntimeReport.recommendedAction}</p>
            </article>
            <article className="module-card">
              <p className="module-card-title">Verification scope</p>
              <p className="body-copy">
                Desktop runtime: {nativeRuntimeReport.desktopRuntimeAvailable ? "available" : "unavailable"} ·
                Native commands: {nativeRuntimeReport.nativeCommandBridgeAvailable ? "available" : "unavailable"} ·
                Filesystem writes: {nativeRuntimeReport.filesystemWriteAvailable ? "available" : "unavailable"} ·
                SQLite index: {nativeRuntimeReport.sqliteIndexAvailable ? "available" : "unavailable"} ·
                Command execution: {nativeRuntimeReport.commandExecutionReady ? "verified" : "degraded"} ·
                Host session: {nativeRuntimeReport.hostSessionReady ? "verified" : "partial"}
              </p>
              <p className="muted-copy">
                {nativeRuntimeReport.projectRootResolved
                  ? `Project root: ${nativeRuntimeReport.projectRootResolved}`
                  : "No persisted project root is currently verified."}
              </p>
              <p className="muted-copy">
                {nativeRuntimeReport.writableStateRoot
                  ? `Writable state root: ${nativeRuntimeReport.writableStateRoot}`
                  : "No writable local-state root has been verified yet."}
              </p>
              <p className="muted-copy">
                {nativeRuntimeReport.hostSessionEvidencePath
                  ? `Host session evidence: ${nativeRuntimeReport.hostSessionEvidencePath}`
                  : "No host-session evidence file has been captured for this session yet."}
              </p>
            </article>
          </div>
        </section>
      </div>

      <div className="workspace-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Host Verification</p>
              <h3>Command and runtime inputs</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {nativeRuntimeReport.commandStatuses.length > 0 ? (
              nativeRuntimeReport.commandStatuses.map((commandStatus) => (
                <article key={commandStatus.commandId} className="module-card">
                  <div className="project-card-head">
                    <StatusPill
                      label={commandStatus.available ? "available" : "missing"}
                      tone={commandStatus.available ? "success" : "warning"}
                    />
                    {commandStatus.versionText ? (
                      <StatusPill label={commandStatus.versionText} tone="info" />
                    ) : null}
                  </div>
                  <p className="module-card-title">{commandStatus.commandId}</p>
                  <p className="body-copy">{commandStatus.summary}</p>
                  <p className="muted-copy">
                    {commandStatus.resolvedPath ?? "No resolved host command path recorded yet."}
                  </p>
                </article>
              ))
            ) : (
              <article className="module-card">
                <p className="module-card-title">No host verification details yet</p>
                <p className="body-copy">
                  Refresh runtime health from the desktop shell to capture host command availability and native capability posture.
                </p>
              </article>
            )}
            {nativeRuntimeReport.verificationEvidence.map((evidence) => (
              <article key={evidence.checkId} className="module-card">
                <div className="project-card-head">
                  <StatusPill
                    label={evidence.status}
                    tone={
                      evidence.status === "verified"
                        ? "success"
                        : evidence.status === "partial"
                          ? "warning"
                          : "danger"
                    }
                  />
                </div>
                <p className="module-card-title">{evidence.label}</p>
                <p className="body-copy">{evidence.detail}</p>
              </article>
            ))}
            {nativeRuntimeReport.degradedReasons.map((reason) => (
              <article key={`degraded-reason-${reason}`} className="module-card">
                <p className="module-card-title">Outstanding host/runtime gap</p>
                <p className="body-copy">{reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tool Paths</p>
              <h3>Adapter inputs, not UI dependencies</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {toolDefinitions.map((tool) => (
              <article key={tool.toolId} className="module-card">
                <div className="project-card-head">
                  <StatusPill label={tool.status} tone={toneForIntegrationStatus(tool.status)} />
                  <StatusPill label={tool.runtime} tone="info" />
                </div>
                <p className="module-card-title">{tool.label}</p>
                <p className="body-copy">{tool.description}</p>
                <TextField
                  label="Executable path"
                  placeholder={`e.g. /usr/local/bin/${tool.executableName}`}
                  value={tool.executablePath ?? ""}
                  onChange={(event) => updateToolPath(tool.toolId, event.currentTarget.value.trim() || null)}
                />
                {tool.suggestedExecutablePath ? (
                  <p className="muted-copy">Suggested repo-backed adapter path: {tool.suggestedExecutablePath}</p>
                ) : null}
                <TogglePillGroup
                  ariaLabel={`${tool.label} enabled`}
                  options={[
                    { label: "Enabled", value: "enabled" },
                    { label: "Disabled", value: "disabled" }
                  ]}
                  value={tool.status === "disabled" ? "disabled" : "enabled"}
                  onChange={(value) => setToolEnabled(tool.toolId, value === "enabled")}
                />
                <p className="muted-copy">{tool.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Integration Health</p>
              <h3>Bridge posture and adapter boundaries</h3>
            </div>
          </div>
          <div className="issue-card-list">
            {integrationDefinitions.map((integration) => {
              const health = integrationHealth.find((item) => item.integrationId === integration.integrationId);
              const enabled = appConfig.integrationPreferences.find(
                (item) => item.integrationId === integration.integrationId,
              )?.enabled ?? true;

              return (
                <article key={integration.integrationId} className="module-card">
                  <div className="project-card-head">
                    <StatusPill
                      label={health?.status ?? "needs-config"}
                      tone={toneForIntegrationStatus(health?.status ?? "needs-config")}
                    />
                    <StatusPill label={integration.adapterInterface} tone="info" />
                  </div>
                  <p className="module-card-title">{integration.name}</p>
                  <p className="body-copy">{integration.description}</p>
                  <div className="project-card-meta">
                    <span>{integration.capabilities.join(" · ")}</span>
                    <strong>{health?.configurationState ?? "unconfigured"}</strong>
                  </div>
                  <p className="muted-copy">{health?.issueSummary}</p>
                  <TogglePillGroup
                    ariaLabel={`${integration.name} enabled`}
                    options={[
                      { label: "Enabled", value: "enabled" },
                      { label: "Disabled", value: "disabled" }
                    ]}
                    value={enabled ? "enabled" : "disabled"}
                    onChange={(value) => setIntegrationEnabled(integration.integrationId, value === "enabled")}
                  />
                  <div className="settings-chip-row">
                    {integration.requiredToolIds.map((toolId) => (
                      <StatusPill key={toolId} label={toolId} tone="info" />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
