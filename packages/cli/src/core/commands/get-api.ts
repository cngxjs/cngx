// get_api - the typed-query payoff over the multi-megabyte llms-full dump. Given
// a resolved name, it returns just that component's, directive's, or injectable
// service's API surface: inputs, outputs, signal flag, host bindings, public
// methods, and description.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { EntryKind } from '../query.js';
import { resolveEntry } from '../query.js';
import { blocks, bullets, cell, code, section, table } from './markdown.js';

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

/** The API surface as a heading, a summary line and one section per member group. */
export function apiMarkdown(api: ApiResult | null): string {
  if (!api) {
    return 'No component, directive, or service by that name.\n';
  }
  const summary = [`Kind: ${api.kind}`, `Selector: ${code(api.selector)}`, `Signal-based: ${api.signal ? 'yes' : 'no'}`];
  const inputs = api.inputs.map((i) => [code(i.name), code(i.type), code(i.defaultValue), cell(i.description)]);
  const outputs = api.outputs.map((o) => [code(o.name), code(o.type), cell(o.description)]);
  return blocks(
    `# ${api.name}`,
    summary.join(' | '),
    api.description && cell(api.description),
    section('Inputs', inputs.length ? table(['Name', 'Type', 'Default', 'Description'], inputs) : '', 'None.'),
    section('Outputs', outputs.length ? table(['Name', 'Type', 'Description'], outputs) : '', 'None.'),
    section('Host bindings', bullets(api.hostBindings.map((b) => code(b))), 'None.'),
    section('Methods', bullets(api.methods.map((m) => `${code(m.name)}: ${code(m.returnType)}`)), 'None.'),
  );
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'What inputs and outputs does CngxSelect take?';

export const getApiCommand = defineCommand({
  name: 'get_api',
  title: 'Get cngx component API',
  description:
    "Return a single component's, directive's, or injectable service's API surface - inputs, " +
    'outputs, signal flag, host bindings, public methods, and description - by class name or ' +
    'selector. Returns null when the name resolves to nothing.',
  cliName: 'api',
  input: {
    name: z
      .string()
      .describe('A component/directive/service class name or selector, e.g. "CngxSelect" or "cngx-select".'),
    version: versionInput,
  },
  positional: 'name',
  cliFlags: { version: 'cngx-version' },
  run: (ctx, { name, version }) => answerVersioned(ctx.resolve, version, (resolved) => getApi(resolved, name)),
  toMarkdown: (api: ApiResult | null) => apiMarkdown(api),
});
