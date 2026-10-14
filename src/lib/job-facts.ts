/** Location, workplace, type and practice, minus blanks and repeats ("Remote" is often both place and workplace). */
export function jobFacts(j: { location: string; workplace: string; type: string; practice?: string }): string[] {
  const seen = new Set<string>();
  return [j.location, j.workplace, j.type, j.practice ?? ""].filter((v) => {
    const k = v.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
