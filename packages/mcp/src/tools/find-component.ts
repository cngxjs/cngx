// find_component - the entry point for every downstream query. Given a name,
// selector, or category fragment, it lists the matching cngx components and
// directives so an agent can then call get_api / get_slots / get_theme_tokens /
// get_di_tokens / get_story_example on a resolved name.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { EntryKind } from '../query.js';
import { searchEntries } from '../query.js';

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

export function registerFindComponent(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'find_component',
    {
      title: 'Find cngx component or directive',
      description:
        'Search cngx components and directives by name, selector, or category fragment. ' +
        'Returns each match with its kind, selector, category, and source file - the starting ' +
        'point for get_api, get_slots, get_theme_tokens, get_di_tokens, and get_story_example.',
      inputSchema: {
        query: z.string().describe('A name, selector, or category fragment, e.g. "select" or "cngx-chip".'),
        version: z
          .string()
          .optional()
          .describe(
            'Optional cngx version to ground the answer against, e.g. "0.2.0". Omit to answer from the ' +
              'bundled snapshot offline; a non-bundled version fetches that release snapshot via gh (fail-safe).',
          ),
      },
    },
    ({ query, version }) => jsonResult(answerVersioned(docs, version, (resolved) => findComponents(resolved, query))),
  );
}
