// find_component - the entry point for every downstream query. Given a name,
// selector, or category fragment, it lists the matching cngx components and
// directives so an agent can then call get_api / get_slots / get_tokens /
// get_story_example on a resolved name.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
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
        'point for get_api, get_slots, get_tokens, and get_story_example.',
      inputSchema: {
        query: z.string().describe('A name, selector, or category fragment, e.g. "select" or "cngx-chip".'),
      },
    },
    ({ query }) => {
      const matches = findComponents(docs, query);
      return { content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }] };
    },
  );
}
