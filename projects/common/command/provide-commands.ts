import {
  computed,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
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
 * so `inject(CNGX_COMMAND_SOURCE)` returns every contributed source.
 *
 * @category common/command
 * @since 0.1.0
 */
export const CNGX_COMMAND_SOURCE = new InjectionToken<readonly CngxCommandSource[]>(
  'CNGX_COMMAND_SOURCE',
);

/**
 * Registers one or more command sources with the environment injector. Each
 * source becomes a `multi` entry on {@link CNGX_COMMAND_SOURCE}; a consumer may
 * call `provideCommands` from several app parts and `injectCommands` merges all
 * of them.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCommands(fileCommands, computed(() => editorCommands())),
 *   ],
 * });
 * ```
 *
 * @category common/command
 * @since 0.1.0
 */
export function provideCommands(...sources: CngxCommandSource[]): EnvironmentProviders {
  return makeEnvironmentProviders(
    sources.map((source) => ({ provide: CNGX_COMMAND_SOURCE, useValue: source, multi: true })),
  );
}

/**
 * Merges every registered {@link CNGX_COMMAND_SOURCE} into one reactive
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
  const sources = inject(CNGX_COMMAND_SOURCE, { optional: true }) ?? [];
  return computed(() => sources.flatMap(readSource), { equal: commandsEqual });
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
