// get_slots - the consumer-override surface. Given a resolved name, it returns
// the projected template slots, each carrying the slot directive selector name
// plus its one-line doc. The data has no selector/context key on a slot, so the
// payload is exactly { name, description } per slot.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocSlot } from '../data/types.js';
import type { EntryKind } from '../query.js';
import { resolveEntry } from '../query.js';

export interface SlotsResult {
  name: string;
  kind: EntryKind;
  slots: DocSlot[];
}

/** Pure query behind the tool - returns `null` when the name resolves to nothing. */
export function getSlots(docs: DocsIndex, name: string): SlotsResult | null {
  const match = resolveEntry(docs, name);
  if (!match) {
    return null;
  }
  return {
    name: match.entry.name,
    kind: match.kind,
    slots: (match.entry.slots ?? []).map((slot) => ({ name: slot.name, description: slot.description })),
  };
}

export function registerGetSlots(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'get_slots',
    {
      title: 'Get cngx component template slots',
      description:
        "Return a component's projected template slots - each the slot directive selector name plus " +
        'its one-line doc - by class name or selector. An empty slots array means the component projects ' +
        'no overridable slots. Returns null when the name resolves to nothing.',
      inputSchema: {
        name: z.string().describe('A component/directive class name or selector, e.g. "CngxSelect".'),
        version: versionInput,
      },
    },
    ({ name, version }) => jsonResult(answerVersioned(docs, version, (resolved) => getSlots(resolved, name))),
  );
}
