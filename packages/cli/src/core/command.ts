// The shape of one cngx query command, shared by every adapter. A definition
// carries its identity, its zod input shape and a `run` over the context's
// snapshots; it imports no adapter, so the MCP server and any other front end
// generate their surface from the same object.

import type { z } from 'zod';
import type { DocsResolver } from './data/docs-resolver.js';
import type { DocsIndex } from './data/loader.js';

/** A zod field per input name; the adapter turns it into a tool schema or flags. */
export type CommandShape = Record<string, z.ZodType>;

/** The parsed input a definition's `run` receives for `S`. */
export type CommandInput<S extends CommandShape> = { [K in keyof S]: z.output<S[K]> };

/** What a definition can reach at run time. */
export interface CommandContext {
  /** The snapshot bundled into the package. */
  readonly bundled: DocsIndex;
  /** Resolve a requested release. The adapter builds it, so the adapter decides how it fetches and caches. */
  readonly resolve: DocsResolver;
}

export interface CngxCommand<S extends CommandShape = CommandShape> {
  /** Stable machine name, e.g. `get_api`. */
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly input: S;
  run(ctx: CommandContext, input: CommandInput<S>): unknown;
}

/** Identity helper that infers `S` from the literal, so `run` sees typed input. */
export function defineCommand<S extends CommandShape>(definition: CngxCommand<S>): CngxCommand<S> {
  return definition;
}
