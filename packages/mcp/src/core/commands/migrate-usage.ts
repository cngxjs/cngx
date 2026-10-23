// migrate_usage - answers "what breaks between cngx vX and vY" with a structured
// API delta. It resolves each version to a `DocsIndex` (the bundled snapshot when
// the version matches it, else the release asset fetched via `gh` or, when `gh`
// fails, over HTTPS), then runs the pure in-process diff. This is the server's only
// network touch, and it is fail-safe: no network or an absent asset returns a typed
// error result, never a throw - preserving the server's don't-crash-stdout contract.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocsResolver } from '../data/docs-resolver.js';
import { createDocsResolver } from '../data/docs-resolver.js';
import { diffSnapshots } from '../diff/snapshot-diff.js';
import type { MigrateUsageResult, UsageDeltaError } from '../diff/types.js';

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
  resolve: DocsResolver = createDocsResolver(bundled),
): Promise<MigrateUsageResult> {
  const from = args.from;
  const to = args.to ?? bundled.meta.cngxVersion ?? 'unknown';

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
    '({ ok: false, reason }), never a throw.',
  input: {
    from: z.string().describe('The cngx version to upgrade FROM, e.g. "0.1.0" (without the leading "v").'),
    to: z
      .string()
      .optional()
      .describe('The cngx version to upgrade TO. Defaults to the bundled snapshot version.'),
  },
  run: async (ctx, { from, to }) => {
    try {
      return await migrateUsage(ctx.bundled, { from, to }, ctx.resolve);
    } catch (error) {
      // Final safety net: the tool must answer, never throw across the boundary.
      const failure: UsageDeltaError = {
        ok: false,
        meta: { from, to: to ?? ctx.bundled.meta.cngxVersion ?? 'unknown' },
        reason: 'asset-missing',
        message: error instanceof Error ? error.message : String(error),
      };
      return failure;
    }
  },
});
