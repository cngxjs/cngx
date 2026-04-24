import {
  InjectionToken,
  effect,
  untracked,
  type Signal,
  type WritableSignal,
} from '@angular/core';

/**
 * Configuration for {@link createSearchEffects}. The factory wires two
 * independent effects: a `skipInitial`-gated `searchTermChange`
 * forward (optional — variants that route the emit through
 * `display-binding.onUserSearchTerm` leave `emit` undefined) and an
 * auto-open-panel-on-typing effect whose extra gating is configured
 * via {@link SearchEffectsOptions.autoOpenGate}.
 *
 * @category interactive
 */
export interface SearchEffectsOptions {
  /** The variant's debounced search-term signal. */
  readonly searchTerm: Signal<string>;
  /** Current panel open state — auto-open bails when already open. */
  readonly panelOpen: Signal<boolean>;
  /** Disabled state — auto-open bails on disabled. */
  readonly disabled: Signal<boolean>;
  /** Imperative panel-open callback — typically `() => this.popoverRef()?.show()`. */
  readonly open: () => void;
  /**
   * Optional additional gate for the auto-open path. Variants that
   * mirror a committed value into the input via
   * `CNGX_DISPLAY_BINDING_FACTORY` pass
   * `() => !this.display.isWritingFromValue()` so the library's own
   * writes don't re-open a panel the user just closed. Variants
   * without display binding leave this undefined and the factory
   * defaults to `true`.
   */
  readonly autoOpenGate?: () => boolean;
  /**
   * Optional `searchTermChange` forward with `skipInitial` semantics.
   * Variants that route the emit through their display binding's
   * `onUserSearchTerm` callback leave this undefined; the factory
   * skips that effect entirely.
   */
  readonly emit?: {
    /**
     * Tracks whether the initial term has emitted yet. Writable
     * because the factory flips it on the first fire. Same signal
     * variants used to declare inline.
     */
    readonly hasEmittedInitial: WritableSignal<boolean>;
    /**
     * Whether to suppress the first emission. Typically the
     * per-instance `[skipInitial]` input.
     */
    readonly skipInitial: Signal<boolean>;
    /**
     * Fire-and-forget callback receiving the live term. Typically
     * `(term) => this.searchTermChange.emit(term)`.
     */
    readonly onEmit: (term: string) => void;
  };
}

/**
 * Wire the shared search-term effects for a select-family variant
 * that hosts an inline `<input>` trigger (`CngxCombobox`,
 * `CngxTypeahead`, `CngxActionSelect`, `CngxActionMultiSelect`). Up
 * until this factory existed those two effects — the
 * `skipInitial`-gated emit and the auto-open-on-typing — were
 * inlined per variant with the only divergence being the
 * `autoOpenGate` closure and whether the emit path existed at all
 * (variants with display-binding route emits through its
 * `onUserSearchTerm` callback).
 *
 * **Must run in an injection context.** Installs 1 or 2 `effect()`s
 * via Angular's default DestroyRef. Every external invocation is
 * wrapped in `untracked()` to avoid registering the `panelOpen`,
 * `disabled`, or display-binding reads as reactive dependencies.
 *
 * **DI override path.** The `CNGX_SEARCH_EFFECTS_FACTORY` token lets
 * enterprise consumers inject search telemetry, debounce-pipeline
 * overrides, or race-condition guards once instead of forking per
 * input-trigger variant.
 *
 * @category interactive
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
 * Factory-signature type — mirrors {@link createSearchEffects} so DI
 * overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxSearchEffectsFactory = (opts: SearchEffectsOptions) => void;

/**
 * DI token resolving the factory used to wire the shared search-term
 * effects. Defaults to {@link createSearchEffects}; override app-wide
 * via `providers: [{ provide: CNGX_SEARCH_EFFECTS_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to instrument search telemetry,
 * inject a custom debounce/throttle pipeline, or add race-condition
 * guards without forking any of the four input-trigger variants that
 * share this factory.
 *
 * Symmetrical to `CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY` (sibling
 * factory covering panel open/close lifecycle effects).
 *
 * @category interactive
 */
export const CNGX_SEARCH_EFFECTS_FACTORY =
  new InjectionToken<CngxSearchEffectsFactory>('CngxSearchEffectsFactory', {
    providedIn: 'root',
    factory: () => createSearchEffects,
  });
