/** Splits a list into consecutive pairs (an odd leftover becomes a single-item tuple). */
export function chunkPairs<T>(items: T[]): Array<[T, T] | [T]> {
  const out: Array<[T, T] | [T]> = [];
  for (let i = 0; i < items.length; i += 2) {
    out.push(i + 1 < items.length ? [items[i], items[i + 1]] : [items[i]]);
  }
  return out;
}

/** Splits plain text into paragraphs on blank lines (CMS textareas are non-rich). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
