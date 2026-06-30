export function roundCoord(n: number, decimals: number) {
  const m = 10 ** decimals;
  return Math.round(n * m) / m;
}

export function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

export function makeCacheKey(prefix: string, params: unknown): string {
  return `${prefix}:${stableStringify(params)}`;
}
