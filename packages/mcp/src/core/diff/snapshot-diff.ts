// The pure, in-process diff over two loaded `DocsIndex` snapshots. No loader change:
// each snapshot is loaded through the existing `loadDocsFromFile` (loader.ts:71) by
// the caller, and this module walks the parsed entries and emits the categorized
// `UsageDelta`. Renames are inferred only where a category has a structural
// fingerprint strong enough to trust: a top-level entry (lib + input/output
// name-sets) or a slot (its full description). A leaf member keyed only by a bare
// type (an input/output/token) is NOT rename-inferred - an unrelated same-typed
// add/remove pair would masquerade as a rename - so it reports the removal and
// leaves the add unsurfaced; only a changed alias on the same class field is a
// (certain) member rename. Newly-added symbols never break existing usage.

import type { DocsIndex } from '../data/loader.js';
import { normalizeSlots } from '../data/slots.js';
import type { DocEntry, DocInput, DocOutput } from '../data/types.js';
import { entryLib } from '../query.js';
import type {
  CategoryDelta,
  RemovedEntry,
  RenamedEntry,
  SignatureChangedEntry,
  UsageDelta,
} from './types.js';

interface Named {
  name: string;
}

interface DiffOptions<T extends Named> {
  /** Same-name entries whose signature differs are a signature change. */
  signatureOf: (item: T) => string;
  /**
   * Two entries with the same rename key are a rename candidate. Omit to disable
   * rename inference for a category whose only key would be a weak one (a bare
   * type): such a category reports the removal and leaves the add unsurfaced,
   * rather than pairing an unrelated same-typed add/remove into a false rename.
   * Returns `null` for an item that has no trustworthy key of its own.
   */
  renameKeyOf?: (item: T) => string | null;
  /** The owning artifact for a member-level diff; absent for a top-level diff. */
  owner?: string;
  /** The name a consumer writes, which entries are matched and reported by. Defaults to `name`. */
  keyOf?: (item: T) => string;
  /**
   * The class field behind a public name. A removed and an added item with the
   * same field are one member whose alias changed: a certain rename, paired before
   * any rename-key inference.
   */
  fieldOf?: (item: T) => string;
  /** Marks every rename-key pairing as inferred; set where the key is a shape, not an identity. */
  inferred?: boolean;
}

/** How many items carry each non-null rename key. */
function countKeys<T>(items: T[], renameKeyOf: ((item: T) => string | null) | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = renameKeyOf?.(item) ?? null;
    if (key !== null) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/** Diff two lists of named entries into the removed/renamed/signatureChanged shape. */
function diffNamedList<T extends Named>(from: T[], to: T[], options: DiffOptions<T>): CategoryDelta {
  const { renameKeyOf, signatureOf, owner, keyOf = (item: T) => item.name, fieldOf, inferred } = options;
  const toByName = new Map(to.map((item) => [keyOf(item), item]));
  const fromNames = new Set(from.map(keyOf));

  const removed: RemovedEntry[] = [];
  const renamed: RenamedEntry[] = [];
  const signatureChanged: SignatureChangedEntry[] = [];

  const unmatchedFrom: T[] = [];
  for (const item of from) {
    const match = toByName.get(keyOf(item));
    if (!match) {
      unmatchedFrom.push(item);
      continue;
    }
    const fromSignature = signatureOf(item);
    const toSignature = signatureOf(match);
    if (fromSignature !== toSignature) {
      signatureChanged.push({ name: keyOf(item), owner, fromSignature, toSignature });
    }
  }

  // Rename inference pool: entries new to `to` a removed entry can be paired with.
  // Only when this category carries a trustworthy rename key; otherwise every
  // unmatched removal is reported as removed, never guessed into a rename.
  // A rename is inferred only when exactly one removed and exactly one added item share
  // the key; any ambiguity stays a removal, so the answer never depends on snapshot order.
  const addedItems = to.filter((item) => !fromNames.has(keyOf(item)));
  const removedKeyCount = countKeys(unmatchedFrom, renameKeyOf);
  const addedKeyCount = countKeys(addedItems, renameKeyOf);
  const removedFieldCount = countKeys(unmatchedFrom, fieldOf);
  const addedFieldCount = countKeys(addedItems, fieldOf);
  for (const gone of unmatchedFrom) {
    const field = fieldOf?.(gone) ?? null;
    if (fieldOf && field !== null && removedFieldCount.get(field) === 1 && addedFieldCount.get(field) === 1) {
      const target = addedItems.find((item) => fieldOf(item) === field)!;
      renamed.push({ from: keyOf(gone), to: keyOf(target), owner });
      const fromSignature = signatureOf(gone);
      const toSignature = signatureOf(target);
      if (fromSignature !== toSignature) {
        signatureChanged.push({ name: keyOf(target), owner, fromSignature, toSignature });
      }
      continue;
    }
    const key = renameKeyOf?.(gone) ?? null;
    if (renameKeyOf && key !== null && removedKeyCount.get(key) === 1 && addedKeyCount.get(key) === 1) {
      const target = addedItems.find((item) => renameKeyOf(item) === key)!;
      renamed.push({ from: keyOf(gone), to: keyOf(target), owner, ...(inferred ? { inferred: true as const } : {}) });
      continue;
    }
    removed.push({ name: keyOf(gone), owner });
  }

  return { removed, renamed, signatureChanged };
}

/**
 * A component/directive rename keeps its lib and its input/output name sets. The
 * lib comes from `file`, which schema 2 and schema 6 produce identically; the
 * schema-6 `category` is derived at a different granularity, so a cross-schema
 * diff keyed on it would miss renames.
 */
function entryShapeKey(entry: DocEntry): string | null {
  const inputs = (entry.inputsClass ?? []).map((input) => input.name).sort().join(',');
  const outputs = (entry.outputsClass ?? []).map((output) => output.name).sort().join(',');
  // No inputs and no outputs is no shape at all: every host-only directive of a lib
  // would share the key `lib||`, so a pairing would be a guess, not an inference.
  if (inputs === '' && outputs === '') {
    return null;
  }
  return `${entryLib(entry) ?? ''}|${inputs}|${outputs}`;
}

const selectorOf = (entry: DocEntry): string => entry.selector ?? '';

/** A consumer binds the alias, so the alias is the API; the class field is an implementation detail. */
const publicNameOf = (member: DocInput | DocOutput): string => member.alias ?? member.name;

/** The class field, which stays put when only the alias is added, removed or changed. */
const fieldNameOf = (member: DocInput | DocOutput): string => member.name;

/** An input's binding contract: its type, whether a binding is required, and its signal kind. */
function inputSignatureOf(input: DocInput): string {
  const flags = [input.required === true ? 'required' : '', input.signalKind ?? ''].filter((flag) => flag !== '');
  return flags.length === 0 ? (input.type ?? '') : `${input.type ?? ''} (${flags.join(', ')})`;
}

/** Pair entries present under the same name in both snapshots (skips renamed pairs). */
function matchedByName(from: DocEntry[], to: DocEntry[]): [DocEntry, DocEntry][] {
  const toByName = new Map(to.map((entry) => [entry.name, entry]));
  const pairs: [DocEntry, DocEntry][] = [];
  for (const entry of from) {
    const match = toByName.get(entry.name);
    if (match) {
      pairs.push([entry, match]);
    }
  }
  return pairs;
}

function mergeCategoryDeltas(deltas: CategoryDelta[]): CategoryDelta {
  return {
    removed: deltas.flatMap((delta) => delta.removed),
    renamed: deltas.flatMap((delta) => delta.renamed),
    signatureChanged: deltas.flatMap((delta) => delta.signatureChanged),
  };
}

/**
 * Entries kept under the same name whose kind flipped between component and
 * directive. Each is a kind change (plus a selector change when that moved too),
 * never a removal, and its members are diffed like any matched entry.
 */
function kindChanges(fromDocs: DocsIndex, toDocs: DocsIndex): { pairs: [DocEntry, DocEntry][]; delta: CategoryDelta } {
  const flips = [
    ...matchedByName(fromDocs.components, toDocs.directives).map((pair) => ({ pair, kinds: ['component', 'directive'] })),
    ...matchedByName(fromDocs.directives, toDocs.components).map((pair) => ({ pair, kinds: ['directive', 'component'] })),
  ];
  const signatureChanged = flips.flatMap(({ pair: [from, to], kinds: [fromKind, toKind] }) => [
    { name: from.name, fromSignature: fromKind, toSignature: toKind },
    ...(selectorOf(from) === selectorOf(to) ? [] : [{ name: from.name, fromSignature: selectorOf(from), toSignature: selectorOf(to) }]),
  ]);
  return { pairs: flips.map(({ pair }) => pair), delta: { removed: [], renamed: [], signatureChanged } };
}

export function diffSnapshots(fromDocs: DocsIndex, toDocs: DocsIndex): UsageDelta {
  // A component that became a directive (or back) keeps its name: pulled out of
  // the per-kind lists so it is neither removed nor paired into a rename.
  const kindChanged = kindChanges(fromDocs, toDocs);
  const flipped = new Set(kindChanged.pairs.map(([from]) => from.name));
  const stay = (entries: DocEntry[]) => entries.filter((entry) => !flipped.has(entry.name));

  // Top-level artifacts diffed within kind so a component never pairs with a
  // directive of the same shape (the conservative "same kind" rename constraint).
  // Injectables carry no selector and no input/output sets, so no rename key is
  // strong enough: a removed service reports as removed, never as a rename.
  const entryOptions = { renameKeyOf: entryShapeKey, signatureOf: selectorOf, inferred: true };
  const components = mergeCategoryDeltas([
    diffNamedList(stay(fromDocs.components), stay(toDocs.components), entryOptions),
    diffNamedList(stay(fromDocs.directives), stay(toDocs.directives), entryOptions),
    kindChanged.delta,
    diffNamedList(fromDocs.injectables, toDocs.injectables, { signatureOf: () => '' }),
  ]);

  // Member deltas only for artifacts present under the same name in both snapshots.
  // A renamed artifact is already reported above; the consumer re-checks its API via
  // the read-only MCP tools, so its members are not re-diffed here.
  const matchedPairs = [
    ...matchedByName(fromDocs.components, toDocs.components),
    ...matchedByName(fromDocs.directives, toDocs.directives),
    ...kindChanged.pairs,
  ];

  // inputs/outputs/tokens: keyed only by a bare type, so no rename inference -
  // a removed member is reported as removed, never paired into a false rename.
  // Inputs and outputs are matched and reported by their public (alias) name; a
  // changed alias on the same class field is a rename from the old public name.
  const inputs = mergeCategoryDeltas(
    matchedPairs.map(([from, to]) =>
      diffNamedList(from.inputsClass ?? [], to.inputsClass ?? [], {
        signatureOf: inputSignatureOf,
        keyOf: publicNameOf,
        fieldOf: fieldNameOf,
        owner: from.name,
      }),
    ),
  );

  const outputs = mergeCategoryDeltas(
    matchedPairs.map(([from, to]) =>
      diffNamedList(from.outputsClass ?? [], to.outputsClass ?? [], {
        signatureOf: (output) => output.type ?? '',
        keyOf: publicNameOf,
        fieldOf: fieldNameOf,
        owner: from.name,
      }),
    ),
  );

  // slots carry a full description, a strong enough fingerprint to rename-infer on.
  const slots = mergeCategoryDeltas(
    matchedPairs.map(([from, to]) =>
      diffNamedList(normalizeSlots(from.slots), normalizeSlots(to.slots), {
        // An empty description fingerprints nothing; such a slot is never rename-inferred.
        renameKeyOf: (slot) => (slot.description.trim() === '' ? null : slot.description),
        signatureOf: (slot) => slot.description,
        owner: from.name,
      }),
    ),
  );

  // `type` is the constant "token" on real data; the value type lives in `tokenType`.
  const diTokens = diffNamedList(fromDocs.tokens, toDocs.tokens, {
    signatureOf: (token) => token.tokenType ?? token.type ?? '',
  });

  const resolvedFrom = fromDocs.meta.cngxVersion;
  const resolvedTo = toDocs.meta.cngxVersion;

  return {
    ok: true,
    meta: {
      from: resolvedFrom ?? 'unknown',
      to: resolvedTo ?? 'unknown',
      resolvedFrom,
      resolvedTo,
    },
    components,
    inputs,
    outputs,
    slots,
    diTokens,
  };
}
