import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CNGX_FEEDBACK_CONFIG } from './feedback-config';
import { createVisibilityTimer } from './visibility-timer';

/** Visual variant for the loading indicator. */
export type LoadingIndicatorVariant = 'spinner' | 'bar';

/**
 * Loading indicator atom — purely visual, blocks no interaction.
 *
 * Two variants:
 * - `spinner` — rotating circle, inline or centered
 * - `bar` — thin line at the top of the container (YouTube-style)
 *
 * Timing:
 * - `delay` (default 200ms): operations faster than this never show the indicator
 * - `minDuration` (default 500ms): once visible, stays for at least this long
 *
 * For content-blocking overlays, use `cngx-loading-overlay` instead.
 *
 * @usageNotes
 *
 * ### With async state
 * ```html
 * <cngx-loading-indicator [state]="residents" variant="bar" />
 * ```
 *
 * ### Manual boolean
 * ```html
 * <cngx-loading-indicator [loading]="isLoading()" label="Fetching data" />
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-loading-indicator',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-loading-indicator',
    '[class.cngx-loading-indicator--visible]': 'visible()',
    '[class.cngx-loading-indicator--spinner]': 'variant() === "spinner"',
    '[class.cngx-loading-indicator--bar]': 'variant() === "bar"',
    '[attr.role]': '"status"',
    '[attr.aria-live]': '"polite"',
    '[attr.aria-label]': 'visible() ? label() : null',
    '[attr.aria-busy]': 'isActive() || null',
  },
  template: `
    @if (visible()) {
      @if (variant() === 'spinner') {
        @if (customSpinner(); as cmp) {
          <ng-container *ngComponentOutlet="cmp" />
        } @else {
          <svg class="cngx-loading-indicator__spinner" aria-hidden="true" viewBox="0 0 50 50">
            <circle
              class="cngx-loading-indicator__spinner-track"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke-width="4"
            />
            <circle
              class="cngx-loading-indicator__spinner-arc"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke-width="4"
              stroke-dasharray="80, 200"
              stroke-dashoffset="0"
              stroke-linecap="round"
            />
          </svg>
        }
      } @else {
        <div class="cngx-loading-indicator__bar">
          <div class="cngx-loading-indicator__bar-fill"></div>
        </div>
      }
    }
  `,
  styles: `
    .cngx-loading-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .cngx-loading-indicator--bar {
      display: block;
      width: 100%;
      height: var(--cngx-loading-bar-height, 3px);
    }

    .cngx-loading-indicator__spinner {
      width: var(--cngx-loading-indicator-size, 24px);
      height: var(--cngx-loading-indicator-size, 24px);
      animation: cngx-spin 0.8s linear infinite;
    }

    .cngx-loading-indicator__spinner-track {
      stroke: var(--cngx-loading-indicator-track, rgba(0, 0, 0, 0.1));
    }

    .cngx-loading-indicator__spinner-arc {
      stroke: var(--cngx-loading-indicator-color, currentColor);
    }

    .cngx-loading-indicator__bar {
      width: 100%;
      height: 100%;
      background: var(--cngx-loading-indicator-track, rgba(0, 0, 0, 0.1));
      overflow: hidden;
      border-radius: var(--cngx-loading-bar-radius, 0);
    }

    .cngx-loading-indicator__bar-fill {
      width: 40%;
      height: 100%;
      background: var(--cngx-loading-indicator-color, currentColor);
      border-radius: inherit;
      animation: cngx-bar-indeterminate 1.5s ease-in-out infinite;
    }

    @keyframes cngx-spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes cngx-bar-indeterminate {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(150%);
      }
      100% {
        transform: translateX(400%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cngx-loading-indicator__spinner {
        animation: cngx-pulse 2s ease-in-out infinite;
      }

      .cngx-loading-indicator__bar-fill {
        animation: cngx-pulse 2s ease-in-out infinite;
        width: 100%;
        transform: none;
      }

      @keyframes cngx-pulse {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 1;
        }
      }
    }
  `,
})
export class CngxLoadingIndicator {
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /** Bind an async state — shows indicator when `isBusy()`. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Direct boolean control — alternative to `[state]`. */
  readonly loading = input<boolean>(false);

  /** Visual variant. */
  readonly variant = input<LoadingIndicatorVariant>('spinner');

  /** Screen reader label. */
  readonly label = input<string>('Loading');

  /** Delay in ms before showing the indicator. Falls back to global config, then 200ms. */
  readonly delay = input<number>(this.config?.loadingDelay ?? 200);

  /** Minimum display time in ms once visible. Falls back to global config, then 500ms. */
  readonly minDuration = input<number>(this.config?.loadingMinDuration ?? 500);

  /** @internal — true when the underlying source says "loading". */
  protected readonly isActive = computed(() => this.state()?.isBusy() ?? this.loading());

  /** @internal — custom spinner component from global config. */
  protected readonly customSpinner = computed(() => this.config?.spinnerComponent ?? null);

  /** @internal — final visibility after delay + minDuration. */
  readonly visible = createVisibilityTimer(this.isActive, this.delay, this.minDuration);
}
