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
import { diffSnapshots } from '../diff/snapshot-diff.js';
import { fetchSnapshot } from '../diff/snapshot-fetch.js';
import type { MigrateUsageResult, SnapshotFetchFailureReason, UsageDeltaError } from '../diff/types.js';

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

type ResolvedVersion =
  | { ok: true; docs: DocsIndex }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/** Resolve a requested version to a snapshot: the bundled one when it matches, else fetched. */
function resolveVersion(version: string, bundled: DocsIndex, deps: MigrateUsageDeps): ResolvedVersion {
  if (bundled.meta.cngxVersion !== null && version === bundled.meta.cngxVersion) {
    return { ok: true, docs: bundled };
  }
  const fetched = deps.fetchSnapshot(version);
  if (!fetched.ok) {
    return { ok: false, reason: fetched.reason, message: fetched.message };
  }
  try {
    return { ok: true, docs: deps.loadDocs(fetched.path) };
  } catch (error) {
    // A fetched-but-unreadable snapshot (bad schema, corrupt JSON) is, from the
    // consumer's view, an unusable asset - kept inside the typed reason set.
    return {
      ok: false,
      reason: 'asset-missing',
      message: `Fetched snapshot for v${version} could not be read: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Pure query behind the tool. `to` defaults to the bundled snapshot's `cngxVersion`.
 * Returns the structured {@link MigrateUsageResult} - a delta on success, a typed
 * failure when a non-bundled snapshot cannot be resolved.
 */
export function migrateUsage(bundled: DocsIndex, args: MigrateUsageArgs, deps: MigrateUsageDeps = defaultDeps): MigrateUsageResult {
  const from = args.from;
  const to = args.to ?? bundled.meta.cngxVersion ?? 'unknown';

  const fromResolved = resolveVersion(from, bundled, deps);
  if (!fromResolved.ok) {
    return { ok: false, meta: { from, to }, reason: fromResolved.reason, message: fromResolved.message };
  }
  const toResolved = resolveVersion(to, bundled, deps);
  if (!toResolved.ok) {
    return { ok: false, meta: { from, to }, reason: toResolved.reason, message: toResolved.message };
  }

  const delta = diffSnapshots(fromResolved.docs, toResolved.docs);
  // Record the requested versions in meta; `resolvedFrom`/`resolvedTo` keep the
  // versions the loaded snapshots actually carried.
  return { ...delta, meta: { ...delta.meta, from, to } };
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
