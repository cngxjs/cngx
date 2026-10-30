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

/**
 * A symbol under a new name. A member whose class field stayed while its public
 * name (alias) changed is a certain rename; a top-level entry paired only by its
 * lib and binding shape is an inference and carries `inferred: true`.
 */
export interface RenamedEntry {
  from: string;
  to: string;
  owner?: string;
  inferred?: true;
}

/** A symbol kept under the same name whose type/signature changed across the two snapshots. */
export interface SignatureChangedEntry {
  name: string;
  owner?: string;
  fromSignature: string;
  toSignature: string;
  /** For an input, which parts of its binding contract changed, in this order; absent in every other category. */
  changed?: readonly InputChangedPart[];
}

/** A part of an input's binding contract, as an input change names it. */
export type InputChangedPart = 'type' | 'required' | 'binding kind';

/** The three ways a symbol in one category can break a consumer on upgrade. */
export interface CategoryDelta {
  removed: RemovedEntry[];
  renamed: RenamedEntry[];
  signatureChanged: SignatureChangedEntry[];
}

/**
 * Which two releases the delta spans. `from`/`to` are the requested versions
 * (`to` defaults to the bundled release). `resolvedFrom`/`resolvedTo` name the
 * release each side answered as: the `cngxVersion` of the resolved snapshot,
 * else the normalised requested version, since a fetched asset is the version
 * it was requested as.
 */
export interface UsageDeltaMeta {
  from: string;
  to: string;
  resolvedFrom: string;
  resolvedTo: string;
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

/** The per-category part of a {@link UsageDelta}: what the pure diff returns. */
export type UsageDeltaCategories = Omit<UsageDelta, 'ok' | 'meta'>;

/** Why a non-bundled snapshot could not be obtained. */
export type SnapshotFetchFailureReason = 'gh-missing' | 'network' | 'asset-missing' | 'invalid-version';

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
