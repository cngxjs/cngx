// The shape of one cngx query command, shared by every adapter. A definition
// carries its identity, its zod input shape, a `run` over the context's
// snapshots and its markdown rendering; it imports no adapter, so the MCP server
// and the CLI generate their surface from the same object. The CLI fields
// (`cliName`, `positional`, `cliFlags`, `found`, `answeredVersion`, `toMarkdown`) never reach an MCP
// tool registration; keeping them here instead of in a CLI-side table means a new
// command cannot ship without its CLI rendering.

import type { z } from 'zod';
import type { DocsResolver, VersionedAnswer } from './data/docs-resolver.js';
import type { DocsIndex } from './data/loader.js';
import type { SnapshotFetchFailureReason } from './diff/types.js';
import { defaultFound } from './found.js';

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

/** A resolve failure a command answers with instead of throwing. */
export interface AnswerFailure {
  readonly ok: false;
  readonly reason: SnapshotFetchFailureReason;
  readonly message: string;
}

/** What `run` may answer for payload `P`: the payload, a version envelope around it, or a failure. */
export type Answer<P> = P | VersionedAnswer<P> | AnswerFailure;

/** Rendering switches an adapter passes to `toMarkdown`. */
export interface RenderOptions {
  /** A shorter view: names and types without descriptions. */
  readonly compact?: boolean;
}

export interface CngxCommand<S extends CommandShape = CommandShape, P = unknown> {
  /** Stable machine name, e.g. `get_api`. */
  readonly name: string;
  readonly title: string;
  /** The MCP tool description: written for an agent calling the tool, in tool and field names. */
  readonly description: string;
  /**
   * The same text for `cngx <command> --help`, in subcommand and flag terms. The CLI
   * prints it instead of `description`; MCP ignores it, so the tool surface does not move.
   */
  readonly cliSummary?: string;
  readonly input: S;
  /** The CLI subcommand, e.g. `api`. */
  readonly cliName: string;
  /** The input field the CLI takes as its positional argument instead of a flag; must name a key of `input`. */
  readonly positional?: string;
  /** Input fields the CLI exposes under another flag name, e.g. `{ version: 'cngx-version' }`. MCP ignores it. */
  readonly cliFlags?: Partial<Record<keyof S & string, string>>;
  run(ctx: CommandContext, input: CommandInput<S>): Answer<P> | Promise<Answer<P>>;
  /** Whether the payload answers the query; drives the CLI's exit 1. Defaults to {@link defaultFound}. */
  found?(payload: P): boolean;
  /**
   * The release a payload answers for, when it names it itself instead of coming
   * in a version envelope (a migration delta answers for its target). The CLI
   * prints it; absent, the CLI falls back to the bundled snapshot's version.
   */
  answeredVersion?(payload: P): string | null;
  /** The payload as markdown, for the CLI's default output format. */
  toMarkdown(payload: P, opts: RenderOptions): string;
}

/** Identity helper that infers `S` and `P` from the literal, so `run` and the renderers see typed values. */
export function defineCommand<S extends CommandShape, P>(definition: CngxCommand<S, P>): CngxCommand<S, P> {
  return definition;
}

/** Whether `payload` answers `command`'s query, through its own `found` or the default. */
export function isFound(command: CngxCommand, payload: unknown): boolean {
  return command.found ? command.found(payload) : defaultFound(payload);
}

/** A `run` answer split into its payload (plus the grounded version, when enveloped) or its failure. */
export type UnwrappedAnswer =
  | { readonly ok: true; readonly payload: unknown; readonly groundedVersion?: string | null }
  | AnswerFailure;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/**
 * Split an answer into payload or failure. `{ ok: false, reason, message }` is a
 * failure; `{ ok: true, groundedVersion, result }` is a version envelope whose
 * payload is `result`; anything else (a plain query result, a migration delta)
 * is the payload itself.
 */
export function unwrapAnswer(answer: unknown): UnwrappedAnswer {
  if (isRecord(answer) && answer.ok === false && typeof answer.message === 'string') {
    return { ok: false, reason: answer.reason as SnapshotFetchFailureReason, message: answer.message };
  }
  if (isRecord(answer) && answer.ok === true && 'result' in answer && 'groundedVersion' in answer) {
    return { ok: true, payload: answer.result, groundedVersion: answer.groundedVersion as string | null };
  }
  return { ok: true, payload: answer };
}
