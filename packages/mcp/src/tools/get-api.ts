// get_api - the typed-query payoff over the multi-megabyte llms-full dump. Given
// a resolved name, it returns just that component's, directive's, or injectable
// service's API surface: inputs, outputs, signal flag, host bindings, public
// methods, and description.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult } from './tool-result.js';
import { answerVersioned } from '../data/docs-resolver.js';
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
  if (!match) {
    return null;
  }
  const { entry, kind } = match;
  return {
    name: entry.name,
    kind,
    selector: entry.selector ?? null,
    description: entry.description ?? null,
    signal: entry.signal ?? false,
    // Signal inputs/outputs live in inputsClass/outputsClass; the legacy
    // inputs/outputs arrays are empty across the cngx surface.
    inputs: (entry.inputsClass ?? []).map((input) => ({
      name: input.name,
      type: input.type ?? null,
      defaultValue: input.defaultValue ?? null,
      description: input.description ?? null,
    })),
    outputs: (entry.outputsClass ?? []).map((output) => ({
      name: output.name,
      type: output.type ?? null,
      description: output.description ?? null,
    })),
    hostBindings: (entry.hostBindings ?? []).map((binding) => binding.name),
    // Components/directives record methods under methodsClass, injectables
    // under methods - read whichever the entry carries.
    methods: (entry.methodsClass ?? entry.methods ?? []).map((method) => ({
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
        "Return a single component's, directive's, or injectable service's API surface - inputs, " +
        'outputs, signal flag, host bindings, public methods, and description - by class name or ' +
        'selector. Returns null when the name resolves to nothing.',
      inputSchema: {
        name: z
          .string()
          .describe('A component/directive/service class name or selector, e.g. "CngxSelect" or "cngx-select".'),
        version: z
          .string()
          .optional()
          .describe(
            'Optional cngx version to ground the answer against, e.g. "0.2.0". Omit to answer from the ' +
              'bundled snapshot offline; a non-bundled version fetches that release snapshot via gh (fail-safe).',
          ),
      },
    },
    ({ name, version }) => jsonResult(answerVersioned(docs, version, (resolved) => getApi(resolved, name))),
  );
}
