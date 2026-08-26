// migrate_usage - answers "what breaks between cngx vX and vY" with a structured
// API delta. It resolves each version to a `DocsIndex` (the bundled snapshot when
// the version matches it, else a `gh release download` of the non-bundled snapshot),
// then runs the pure in-process diff. This is the server's only network touch, and
// it is fail-safe: a missing `gh`, no network, or an absent asset returns a typed
// error result, never a throw - preserving the server's don't-crash-stdout contract.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import type { DocsIndex } from '../data/loader.js';
import { loadDocsFromFile } from '../data/loader.js';
import { resolveDocs } from '../data/docs-resolver.js';
import { diffSnapshots } from '../diff/snapshot-diff.js';
import { fetchSnapshot } from '../diff/snapshot-fetch.js';
import type { MigrateUsageResult, UsageDeltaError } from '../diff/types.js';

export interface MigrateUsageArgs {
  from: string;
  to?: string;
}

/** Injectable side-effect seam so the pure query is testable without `gh` or the network. */
export interface MigrateUsageDeps {
  fetchSnapshot: typeof fetchSnapshot;
  loadDocs: typeof loadDocsFromFile;
}

const defaultDeps: MigrateUsageDeps = { fetchSnapshot, loadDocs: loadDocsFromFile };

/**
 * Pure query behind the tool. `to` defaults to the bundled snapshot's `cngxVersion`.
 * Returns the structured {@link MigrateUsageResult} - a delta on success, a typed
 * failure when a non-bundled snapshot cannot be resolved. Both endpoints resolve
 * through the shared {@link resolveDocs}, so the bundled short-circuit, the fetch
 * seam, the schema-error mapping, and the in-memory cache are the same ones the
 * version-scoped query tools use.
 */
export function migrateUsage(bundled: DocsIndex, args: MigrateUsageArgs, deps: MigrateUsageDeps = defaultDeps): MigrateUsageResult {
  const from = args.from;
  const to = args.to ?? bundled.meta.cngxVersion ?? 'unknown';

  const fromResolved = resolveDocs(bundled, from, deps);
  if (!fromResolved.ok) {
    return { ok: false, meta: { from, to }, reason: fromResolved.reason, message: fromResolved.message };
  }
  const toResolved = resolveDocs(bundled, to, deps);
  if (!toResolved.ok) {
    return { ok: false, meta: { from, to }, reason: toResolved.reason, message: toResolved.message };
  }

  const delta = diffSnapshots(fromResolved.docs, toResolved.docs);
  // `resolveDocs` already labels an unstamped fetched asset with its requested version
  // (a successful `gh release download v<version>` means the asset IS that version),
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

export function registerMigrateUsage(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'migrate_usage',
    {
      title: 'Diff two cngx releases',
      description:
        'Return a structured API delta between two cngx releases: removed / renamed / signature-changed ' +
        'components, inputs, outputs, slots, and DI tokens. `to` defaults to the bundled snapshot version. ' +
        'A version other than the bundled one is fetched from the GitHub Release assets via `gh`; a missing ' +
        '`gh`, no network, or an absent asset returns a typed error result ({ ok: false, reason }), never a throw.',
      inputSchema: {
        from: z.string().describe('The cngx version to upgrade FROM, e.g. "0.1.0" (without the leading "v").'),
        to: z
          .string()
          .optional()
          .describe('The cngx version to upgrade TO. Defaults to the bundled snapshot version.'),
      },
    },
    ({ from, to }) => {
      try {
        return jsonResult(migrateUsage(docs, { from, to }));
      } catch (error) {
        // Final safety net: the tool must answer, never throw across the boundary.
        const failure: UsageDeltaError = {
          ok: false,
          meta: { from, to: to ?? docs.meta.cngxVersion ?? 'unknown' },
          reason: 'asset-missing',
          message: error instanceof Error ? error.message : String(error),
        };
        return jsonResult(failure);
      }
    },
  );
}
