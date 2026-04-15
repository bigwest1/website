import { installDesignTokenStyles } from "@course-creator-os/design-tokens";

const UI_STYLE_ID = "cco-ui-foundation";

export function createUiFoundationCss() {
  return `
.cco-ui-surface {
  position: relative;
  border: 1px solid var(--cco-border-default);
  border-radius: var(--cco-radius-lg);
  background: linear-gradient(180deg, rgba(16, 31, 57, 0.94) 0%, rgba(10, 22, 43, 0.96) 100%);
  box-shadow: var(--cco-shadow-md);
  backdrop-filter: blur(18px);
}

.cco-ui-surface[data-tone="raised"] {
  background: linear-gradient(180deg, rgba(21, 39, 68, 0.96) 0%, rgba(12, 24, 45, 0.98) 100%);
  box-shadow: var(--cco-shadow-lg);
}

.cco-ui-surface[data-tone="contrast"] {
  background: linear-gradient(180deg, rgba(8, 21, 36, 0.98) 0%, rgba(6, 16, 28, 0.98) 100%);
}

.cco-ui-surface[data-tone="ghost"] {
  background: rgba(255, 255, 255, 0.02);
  box-shadow: none;
}

.cco-ui-surface[data-border="subtle"] {
  border-color: var(--cco-border-subtle);
}

.cco-ui-surface[data-border="accent"] {
  border-color: var(--cco-border-accent);
}

.cco-ui-surface[data-border="strong"] {
  border-color: var(--cco-border-strong);
}

.cco-ui-stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cco-ui-inline {
  display: flex;
  min-width: 0;
}

.cco-ui-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--cco-space-4);
  margin-bottom: var(--cco-space-4);
}

.cco-ui-section-header-copy {
  display: flex;
  flex-direction: column;
  gap: var(--cco-space-2);
  min-width: 0;
}

.cco-ui-eyebrow {
  margin: 0;
  color: var(--cco-accent-primary);
  text-transform: uppercase;
  letter-spacing: var(--cco-font-tracking-wide);
  font-size: var(--cco-font-size-xs);
  font-weight: var(--cco-font-weight-semibold);
}

.cco-ui-section-header h3,
.cco-ui-empty-state h3 {
  margin: 0;
  color: var(--cco-text-primary);
  font-size: var(--cco-font-size-xl);
  line-height: var(--cco-font-lineHeight-snug);
}

.cco-ui-section-description {
  margin: 0;
  color: var(--cco-text-secondary);
  line-height: var(--cco-font-lineHeight-normal);
}

.cco-ui-metric-chip {
  display: flex;
  flex-direction: column;
  gap: var(--cco-space-2);
  padding: var(--cco-space-4);
  border-radius: var(--cco-radius-md);
  border: 1px solid var(--cco-border-default);
  background: linear-gradient(180deg, rgba(18, 37, 67, 0.92), rgba(11, 23, 42, 0.94));
}

.cco-ui-metric-chip[data-tone="accent"] {
  border-color: var(--cco-border-accent);
}

.cco-ui-metric-chip[data-tone="info"] {
  background: var(--cco-validation-info-background);
  border-color: var(--cco-validation-info-border);
}

.cco-ui-metric-chip[data-tone="success"] {
  background: var(--cco-validation-success-background);
  border-color: var(--cco-validation-success-border);
}

.cco-ui-metric-chip[data-tone="warning"] {
  background: var(--cco-validation-warning-background);
  border-color: var(--cco-validation-warning-border);
}

.cco-ui-metric-chip[data-tone="error"] {
  background: var(--cco-validation-error-background);
  border-color: var(--cco-validation-error-border);
}

.cco-ui-metric-label {
  display: block;
  color: var(--cco-text-tertiary);
  font-size: var(--cco-font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--cco-font-tracking-wide);
}

.cco-ui-metric-value {
  color: var(--cco-text-primary);
  font-size: 1.3rem;
  line-height: var(--cco-font-lineHeight-snug);
}

.cco-ui-metric-note {
  color: var(--cco-text-secondary);
  font-size: var(--cco-font-size-sm);
}

.cco-ui-context-toolbar {
  display: flex;
  align-items: center;
  gap: var(--cco-space-3);
  border: 1px solid var(--cco-border-subtle);
  background: rgba(255, 255, 255, 0.03);
}

.cco-ui-empty-state {
  text-align: left;
}

.cco-ui-empty-state-action {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cco-space-3);
}

.cco-ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 var(--cco-space-3);
  border-radius: var(--cco-radius-pill);
  border: 1px solid var(--cco-border-default);
  background: rgba(255, 255, 255, 0.04);
  color: var(--cco-text-secondary);
  font-size: var(--cco-font-size-xs);
  font-weight: var(--cco-font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.cco-ui-badge[data-tone="accent"] {
  background: var(--cco-accent-quiet);
  border-color: var(--cco-border-accent);
  color: var(--cco-text-primary);
}

.cco-ui-badge[data-tone="info"] {
  background: var(--cco-validation-info-background);
  border-color: var(--cco-validation-info-border);
  color: var(--cco-validation-info-text);
}

.cco-ui-badge[data-tone="success"] {
  background: var(--cco-validation-success-background);
  border-color: var(--cco-validation-success-border);
  color: var(--cco-validation-success-text);
}

.cco-ui-badge[data-tone="warning"] {
  background: var(--cco-validation-warning-background);
  border-color: var(--cco-validation-warning-border);
  color: var(--cco-validation-warning-text);
}

.cco-ui-badge[data-tone="error"] {
  background: var(--cco-validation-error-background);
  border-color: var(--cco-validation-error-border);
  color: var(--cco-validation-error-text);
}

.cco-ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cco-space-2);
  min-height: 44px;
  padding: 0 var(--cco-space-4);
  border-radius: var(--cco-radius-md);
  border: 1px solid var(--cco-border-default);
  background: rgba(255, 255, 255, 0.04);
  color: var(--cco-text-primary);
  font-weight: var(--cco-font-weight-semibold);
  cursor: pointer;
  transition:
    transform var(--cco-motion-fast) var(--cco-motion-ease),
    background var(--cco-motion-fast) var(--cco-motion-ease),
    border-color var(--cco-motion-fast) var(--cco-motion-ease),
    box-shadow var(--cco-motion-fast) var(--cco-motion-ease);
}

.cco-ui-button:hover {
  transform: translateY(-1px);
}

.cco-ui-button:focus-visible,
.cco-ui-field-control:focus-visible,
.cco-ui-toggle-option:focus-visible {
  outline: none;
  box-shadow: var(--cco-focus-ring);
  border-color: var(--cco-border-accent);
}

.cco-ui-button[data-tone="primary"] {
  background: linear-gradient(135deg, rgba(77, 163, 255, 0.3), rgba(35, 140, 255, 0.2));
  border-color: var(--cco-border-accent);
}

.cco-ui-button[data-tone="secondary"] {
  background: rgba(255, 255, 255, 0.04);
}

.cco-ui-button[data-tone="ghost"] {
  background: transparent;
  border-color: var(--cco-border-subtle);
}

.cco-ui-button[data-tone="danger"] {
  background: rgba(255, 122, 110, 0.14);
  border-color: var(--cco-validation-error-border);
}

.cco-ui-button[data-size="sm"] {
  min-height: 36px;
  padding: 0 var(--cco-space-3);
  font-size: var(--cco-font-size-sm);
}

.cco-ui-button[data-size="lg"] {
  min-height: 52px;
  padding: 0 var(--cco-space-6);
}

.cco-ui-field {
  display: flex;
  flex-direction: column;
  gap: var(--cco-space-2);
  min-width: 0;
}

.cco-ui-field-label {
  color: var(--cco-text-primary);
  font-size: var(--cco-font-size-sm);
  font-weight: var(--cco-font-weight-semibold);
}

.cco-ui-field-required,
.cco-ui-field-error {
  color: var(--cco-state-error);
}

.cco-ui-field-hint {
  color: var(--cco-text-tertiary);
  font-size: var(--cco-font-size-sm);
  line-height: var(--cco-font-lineHeight-normal);
}

.cco-ui-field-control {
  width: 100%;
  border: 1px solid var(--cco-border-default);
  border-radius: var(--cco-radius-md);
  background: rgba(255, 255, 255, 0.03);
  color: var(--cco-text-primary);
  padding: 12px 14px;
  font-size: var(--cco-font-size-md);
  transition:
    border-color var(--cco-motion-fast) var(--cco-motion-ease),
    background var(--cco-motion-fast) var(--cco-motion-ease),
    box-shadow var(--cco-motion-fast) var(--cco-motion-ease);
}

.cco-ui-field-control::placeholder {
  color: var(--cco-text-tertiary);
}

.cco-ui-field-control:hover {
  border-color: var(--cco-border-strong);
}

.cco-ui-textarea {
  resize: vertical;
  min-height: 120px;
}

.cco-ui-toggle-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px;
  border-radius: var(--cco-radius-md);
  border: 1px solid var(--cco-border-subtle);
  background: rgba(255, 255, 255, 0.03);
}

.cco-ui-toggle-option {
  min-height: 34px;
  padding: 0 var(--cco-space-3);
  border-radius: 14px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--cco-text-secondary);
  cursor: pointer;
  transition:
    background var(--cco-motion-fast) var(--cco-motion-ease),
    color var(--cco-motion-fast) var(--cco-motion-ease),
    border-color var(--cco-motion-fast) var(--cco-motion-ease);
}

.cco-ui-toggle-option[data-active="true"] {
  background: linear-gradient(135deg, rgba(77, 163, 255, 0.18), rgba(25, 40, 67, 0.58));
  border-color: var(--cco-border-accent);
  color: var(--cco-text-primary);
}

@media (max-width: 1100px) {
  .cco-ui-section-header {
    flex-direction: column;
  }

  .cco-ui-split-pane {
    grid-template-columns: 1fr !important;
  }
}
`;
}

export function installUiFoundationStyles(doc: Document = document) {
  installDesignTokenStyles(doc);

  const existing = doc.getElementById(UI_STYLE_ID);
  const css = createUiFoundationCss();

  if (existing instanceof HTMLStyleElement) {
    existing.textContent = css;
    return;
  }

  const styleTag = doc.createElement("style");
  styleTag.id = UI_STYLE_ID;
  styleTag.textContent = css;
  doc.head.appendChild(styleTag);
}

export const installCourseCreatorUiStyles = installUiFoundationStyles;
