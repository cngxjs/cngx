// list_components - the deterministic browse complement to find_component's fuzzy
// search. It enumerates the whole components + directives + injectables surface,
// optionally filtered by lib and/or kind, each entry summarised to the five keys
// that identify it. Offline, read-only, over the same union the query layer walks.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import type { DocsIndex } from '../data/loader.js';
import type { EntryKind } from '../query.js';
import { allEntries, entryLib } from '../query.js';
import { cell, code, table } from './markdown.js';

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

/** The catalog as one table, or a no-match line for an unmatched filter. */
export function listComponentsMarkdown(summaries: ComponentSummary[] | null): string {
  if (!summaries || summaries.length === 0) {
    return 'No component, directive, or service matches the filter.\n';
  }
  const rows = summaries.map((s) => [code(s.name), cell(s.kind), code(s.selector), cell(s.lib), cell(s.category)]);
  return `${table(['Name', 'Kind', 'Selector', 'Lib', 'Category'], rows)}\n`;
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'Which directives does @cngx/common ship?';

export const listComponentsCommand = defineCommand({
  name: 'list_components',
  title: 'List cngx components, directives, and services',
  description:
    'Enumerate every cngx component, directive, and injectable service as a compact summary ' +
    '({ name, kind, selector, category, lib }), sorted by name. Optionally filter by ' +
    '`lib` (exact lib name, e.g. "common") and/or `kind` ("component" | "directive" | "injectable"); ' +
    'omit both for the full catalog. The deterministic browse complement to ' +
    "find_component's fuzzy search. An unmatched filter returns an empty list, not null.",
  cliName: 'list',
  input: {
    lib: z.string().optional().describe('Exact owning lib name, e.g. "forms" or "common".'),
    kind: z.enum(['component', 'directive', 'injectable']).optional().describe('Restrict to one entry kind.'),
  },
  run: (ctx, { lib, kind }) => listComponents(ctx.bundled, { lib, kind }),
  toMarkdown: (summaries: ComponentSummary[] | null) => listComponentsMarkdown(summaries),
});
