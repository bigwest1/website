import { designTokens, type DesignTokens } from "./tokens";

type TokenTree = {
  [key: string]: string | TokenTree;
};

function flattenTokens(
  target: Record<string, string>,
  prefix: string,
  value: string | TokenTree,
): void {
  if (typeof value === "string") {
    target[prefix] = value;
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    flattenTokens(target, `${prefix}-${key}`, nestedValue);
  }
}

export function createCssVariableMap(tokens: DesignTokens = designTokens) {
  const flattened: Record<string, string> = {};

  for (const [group, value] of Object.entries(tokens)) {
    flattenTokens(flattened, `--cco-${group}`, value);
  }

  return flattened;
}

export function createCssVariableBlock(tokens: DesignTokens = designTokens) {
  const variables = createCssVariableMap(tokens);
  const lines = Object.entries(variables).map(([key, value]) => `  ${key}: ${value};`);

  return `:root {\n${lines.join("\n")}\n}`;
}

export function installDesignTokenStyles(doc: Document = document) {
  const existing = doc.getElementById("cco-design-tokens");
  const css = createCssVariableBlock();

  if (existing instanceof HTMLStyleElement) {
    existing.textContent = css;
    return;
  }

  const styleTag = doc.createElement("style");
  styleTag.id = "cco-design-tokens";
  styleTag.textContent = css;
  doc.head.appendChild(styleTag);
}

