// find_component - the entry point for every downstream query. Given a name,
// selector, or category fragment, it lists the matching cngx components,
// directives, and injectable services so an agent can then call get_api /
// get_slots / get_theme_tokens / get_di_tokens / get_story_example on a
// resolved name.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { EntryKind } from '../query.js';
import { searchEntries } from '../query.js';
import { cell, code, table } from './markdown.js';

export interface FindComponentMatch {
  name: string;
  kind: EntryKind;
  selector: string | null;
  category: string | null;
  file: string | null;
}

/** Pure query behind the tool - directly unit-testable against a fixture. */
export function findComponents(docs: DocsIndex, query: string): FindComponentMatch[] {
  return searchEntries(docs, query).map(({ entry, kind }) => ({
    name: entry.name,
    kind,
    selector: entry.selector ?? null,
    category: entry.category ?? null,
    file: entry.file ?? null,
  }));
}

/** The matches as one table, or a not-found line. */
export function findComponentsMarkdown(matches: FindComponentMatch[] | null): string {
  if (!matches || matches.length === 0) {
    return 'No matching component, directive, or service.\n';
  }
  const rows = matches.map((m) => [code(m.name), cell(m.kind), code(m.selector), cell(m.category), cell(m.file)]);
  return `${table(['Name', 'Kind', 'Selector', 'Category', 'File'], rows)}\n`;
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'Which cngx component renders a searchable single select?';

export const findComponentCommand = defineCommand({
  name: 'find_component',
  title: 'Find cngx component, directive, or service',
  description:
    'Search cngx components, directives, and injectable services by name, selector, or category ' +
    'fragment. Returns each match with its kind, selector, category, and source file - the starting ' +
    'point for get_api, get_slots, get_theme_tokens, get_di_tokens, and get_story_example.',
  cliName: 'find',
  input: {
    query: z.string().describe('A name, selector, or category fragment, e.g. "select" or "cngx-chip".'),
    version: versionInput,
  },
  positional: 'query',
  cliFlags: { version: 'cngx-version' },
  run: (ctx, { query, version }) => answerVersioned(ctx.resolve, version, (resolved) => findComponents(resolved, query)),
  toMarkdown: (matches: FindComponentMatch[] | null) => findComponentsMarkdown(matches),
});
