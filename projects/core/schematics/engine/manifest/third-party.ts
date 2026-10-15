import { type Change, type Provenance, skipChange, type StepResult } from '../plan/change';
import { declaredRange, type PackageManifest } from './manifest';

/** A package outside the cngx lockstep, added at `range` unless the app already declares it. */
export interface ThirdPartyDependency {
  readonly name: string;
  readonly range: string;
  readonly reason: string;
  /** Added to devDependencies. */
  readonly dev?: boolean;
}

/**
 * Adds a third-party package the app lacks. One the app already declares,
 * at any range, is kept and skipped under the same id and label, so a
 * planned and a skipped run read the same.
 */
export function planThirdPartyDependency(
  manifest: PackageManifest,
  { name, range, reason, dev }: ThirdPartyDependency,
  provenance: Provenance,
): StepResult {
  const change: Change = {
    kind: 'add-dependency',
    id: `dependency:${name}`,
    label: `Add ${name}@${range}`,
    reason,
    provenance,
    name,
    version: range,
    ...(dev === true ? { dev } : {}),
  };
  const existing = declaredRange(manifest, name);
  if (existing !== undefined) {
    return { changes: [], skipped: [skipChange(change, `already declared as ${existing}`)] };
  }
  return { changes: [change], skipped: [] };
}
