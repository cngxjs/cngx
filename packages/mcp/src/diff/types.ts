// The typed API delta `migrate_usage` returns between two cngx release snapshots.
// Grouped by API category (components/directives, inputs, outputs, slots, DI
// tokens); each category carries only what a consumer must react to on upgrade -
// a symbol that vanished, one inferred to be renamed, or one kept under a stable
// name whose signature changed. Newly-added symbols are deliberately not surfaced:
// an upgrade never forces a consumer to adopt a new symbol, so the delta reports
// only what breaks existing usage.

/** A symbol present in the `from` snapshot but absent from `to`. */
export interface RemovedEntry {
  name: string;
  /** The owning component/directive for a member entry; absent for a top-level entry. */
  owner?: string;
}

/** A symbol conservatively inferred to be the same API under a new name. */
export interface RenamedEntry {
  from: string;
  to: string;
  owner?: string;
}

/** A symbol kept under the same name whose type/signature changed across the two snapshots. */
export interface SignatureChangedEntry {
  name: string;
  owner?: string;
  fromSignature: string;
  toSignature: string;
}

/** The three ways a symbol in one category can break a consumer on upgrade. */
export interface CategoryDelta {
  removed: RemovedEntry[];
  renamed: RenamedEntry[];
  signatureChanged: SignatureChangedEntry[];
}

/**
 * Which two releases the delta spans. `from`/`to` are the requested versions;
 * `resolvedFrom`/`resolvedTo` are the `cngxVersion` each loaded snapshot actually
 * carried (`null` for an un-stamped raw export).
 */
export interface UsageDeltaMeta {
  from: string;
  to: string;
  resolvedFrom: string | null;
  resolvedTo: string | null;
}

/** The successful, structured cross-version delta. */
export interface UsageDelta {
  ok: true;
  meta: UsageDeltaMeta;
  components: CategoryDelta;
  inputs: CategoryDelta;
  outputs: CategoryDelta;
  slots: CategoryDelta;
  diTokens: CategoryDelta;
}

/** Why a non-bundled snapshot could not be obtained. */
export type SnapshotFetchFailureReason = 'gh-missing' | 'network' | 'asset-missing';

/**
 * A fetch/resolve failure surfaced as data, never thrown across the tool boundary -
 * the server's don't-crash-stdout contract requires the tool answer, not throw.
 */
export interface UsageDeltaError {
  ok: false;
  meta: { from: string; to: string };
  reason: SnapshotFetchFailureReason;
  message: string;
}

/** What `migrate_usage` resolves to: a structured delta or a typed failure. */
export type MigrateUsageResult = UsageDelta | UsageDeltaError;
