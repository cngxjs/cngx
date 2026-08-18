// get_story_example - answers "show me a working example" with URLs the consumer
// can actually open. The snapshot step has already rebased exampleUrls onto the
// public GH Pages base, so they are the primary payload. `stackblitzUrl` is empty
// across the current surface, so it is surfaced as null rather than leaned on.
// `playgrounds` resolve only inside the cngx repo, so they are returned as
// labelled source references, never as openable links.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DocsIndex } from '../data/loader.js';
import type { DocPlayground } from '../data/types.js';
import type { EntryKind } from '../query.js';
import { resolveEntry } from '../query.js';

export interface StoryExampleResult {
  name: string;
  kind: EntryKind;
  exampleUrls: string[];
  stackblitzUrl: string | null;
  sourceReferences: DocPlayground[];
}

/** Pure query behind the tool - returns `null` when the name resolves to nothing. */
export function getStoryExample(docs: DocsIndex, name: string): StoryExampleResult | null {
  const match = resolveEntry(docs, name);
  if (!match) {
    return null;
  }
  const { entry, kind } = match;
  const stackblitzUrl = entry.stackblitzUrl?.trim();
  return {
    name: entry.name,
    kind,
    exampleUrls: entry.exampleUrls ?? [],
    // stackblitzUrl is empty ("") across the current surface; surface a real
    // link only when non-empty, else null. Not `??` - "" is not nullish.
    stackblitzUrl: stackblitzUrl && stackblitzUrl.length > 0 ? stackblitzUrl : null,
    sourceReferences: (entry.playgrounds ?? []).map((playground) => ({
      title: playground.title,
      fileRef: playground.fileRef,
      line: playground.line,
    })),
  };
}

export function registerGetStoryExample(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'get_story_example',
    {
      title: 'Get cngx example URLs',
      description:
        "Return a component's runnable example URLs (public documentation links a consumer can open), plus a " +
        'StackBlitz URL when one exists. Playground entries are repo-internal source references, not openable ' +
        'links. Returns null when the name resolves to nothing.',
      inputSchema: {
        name: z.string().describe('A component/directive class name or selector, e.g. "CngxSelect".'),
      },
    },
    ({ name }) => {
      const example = getStoryExample(docs, name);
      return { content: [{ type: 'text', text: JSON.stringify(example, null, 2) }] };
    },
  );
}
