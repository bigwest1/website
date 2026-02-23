declare global {
  // eslint-disable-next-line no-var
  var __contactRateStore: Map<string, { count: number; expiresAt: number }> | undefined;
}

export {};
