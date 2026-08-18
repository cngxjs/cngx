// get_api - the typed-query payoff over the multi-megabyte llms-full dump. Given
// a resolved name, it returns just that component/directive's API surface:
// inputs, outputs, signal flag, host bindings, public methods, and description.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DocsIndex } from '../data/loader.js';
import type { EntryKind } from '../query.js';
import { resolveEntry } from '../query.js';

export interface ApiInput {
  name: string;
  type: string | null;
  defaultValue: string | null;
  description: string | null;
}

export interface ApiOutput {
  name: string;
  type: string | null;
  description: string | null;
}

export interface ApiMethod {
  name: string;
  returnType: string | null;
}

export interface ApiResult {
  name: string;
  kind: EntryKind;
  selector: string | null;
  description: string | null;
  signal: boolean;
  inputs: ApiInput[];
  outputs: ApiOutput[];
  hostBindings: string[];
  methods: ApiMethod[];
}

/** Pure query behind the tool - returns `null` when the name resolves to nothing. */
export function getApi(docs: DocsIndex, name: string): ApiResult | null {
  const match = resolveEntry(docs, name);
  if (!match) return null;
  const { entry, kind } = match;
  return {
    name: entry.name,
    kind,
    selector: entry.selector ?? null,
    description: entry.description ?? null,
    signal: entry.signal ?? false,
    inputs: (entry.inputs ?? []).map((input) => ({
      name: input.name,
      type: input.type ?? null,
      defaultValue: input.defaultValue ?? null,
      description: input.description ?? null,
    })),
    outputs: (entry.outputs ?? []).map((output) => ({
      name: output.name,
      type: output.type ?? null,
      description: output.description ?? null,
    })),
    hostBindings: (entry.hostBindings ?? []).map((binding) => binding.name),
    methods: (entry.methodsClass ?? []).map((method) => ({
      name: method.name,
      returnType: method.returnType ?? null,
    })),
  };
}

export function registerGetApi(server: McpServer, docs: DocsIndex): void {
  server.registerTool(
    'get_api',
    {
      title: 'Get cngx component API',
      description:
        "Return a single component or directive's API surface - inputs, outputs, signal flag, " +
        'host bindings, public methods, and description - by class name or selector. ' +
        'Returns null when the name resolves to nothing.',
      inputSchema: {
        name: z.string().describe('A component/directive class name or selector, e.g. "CngxSelect" or "cngx-select".'),
      },
    },
    async ({ name }) => {
      const api = getApi(docs, name);
      return { content: [{ type: 'text', text: JSON.stringify(api, null, 2) }] };
    },
  );
}
