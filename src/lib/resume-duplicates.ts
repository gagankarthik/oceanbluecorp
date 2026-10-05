// Duplicate files in the resume bank: the same file name and byte size uploaded
// more than once. Only one copy per group is indexed, so the extras never put
// a candidate in matches twice. Pure: shared by the index-all route (what to
// index) and the resume bank page (what to flag and offer to delete), so the
// two always agree on which copy is kept.

export interface BankFileRef {
  key: string;
  fileName: string;
  size: number;
  /** Upload time in ms. The oldest copy is kept when none is indexed yet. */
  uploadedAt: number;
  indexed?: boolean;
}

export interface DuplicateGroup<T extends BankFileRef> {
  groupKey: string;
  /** Keeper first, then the extras oldest first. */
  files: T[];
  keeper: T;
  extras: T[];
}

export function duplicateGroupKey(f: { fileName: string; size: number }): string {
  return `${f.fileName.toLowerCase()}|${f.size}`;
}

/** The copy to keep: an indexed one if any (never re-parse a healthy group), else the oldest. */
export function pickKeeper<T extends BankFileRef>(files: T[]): T {
  const byAge = [...files].sort((a, b) => a.uploadedAt - b.uploadedAt || a.key.localeCompare(b.key));
  return byAge.find((f) => f.indexed) || byAge[0];
}

/** Groups with more than one copy, largest first. */
export function findDuplicateGroups<T extends BankFileRef>(files: T[]): DuplicateGroup<T>[] {
  const byKey = new Map<string, T[]>();
  for (const f of files) {
    const k = duplicateGroupKey(f);
    const list = byKey.get(k);
    if (list) list.push(f);
    else byKey.set(k, [f]);
  }
  const groups: DuplicateGroup<T>[] = [];
  for (const [groupKey, list] of byKey) {
    if (list.length < 2) continue;
    const keeper = pickKeeper(list);
    const extras = list.filter((f) => f !== keeper).sort((a, b) => a.uploadedAt - b.uploadedAt || a.key.localeCompare(b.key));
    groups.push({ groupKey, files: [keeper, ...extras], keeper, extras });
  }
  return groups.sort((a, b) => b.files.length - a.files.length || a.keeper.fileName.localeCompare(b.keeper.fileName));
}

/** Keys worth indexing: every single file, plus the keeper of each duplicate group. */
export function keysToIndex<T extends BankFileRef>(files: T[]): string[] {
  const extras = new Set(findDuplicateGroups(files).flatMap((g) => g.extras.map((f) => f.key)));
  return files.filter((f) => !extras.has(f.key)).map((f) => f.key);
}
