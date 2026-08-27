// The pure, in-process diff over two loaded `DocsIndex` snapshots. No loader change:
// each snapshot is loaded through the existing `loadDocsFromFile` (loader.ts:71) by
// the caller, and this module walks the parsed entries and emits the categorized
// `UsageDelta`. Renames are inferred only where a category has a structural
// fingerprint strong enough to trust: a top-level entry (category + input/output
// name-sets) or a slot (its full description). A leaf member keyed only by a bare
// type (an input/output/token) is NOT rename-inferred - an unrelated same-typed
// add/remove pair would masquerade as a rename - so it reports the removal and
// leaves the add unsurfaced. Newly-added symbols never break existing usage.

import type { DocsIndex } from '../data/loader.js';
import type { DocEntry } from '../data/types.js';
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
   */
  renameKeyOf?: (item: T) => string;
  /** The owning artifact for a member-level diff; absent for a top-level diff. */
  owner?: string;
}

/** Diff two lists of named entries into the removed/renamed/signatureChanged shape. */
function diffNamedList<T extends Named>(from: T[], to: T[], options: DiffOptions<T>): CategoryDelta {
  const { renameKeyOf, signatureOf, owner } = options;
  const toByName = new Map(to.map((item) => [item.name, item]));
  const fromNames = new Set(from.map((item) => item.name));

  const removed: RemovedEntry[] = [];
  const renamed: RenamedEntry[] = [];
  const signatureChanged: SignatureChangedEntry[] = [];

  const unmatchedFrom: T[] = [];
  for (const item of from) {
    const match = toByName.get(item.name);
    if (!match) {
      unmatchedFrom.push(item);
      continue;
    }
    const fromSignature = signatureOf(item);
    const toSignature = signatureOf(match);
    if (fromSignature !== toSignature) {
      signatureChanged.push({ name: item.name, owner, fromSignature, toSignature });
    }
  }

  // Rename inference pool: entries new to `to` a removed entry can be paired with.
  // Only when this category carries a trustworthy rename key; otherwise every
  // unmatched removal is reported as removed, never guessed into a rename.
  const addedItems = to.filter((item) => !fromNames.has(item.name));
  for (const gone of unmatchedFrom) {
    if (renameKeyOf) {
      const key = renameKeyOf(gone);
      const candidates = addedItems.filter((item) => renameKeyOf(item) === key);
      if (candidates.length === 1) {
        const target = candidates[0];
        renamed.push({ from: gone.name, to: target.name, owner });
        addedItems.splice(addedItems.indexOf(target), 1);
        continue;
      }
    }
    removed.push({ name: gone.name, owner });
  }

  return { removed, renamed, signatureChanged };
}

/** A component/directive rename keeps its category and its input/output name sets. */
function entryShapeKey(entry: DocEntry): string {
  const inputs = (entry.inputsClass ?? []).map((input) => input.name).sort().join(',');
  const outputs = (entry.outputsClass ?? []).map((output) => output.name).sort().join(',');
  return `${entry.category ?? ''}|${inputs}|${outputs}`;
}

const selectorOf = (entry: DocEntry): string => entry.selector ?? '';

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

export function diffSnapshots(fromDocs: DocsIndex, toDocs: DocsIndex): UsageDelta {
  // Top-level artifacts diffed within kind so a component never pairs with a
  // directive of the same shape (the conservative "same kind" rename constraint).
  // Injectables carry no selector and no input/output sets, so no rename key is
  // strong enough: a removed service reports as removed, never as a rename.
  const components = mergeCategoryDeltas([
    diffNamedList(fromDocs.components, toDocs.components, { renameKeyOf: entryShapeKey, signatureOf: selectorOf }),
    diffNamedList(fromDocs.directives, toDocs.directives, { renameKeyOf: entryShapeKey, signatureOf: selectorOf }),
    diffNamedList(fromDocs.injectables, toDocs.injectables, { signatureOf: () => '' }),
  ]);

  // Member deltas only for artifacts present under the same name in both snapshots.
  // A renamed artifact is already reported above; the consumer re-checks its API via
  // the read-only MCP tools, so its members are not re-diffed here.
  const matchedPairs = [
    ...matchedByName(fromDocs.components, toDocs.components),
    ...matchedByName(fromDocs.directives, toDocs.directives),
  ];

  // inputs/outputs/tokens: keyed only by a bare type, so no rename inference -
  // a removed member is reported as removed, never paired into a false rename.
  const inputs = mergeCategoryDeltas(
    matchedPairs.map(([from, to]) =>
      diffNamedList(from.inputsClass ?? [], to.inputsClass ?? [], {
        signatureOf: (input) => input.type ?? '',
        owner: from.name,
      }),
    ),
  );

  const outputs = mergeCategoryDeltas(
    matchedPairs.map(([from, to]) =>
      diffNamedList(from.outputsClass ?? [], to.outputsClass ?? [], {
        signatureOf: (output) => output.type ?? '',
        owner: from.name,
      }),
    ),
  );

  // slots carry a full description, a strong enough fingerprint to rename-infer on.
  const slots = mergeCategoryDeltas(
    matchedPairs.map(([from, to]) =>
      diffNamedList(from.slots ?? [], to.slots ?? [], {
        renameKeyOf: (slot) => slot.description,
        signatureOf: (slot) => slot.description,
        owner: from.name,
      }),
    ),
  );

  const diTokens = diffNamedList(fromDocs.tokens, toDocs.tokens, {
    signatureOf: (token) => token.type ?? '',
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
