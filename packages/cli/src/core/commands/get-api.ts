// get_api - the typed-query payoff over the multi-megabyte llms-full dump. Given
// a resolved name, it returns just that component's, directive's, or injectable
// service's API surface: inputs, outputs, signal flag, host bindings, public
// methods, and description.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocEntry, DocInput, DocMethod } from '../data/types.js';
import type { AmbiguousMatch, EntryKind } from '../query.js';
import { foundUnlessAmbiguous, isAmbiguous, resolveEntry } from '../query.js';
import { ambiguousMarkdown, blocks, bullets, code, docText, section, table, textCell } from './markdown.js';

/**
 * One input, named by its binding. `field` is the class field name, present only
 * when it differs (an aliased input). `kind` is `null` for a decorator input.
 */
export interface ApiInput {
  name: string;
  field?: string;
  kind: 'input' | 'model' | null;
  required: boolean | null;
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

function inputKind(input: DocInput): ApiInput['kind'] {
  if (input.signalKind === 'model') {
    return 'model';
  }
  return input.signalKind ? 'input' : null;
}

function toApiInput(input: DocInput): ApiInput {
  const name = input.alias ?? input.name;
  return {
    name,
    ...(name === input.name ? {} : { field: input.name }),
    kind: inputKind(input),
    required: input.required ?? null,
    type: input.type ?? null,
    defaultValue: input.defaultValue ?? null,
    description: input.description ?? null,
  };
}

// compodocx sets the entry-level `signal` flag to false on every component and
// directive, so a member declared with `input()` / `model()` / `output()` decides.
function isSignalBased(entry: DocEntry): boolean {
  const members = [...(entry.inputsClass ?? []), ...(entry.outputsClass ?? [])];
  return entry.signal === true || members.some((member) => member.signalKind !== undefined);
}

/**
 * TypeScript `SyntaxKind` numbers of the `private` and `protected` keywords as compodocx
 * records them in `modifierKind`. The core carries no `typescript` dependency, so the
 * numbers are pinned here; they hold for TypeScript 5.9, the version compodocx resolves
 * from the root install. A renumbering fails the bundled-snapshot case in get-api.spec.
 */
const NON_PUBLIC_MODIFIER_KINDS: ReadonlySet<number> = new Set([123, 124]);

/** cngx keeps template handlers protected; only a method without a private/protected modifier is API. */
const isPublicMethod = (method: DocMethod): boolean =>
  !(method.modifierKind ?? []).some((kind) => NON_PUBLIC_MODIFIER_KINDS.has(kind));

/** Pure query behind the tool - `null` when the name resolves to nothing, the ambiguity when a selector matches several entries. */
export function getApi(docs: DocsIndex, name: string): ApiResult | AmbiguousMatch | null {
  const match = resolveEntry(docs, name);
  if (!match || isAmbiguous(match)) {
    return match ?? null;
  }
  const { entry, kind } = match;
  return {
    name: entry.name,
    kind,
    selector: entry.selector ?? null,
    description: entry.description ?? null,
    signal: isSignalBased(entry),
    // Signal inputs/outputs live in inputsClass/outputsClass; the legacy
    // inputs/outputs arrays are empty across the cngx surface.
    inputs: (entry.inputsClass ?? []).map(toApiInput),
    outputs: (entry.outputsClass ?? []).map((output) => ({
      name: output.name,
      type: output.type ?? null,
      description: output.description ?? null,
    })),
    hostBindings: (entry.hostBindings ?? []).map((binding) => binding.name),
    // Components/directives record methods under methodsClass, injectables
    // under methods - read whichever the entry carries.
    methods: (entry.methodsClass ?? entry.methods ?? []).filter(isPublicMethod).map((method) => ({
      name: method.name,
      returnType: method.returnType ?? null,
    })),
  };
}

/** The API surface as a heading, a summary line and one section per member group. */
export function apiMarkdown(api: ApiResult | AmbiguousMatch | null): string {
  if (!api) {
    return 'No component, directive, or service by that name.\n';
  }
  if (isAmbiguous(api)) {
    return ambiguousMarkdown(api);
  }
  const summary = [`Kind: ${api.kind}`, `Selector: ${code(api.selector)}`, `Signal-based: ${api.signal ? 'yes' : 'no'}`];
  const inputs = api.inputs.map((i) => [code(i.name), code(i.type), code(i.defaultValue), textCell(i.description)]);
  const outputs = api.outputs.map((o) => [code(o.name), code(o.type), textCell(o.description)]);
  return blocks(
    `# ${api.name}`,
    summary.join(' | '),
    docText(api.description),
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
    'selector. `result` is null when the name matches nothing, and `{ ambiguous: true, candidates }` when a selector matches several entries.',
  cliSummary:
    'Print the inputs, outputs, host bindings, methods and description of one component, directive or service, by class name or selector. Exits 1 when the name matches nothing or a selector matches several entries.',
  cliName: 'api',
  input: {
    name: z
      .string()
      .min(1)
      .describe('A component/directive/service class name or selector, e.g. "CngxSelect" or "cngx-select".'),
    version: versionInput,
  },
  positional: 'name',
  cliFlags: { version: 'cngx-version' },
  run: (ctx, { name, version }) => answerVersioned(ctx.resolve, version, (resolved) => getApi(resolved, name)),
  found: foundUnlessAmbiguous,
  toMarkdown: (api: ApiResult | AmbiguousMatch | null) => apiMarkdown(api),
});
