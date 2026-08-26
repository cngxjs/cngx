// list_components - the deterministic browse complement to find_component's fuzzy
// search. It enumerates the whole components + directives surface, optionally
// filtered by lib and/or kind, each entry summarised to the five keys that
// identify it. Offline, read-only, over the same union the query layer walks.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import type { DocsIndex } from '../data/loader.js';
import type { EntryKind } from '../query.js';
import { allEntries, entryLib } from '../query.js';

export interface ComponentSummary {
  name: string;
  kind: EntryKind;
  selector: string | null;
  category: string | null;
  lib: string | null;
}

export interface ListComponentsOptions {
  lib?: string;
  kind?: EntryKind;
}

/**
 * Pure query behind the tool - the full catalog as sorted summaries, narrowed by
 * the optional `lib` / `kind` filters. An unmatched filter yields `[]`, never
 * `null`: an empty enumeration is a valid answer, distinct from the resolve-by-name
 * tools where `null` means "no such symbol".
 */
export function listComponents(docs: DocsIndex, opts: ListComponentsOptions = {}): ComponentSummary[] {
  return allEntries(docs)
    .filter(({ kind }) => opts.kind === undefined || kind === opts.kind)
    .map(({ entry, kind }) => ({
      name: entry.name,
      kind,
      selector: entry.selector ?? null,
      category: entry.category ?? null,
      lib: entryLib(entry),
    }))
    .filter((summary) => opts.lib === undefined || summary.lib === opts.lib)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function registerListComponents(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'list_components',
    {
      title: 'List cngx components and directives',
      description:
        'Enumerate every cngx component and directive as a compact summary ' +
        '({ name, kind, selector, category, lib }), sorted by name. Optionally filter by ' +
        '`lib` (exact lib name, e.g. "common") and/or `kind` ("component" | "directive"); ' +
        'omit both for the full catalog. The deterministic browse complement to ' +
        "find_component's fuzzy search. An unmatched filter returns an empty list, not null.",
      inputSchema: {
        lib: z.string().optional().describe('Exact owning lib name, e.g. "forms" or "common".'),
        kind: z.enum(['component', 'directive']).optional().describe('Restrict to one entry kind.'),
      },
    },
    ({ lib, kind }) => jsonResult(listComponents(docs, { lib, kind })),
  );
}
