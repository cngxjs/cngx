// migrate_usage - answers "what breaks between cngx vX and vY" with a structured
// API delta. It resolves each version to a `DocsIndex` (the bundled snapshot when
// the version matches it, else the release asset fetched via `gh` or, when `gh`
// fails, over HTTPS), then runs the pure in-process diff. The fetch is the same one
// the version-scoped query tools use, and it is fail-safe: no network or an absent
// asset returns a typed error result, never a throw - preserving the server's
// don't-crash-stdout contract.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocsResolver } from '../data/docs-resolver.js';
import { diffSnapshots } from '../diff/snapshot-diff.js';
import { normalizeReleaseVersion } from '../diff/snapshot-fetch.js';
import type { CategoryDelta, MigrateUsageResult, SignatureChangedEntry, UsageDelta, UsageDeltaError } from '../diff/types.js';
import { blocks, cell, code, section, table, textCell } from './markdown.js';

export interface MigrateUsageArgs {
  from: string;
  to?: string;
}

/**
 * Pure query behind the tool. `to` defaults to the bundled snapshot's `cngxVersion`.
 * Returns the structured {@link MigrateUsageResult} - a delta on success, a typed
 * failure when a non-bundled snapshot cannot be resolved. Both endpoints resolve
 * through `resolve`, the same resolver the version-scoped query tools get from
 * their context, so the bundled short-circuit, the fetch, the schema-error mapping
 * and the cache are shared.
 */
export async function migrateUsage(
  bundled: DocsIndex,
  args: MigrateUsageArgs,
  resolve: DocsResolver,
): Promise<MigrateUsageResult> {
  const from = args.from;
  const to = args.to ?? bundled.meta.cngxVersion ?? 'unknown';

  // Both versions are checked before the first resolve, so a malformed `to` never
  // waits behind a fetch of `from`.
  for (const version of [from, to]) {
    const normalized = normalizeReleaseVersion(version);
    if (!normalized.ok) {
      return { ok: false, meta: { from, to }, reason: 'invalid-version', message: normalized.message };
    }
  }

  const fromResolved = await resolve(from);
  if (!fromResolved.ok) {
    return { ok: false, meta: { from, to }, reason: fromResolved.reason, message: fromResolved.message };
  }
  const toResolved = await resolve(to);
  if (!toResolved.ok) {
    return { ok: false, meta: { from, to }, reason: toResolved.reason, message: toResolved.message };
  }

  const delta = diffSnapshots(fromResolved.docs, toResolved.docs);
  // The resolver already labels an unstamped fetched asset with its requested version
  // (a successful download of the `v<version>` asset means the asset IS that version),
  // so `.version` is the truthful resolved label; fall back to the request only for the
  // theoretical null case an unstamped bundled short-circuit would produce.
  return {
    ...delta,
    meta: {
      from,
      to,
      resolvedFrom: fromResolved.version ?? from,
      resolvedTo: toResolved.version ?? to,
    },
  };
}

type DeltaCategory = keyof Pick<UsageDelta, 'components' | 'inputs' | 'outputs' | 'slots' | 'diTokens'>;

/** Each category with its title and the part a same-name change in it changed. */
const DELTA_CATEGORIES: readonly (readonly [DeltaCategory, string, string])[] = [
  ['components', 'Components, directives and services', 'selector'],
  ['inputs', 'Inputs', 'type'],
  ['outputs', 'Outputs', 'type'],
  ['slots', 'Slots', 'description'],
  ['diTokens', 'DI tokens', 'type'],
];

const KINDS: ReadonlySet<string> = new Set(['component', 'directive']);

const owned = (name: string, owner: string | undefined) => code(owner ? `${owner}.${name}` : name);

function categoryRows(delta: CategoryDelta, category: DeltaCategory, part: string): string[][] {
  // A slot description is prose: capped like every other description cell.
  const detail = category === 'slots' ? textCell : code;
  // An input names the parts of its contract that changed; only the component
  // category carries a component <-> directive flip.
  const isKindFlip = (e: SignatureChangedEntry) =>
    category === 'components' && KINDS.has(e.fromSignature) && KINDS.has(e.toSignature);
  const changed = (e: SignatureChangedEntry) => e.changed?.join(', ') ?? (isKindFlip(e) ? 'kind' : part);
  return [
    ...delta.removed.map((e) => ['removed', owned(e.name, e.owner), '-']),
    ...delta.renamed.map((e) => [e.inferred ? 'renamed (inferred)' : 'renamed', owned(e.from, e.owner), code(e.to)]),
    ...delta.signatureChanged.map((e) => [changed(e), owned(e.name, e.owner), `${detail(e.fromSignature)} -> ${detail(e.toSignature)}`]),
  ];
}

/** The delta as one table per category that has a breaking change. */
export function migrateUsageMarkdown(delta: UsageDelta | null): string {
  if (!delta) {
    return 'No delta.\n';
  }
  const { meta } = delta;
  const sections = DELTA_CATEGORIES.map(([key, title, part]) => {
    const rows = categoryRows(delta[key], key, part);
    return rows.length ? section(title, table(['Change', 'Symbol', 'Detail'], rows), '') : '';
  });
  const changed = sections.some((s) => s !== '');
  return blocks(
    `# Migrating ${cell(meta.resolvedFrom ?? meta.from)} -> ${cell(meta.resolvedTo ?? meta.to)}`,
    changed ? null : 'No removed, renamed or signature-changed API between these releases.',
    ...sections,
  );
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'What breaks between cngx 0.1.0-rc.5 and 0.1.0?';

export const migrateUsageCommand = defineCommand({
  name: 'migrate_usage',
  title: 'Diff two cngx releases',
  description:
    'Return a structured API delta between two cngx releases: removed / renamed / signature-changed ' +
    'components, inputs, outputs, slots, and DI tokens. `to` defaults to the bundled snapshot version. ' +
    'A version other than the bundled one is fetched from the GitHub Release assets via `gh`, or over HTTPS ' +
    'when `gh` is missing or fails; no network or an absent asset returns a typed error result ' +
    '({ ok: false, reason }), never a throw. A malformed version returns reason `invalid-version` before any fetch.',
  cliSummary:
    'Print the removed, renamed and signature-changed API between two cngx releases: components, inputs, outputs, slots and DI tokens. --to defaults to the bundled release; any other release is fetched through `gh`, or over HTTPS when `gh` is missing or fails.',
  cliName: 'migrate',
  input: {
    from: z.string().trim().min(1).describe('The cngx version to upgrade FROM, e.g. "0.1.0" (without the leading "v").'),
    to: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('The cngx version to upgrade TO. Defaults to the bundled snapshot version.'),
  },
  positional: 'from',
  run: async (ctx, { from, to }) => {
    try {
      return await migrateUsage(ctx.bundled, { from, to }, ctx.resolve);
    } catch (error) {
      // Final safety net: the tool must answer, never throw across the boundary.
      const failure: UsageDeltaError = {
        ok: false,
        meta: { from, to: to ?? ctx.bundled.meta.cngxVersion ?? 'unknown' },
        reason: 'asset-missing',
        // The catch-all keeps `asset-missing`; the prefix marks a defect, not a missing release.
        message: `internal: ${error instanceof Error ? error.message : String(error)}`,
      };
      return failure;
    }
  },
  answeredVersion: (delta: UsageDelta | null) => delta?.meta.resolvedTo ?? delta?.meta.to ?? null,
  toMarkdown: (delta: UsageDelta | null) => migrateUsageMarkdown(delta),
});
