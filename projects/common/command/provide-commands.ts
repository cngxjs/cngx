import {
  computed,
  EnvironmentInjector,
  inject,
  InjectionToken,
  type Provider,
  type Signal,
} from '@angular/core';

import type { CngxCommand } from './command';

/**
 * A command contribution. Either a static list or a reactive `Signal` of
 * commands - a signal source lets a contributor add or remove commands (or
 * flip a command's `disabled`) live, and `injectCommands` tracks it.
 *
 * @category common/command
 * @since 0.1.0
 */
export type CngxCommandSource = Signal<readonly CngxCommand[]> | readonly CngxCommand[];

/**
 * Multi-token every `provideCommands` call contributes to. App parts register
 * command sets against it without a central list, mirroring `provideCngxMenu`.
 * The generic is the collected array (as with Angular's `HTTP_INTERCEPTORS`),
 * so `inject(CNGX_COMMAND_SOURCE)` returns the sources of the nearest level
 * that provides it.
 *
 * This is the low-level form. Register through `provideCommands`, which also
 * carries a level's sources into every scope below it. A raw multi-provider on
 * this token is carried down only from a level that also calls
 * `provideCommands`; on any other level it is read only when that level is the
 * one `injectCommands` resolves as nearest.
 *
 * @category common/command
 * @since 0.1.0
 */
export const CNGX_COMMAND_SOURCE = new InjectionToken<readonly CngxCommandSource[]>(
  'CNGX_COMMAND_SOURCE',
);

/**
 * @internal Per-level registry: the sources of every `provideCommands` level
 * above, plus this level's own. Resolved once per injector by the factory in
 * `provideCommands`; not part of the public API.
 */
const CNGX_COMMAND_REGISTRY = new InjectionToken<readonly CngxCommandSource[]>(
  'CNGX_COMMAND_REGISTRY',
);

/**
 * Registers one or more command sources. Each source becomes a `multi` entry
 * on {@link CNGX_COMMAND_SOURCE}; call `provideCommands` from several app parts
 * and `injectCommands` merges all of them.
 *
 * Returns `Provider[]` (not `EnvironmentProviders`), so it registers at any
 * injector scope - app root, a lazy route, or a component's `providers` /
 * `viewProviders` - letting a route or component contribute a scoped command
 * set without reaching for the raw {@link CNGX_COMMAND_SOURCE} multi-provider.
 *
 * A scoped call adds to the sets above it and never hides them, across route
 * and component scopes: root and route scopes come first (outer to inner), then
 * component scopes outer to inner. The same source reference registered at two
 * levels is listed once. Command ids are unique in the merged list: a command
 * whose `id` is already registered further out replaces that command in place,
 * so a scope can swap a global command for its own version.
 *
 * ```ts
 * // app root
 * bootstrapApplication(AppComponent, { providers: [provideCommands(fileCommands)] });
 * // a lazy route adds its set; its pages see fileCommands + reportCommands
 * { path: 'reports', providers: [provideCommands(reportCommands)], component: Reports }
 * // or component scope
 * @Component({ viewProviders: [provideCommands(editorCommands)] })
 * ```
 *
 * @category common/command
 * @since 0.1.0
 */
export function provideCommands(...sources: CngxCommandSource[]): Provider[] {
  // Empty call: the parent registry flows through untouched.
  if (sources.length === 0) {
    return [];
  }
  return [
    ...sources.map((source) => ({ provide: CNGX_COMMAND_SOURCE, useValue: source, multi: true })),
    {
      provide: CNGX_COMMAND_REGISTRY,
      // The nearest CNGX_COMMAND_SOURCE is this level's own multi list, so the
      // same factory works for environment, providers and viewProviders scopes.
      useFactory: () =>
        mergeSources(
          inject(CNGX_COMMAND_REGISTRY, { skipSelf: true, optional: true }) ?? [],
          inject(CNGX_COMMAND_SOURCE, { optional: true }) ?? [],
        ),
    },
  ];
}

/**
 * Merges the command sources registered at this injector level and every level
 * above it - route and component scopes alike - into one reactive
 * `Signal<readonly CngxCommand[]>`. The merge carries an explicit `equal`
 * (length + per-command identity) so re-emitting an identical set - the same
 * command references in the same order - does not produce a fresh array and
 * cascade the downstream match `computed()`.
 *
 * Must run in an injection context.
 *
 * @category common/command
 * @since 0.1.0
 */
export function injectCommands(): Signal<readonly CngxCommand[]> {
  // A node resolves its element chain before its environment chain, so a
  // routed component under a shell registry never reaches the route's
  // registry. Read both trees once and join them: environment scopes first.
  const sources = mergeSources(
    inject(EnvironmentInjector).get(CNGX_COMMAND_REGISTRY, null) ?? [],
    inject(CNGX_COMMAND_REGISTRY, { optional: true }) ?? [],
    inject(CNGX_COMMAND_SOURCE, { optional: true }) ?? [],
  );
  return computed(() => dedupeById(sources.flatMap(readSource)), { equal: commandsEqual });
}

/**
 * @internal Keeps one command per `id`: the last registration (the innermost
 * scope) wins, at the position of the first. A Map keeps a key's insertion slot
 * when its value is replaced.
 */
function dedupeById(commands: readonly CngxCommand[]): readonly CngxCommand[] {
  const byId = new Map<string, CngxCommand>();
  for (const command of commands) {
    byId.set(command.id, command);
  }
  return byId.size === commands.length ? commands : [...byId.values()];
}

/** @internal Concatenates in argument order and drops repeated source references. */
function mergeSources(...lists: (readonly CngxCommandSource[])[]): readonly CngxCommandSource[] {
  return [...new Set(lists.flat())];
}

/** @internal Reads a source, unwrapping a signal or passing an array through. */
function readSource(source: CngxCommandSource): readonly CngxCommand[] {
  return typeof source === 'function' ? source() : source;
}

/**
 * @internal Length + per-command identity. Identity subsumes id equality, so a
 * re-provided set of the same references short-circuits without re-emitting.
 */
function commandsEqual(a: readonly CngxCommand[], b: readonly CngxCommand[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((command, i) => command === b[i]);
}
