function normalizeSlashes(value: string) {
  return value.replace(/\\/g, "/");
}

export function normalizePath(value: string) {
  if (!value) {
    return "";
  }

  const normalized = normalizeSlashes(value).replace(/\/{2,}/g, "/");
  return normalized.length > 1 ? normalized.replace(/\/+$/g, "") : normalized;
}

export function joinPath(...parts: string[]) {
  const filtered = parts
    .map((part) => normalizeSlashes(part).trim())
    .filter((part) => part.length > 0);

  if (filtered.length === 0) {
    return "";
  }

  const first = filtered[0]!;
  const rest = filtered.slice(1);
  let joined = first.replace(/\/+$/g, "");

  for (const part of rest) {
    joined = `${joined}/${part.replace(/^\/+/g, "").replace(/\/+$/g, "")}`;
  }

  return normalizePath(joined);
}

export function dirnamePath(filePath: string) {
  const normalized = normalizePath(filePath);
  const boundary = normalized.lastIndexOf("/");

  if (boundary < 0) {
    return ".";
  }

  if (boundary === 0) {
    return "/";
  }

  return normalized.slice(0, boundary);
}
