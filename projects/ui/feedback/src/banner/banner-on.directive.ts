import {
  afterNextRender,
  Directive,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  untracked,
} from '@angular/core';
import {
  CNGX_STATEFUL,
  createTransitionTracker,
  type CngxAsyncState,
} from '@cngx/core/utils';

import { CngxBanner } from './banner.service';

/**
 * Declarative state-to-banner bridge.
 *
 * Place on any element — shows a global banner when the bound `CngxAsyncState`
 * transitions to `error`. Dismisses automatically on `success` or `idle`.
 * Only fires on actual transitions, not on initial `idle` state.
 *
 * @usageNotes
 *
 * ```html
 * <div [cngxBannerOn]="connectionState"
 *   bannerId="net:offline"
 *   bannerError="You are offline. Changes will sync when reconnected.">
 * </div>
 * ```
 *
 * @category feedback
 */
@Directive({
  selector: '[cngxBannerOn]',
  standalone: true,
})
export class CngxBannerOn {
  private readonly bannerService = inject(CngxBanner, { optional: true });
  private readonly statefulFallback = inject(CNGX_STATEFUL, { optional: true });

  /**
   * The async state to watch. Optional — when omitted, falls back to
   * `CNGX_STATEFUL` from an ancestor/self component. A bare `cngxBannerOn`
   * attribute is treated as "no input bound".
   */
  readonly state = input<CngxAsyncState<unknown> | undefined, CngxAsyncState<unknown> | '' | undefined>(
    undefined,
    {
      alias: 'cngxBannerOn',
      transform: (v) => (typeof v === 'string' ? undefined : v),
    },
  );

  /** Effective state — input wins over ancestor `CNGX_STATEFUL`. */
  private readonly effectiveState = computed<CngxAsyncState<unknown> | undefined>(
    () => this.state() ?? this.statefulFallback?.state,
  );

  /** Required banner id — dedup key. */
  readonly bannerId = input.required<string>();

  /** Banner message on error. */
  readonly bannerError = input<string | undefined>(undefined);

  /** Banner severity on error. Default `'error'`. */
  readonly bannerSeverity = input<'error' | 'warning'>('error');

  /** Include error detail in the message. */
  readonly bannerErrorDetail = input<boolean>(false);

  constructor() {
    if (!this.bannerService) {
      throw new Error(
        '[cngxBannerOn] CngxBanner not found. ' + 'Add withBanners() to provideFeedback().',
      );
    }
    const banner = this.bannerService;

    if (isDevMode()) {
      // One-shot post-binding check — runs once after inputs are bound. Uses
      // afterNextRender instead of an effect so we don't leave a dead node in
      // the reactive graph for the lifetime of the directive.
      afterNextRender(() => {
        if (this.state() === undefined && !this.statefulFallback) {
          console.error(
            '[cngxBannerOn] No state source. Bind [cngxBannerOn]="state" explicitly or ' +
              'place inside a component that provides CNGX_STATEFUL.',
          );
        }
      });
    }

    const tracker = createTransitionTracker(() => this.effectiveState()?.status() ?? 'idle');

    effect(() => {
      // Only tracker is tracked. All other signal reads happen inside untracked()
      // below to keep the effect's dependency graph flat.
      const status = tracker.current();
      const previous = tracker.previous();

      if (status === previous) {
        return;
      }

      untracked(() => {
        const s = this.effectiveState();
        if (!s) {
          return;
        }

        if (status === 'error') {
          const msg = this.bannerError();
          if (msg) {
            const err = s.error();
            const detail =
              this.bannerErrorDetail() && err != null
                ? err instanceof Error
                  ? err.message
                  : typeof err === 'string'
                    ? err
                    : undefined
                : undefined;
            banner.show({
              message: detail ? `${msg}: ${detail}` : msg,
              id: this.bannerId(),
              severity: this.bannerSeverity(),
            });
          }
        }

        // Auto-dismiss on success or idle (condition resolved)
        if (status === 'success' || status === 'idle') {
          banner.dismiss(this.bannerId());
        }
      });
    });
  }
}
