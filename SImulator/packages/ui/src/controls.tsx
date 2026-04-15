import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

import type { ValidationTone } from "@course-creator-os/design-tokens";

import { cx } from "./utils";

export type BadgeTone = "default" | ValidationTone | "accent";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span className={cx("cco-ui-badge", className)} data-tone={tone}>
      {children}
    </span>
  );
}

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  size?: ButtonSize;
};

export function Button({
  children,
  className,
  tone = "secondary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button className={cx("cco-ui-button", className)} data-tone={tone} data-size={size} type={type} {...props}>
      {children}
    </button>
  );
}

type FieldShellProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

function FieldShell({ label, hint, error, required = false, children }: FieldShellProps) {
  return (
    <label className="cco-ui-field">
      {label ? (
        <span className="cco-ui-field-label">
          {label}
          {required ? <span className="cco-ui-field-required">*</span> : null}
        </span>
      ) : null}
      {hint ? <span className="cco-ui-field-hint">{hint}</span> : null}
      {children}
      {error ? <span className="cco-ui-field-error">{error}</span> : null}
    </label>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function TextField({ className, label, hint, error, required, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      <input className={cx("cco-ui-field-control", "cco-ui-input", className)} required={required} {...props} />
    </FieldShell>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function SelectField({
  className,
  label,
  hint,
  error,
  options,
  placeholder,
  required,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      <select
        className={cx("cco-ui-field-control", "cco-ui-select", className)}
        required={required}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({
  className,
  label,
  hint,
  error,
  required,
  rows = 5,
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      <textarea
        className={cx("cco-ui-field-control", "cco-ui-textarea", className)}
        required={required}
        rows={rows}
        {...props}
      />
    </FieldShell>
  );
}

type ToggleOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type TogglePillGroupProps<TValue extends string> = {
  options: ToggleOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
  className?: string;
};

export function TogglePillGroup<TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className
}: TogglePillGroupProps<TValue>) {
  return (
    <div className={cx("cco-ui-toggle-group", className)} aria-label={ariaLabel} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={value === option.value}
          className="cco-ui-toggle-option"
          data-active={value === option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
