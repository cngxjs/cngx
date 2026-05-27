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
 * ```html
 * <div [cngxBannerOn]="connectionState"
 *   bannerId="net:offline"
 *   bannerError="You are offline. Changes will sync when reconnected.">
 * </div>
 * ```
 *
 * @category ui/feedback/banner
 *
 * <example-url>http://localhost:4200/#/ui/tabs/tab-commit-action/optimistic-pessimistic-commits-with-bridge-directives</example-url>
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
      // afterNextRender, not effect — one-shot post-binding check, no dead node in the reactive graph.
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
      // Flat graph — only the tracker is tracked, every other read sits in untracked() below.
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

        if (status === 'success' || status === 'idle') {
          banner.dismiss(this.bannerId());
        }
      });
    });
  }
}
