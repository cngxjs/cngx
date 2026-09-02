import type { Signal } from '@angular/core';

/**
 * A single registrable command - a labelled action the command palette can
 * surface, rank against a query, and run. Commands carry no rendered chrome;
 * they are pure data plus a `run` callback, so a consumer registers them
 * against `@cngx/common/command` without pulling in the UI preset.
 *
 * The list is heterogeneous by design, so there is no `CngxCommand<T>` type
 * parameter: a payload rides on `data` as `unknown` and the row slot narrows
 * it at the use-site.
 *
 * @category common/command
 * @since 0.1.0
 */
export interface CngxCommand {
  /** Stable identity. Drives the merge `equal` and the `aria-activedescendant` id. */
  readonly id: string;
  /** Human-readable label; the primary target the default matcher ranks against. */
  readonly label: string;
  /** Extra terms the matcher ranks against besides the label. */
  readonly keywords?: readonly string[];
  /** Group key; also the value the default matcher's scope filter compares against. */
  readonly group?: string;
  /** Optional icon token; the consumer's row template resolves it against its own design system. */
  readonly icon?: string;
  /** Runs the command. May be async; the palette does not await the result. */
  run(): void | Promise<void>;
  /** Reactive disabled state. A disabled command stays perceivable and communicates its why. */
  readonly disabled?: Signal<boolean>;
  /**
   * Why the command is disabled. The default row wires `aria-describedby` to a
   * node carrying this reason, gated on `disabled() && !!disabledReason`
   * (Pillar 2 - a disabled control communicates its why).
   */
  readonly disabledReason?: string;
  /** Consumer payload the row slot narrows at the use-site. Heterogeneous, hence `unknown`. */
  readonly data?: unknown;
}

/**
 * A named cluster of commands. The palette renders grouped results (Recents on
 * an empty query, then categories) and the consumer's async result source is a
 * `CngxAsyncState<CngxCommandGroup[]>`.
 *
 * @category common/command
 * @since 0.1.0
 */
export interface CngxCommandGroup {
  /** Stable identity for the group header slot and change detection. */
  readonly id: string;
  /** Header label rendered above the group's commands. */
  readonly label: string;
  /** The commands in this group, in render order. */
  readonly commands: readonly CngxCommand[];
}

/**
 * @deprecated Use {@link CngxCommandGroup}. Published under the unprefixed
 * name by mistake; the alias remains for compatibility and will be removed in
 * a future major.
 * @category common/command
 * @since 0.1.0
 */
export type CommandGroup = CngxCommandGroup;
