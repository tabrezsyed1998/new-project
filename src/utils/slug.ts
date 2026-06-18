/** Convert a free-text name into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Given a desired base slug and a predicate that checks whether a slug is
 * already taken, returns a unique slug by appending an incrementing suffix.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let counter = 2;

  while (await exists(candidate)) {
    candidate = `${root}-${counter}`;
    counter += 1;
  }

  return candidate;
}
