import {
  InjectionToken,
  effect,
  untracked,
  type Signal,
  type WritableSignal,
} from '@angular/core';

/**
 * Config for {@link createSearchEffects}.
 */
export interface SearchEffectsOptions {
  /** Debounced search-term signal. */
  readonly searchTerm: Signal<string>;
  readonly panelOpen: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  /** Typically `() => this.popoverRef()?.show()`. */
  readonly open: () => void;
  /**
   * Extra auto-open gate. Display-binding variants pass
   * `() => !this.display.isWritingFromValue()` so library writes
   * don't re-open a panel the user just closed.
   */
  readonly autoOpenGate?: () => boolean;
  /**
   * Optional `searchTermChange` forward. Display-binding variants
   * route through `onUserSearchTerm` and leave this undefined.
   */
  readonly emit?: {
    readonly hasEmittedInitial: WritableSignal<boolean>;
    readonly skipInitial: Signal<boolean>;
    readonly onEmit: (term: string) => void;
  };
}

/**
 * One or two `effect()`s for input-trigger variants: `skipInitial`-gated
 * `searchTermChange` forward (when `emit` is set) and auto-open-on-typing.
 * External calls wrapped in `untracked`. Injection context required.
 */
export function createSearchEffects(opts: SearchEffectsOptions): void {
  if (opts.emit) {
    const e = opts.emit;
    effect(() => {
      const term = opts.searchTerm();
      untracked(() => {
        const initial = !e.hasEmittedInitial();
        e.hasEmittedInitial.set(true);
        if (initial && e.skipInitial()) {
          return;
        }
        e.onEmit(term);
      });
    });
  }

  const autoOpenGate = opts.autoOpenGate ?? ((): boolean => true);

  effect(() => {
    const term = opts.searchTerm();
    untracked(() => {
      if (
        term !== '' &&
        !opts.panelOpen() &&
        !opts.disabled() &&
        autoOpenGate()
      ) {
        opts.open();
      }
    });
  });
}

/**
 * Factory signature for {@link CNGX_SEARCH_EFFECTS_FACTORY}.
 */
export type CngxSearchEffectsFactory = (opts: SearchEffectsOptions) => void;

/**
 * Factory token. Default {@link createSearchEffects}.
 */
export const CNGX_SEARCH_EFFECTS_FACTORY =
  new InjectionToken<CngxSearchEffectsFactory>('CngxSearchEffectsFactory', {
    providedIn: 'root',
    factory: () => createSearchEffects,
  });
