/** Dedupe streaming catalog rows that share the same provider id. */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Dedupe list entries that share the same id (supports both number and string ids). */
export function dedupeByMalId<T extends { mal_id: number | string }>(items: T[]): T[] {
  const seen = new Set<number | string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.mal_id)) continue;
    seen.add(item.mal_id);
    out.push(item);
  }
  return out;
}
