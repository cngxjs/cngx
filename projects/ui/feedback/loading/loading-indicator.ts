import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { createVisibilityGate, injectLoadingConfig, type CngxAsyncState } from '@cngx/core/utils';

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';

/**
 * Visual variant for the loading indicator.
 *
 * @category ui/feedback/loading
 */
export type LoadingIndicatorVariant = 'spinner' | 'bar';

/**
 * Loading indicator atom - purely visual, blocks no interaction.
 *
 * Two variants:
 * - `spinner` - rotating circle, inline or centered
 * - `bar` - thin line at the top of the container (YouTube-style)
 *
 * Timing (defaults from `CNGX_LOADING_CONFIG`):
 * - `delay` (default 120ms): operations faster than this never show the indicator
 * - `minDwell` (default 400ms): once visible, stays for at least this long
 *
 * For content-blocking overlays, use `cngx-loading-overlay` instead.
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
 * @category ui/feedback/loading
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/loading/loading-indicator.ts
 * @since 0.1.0
 * @relatedTo CngxLoadingOverlay, CngxProgress, CngxAsyncContainer
 *
 * <example-url>http://localhost:4200/#/ui/feedback/loading-indicator/bar-variant</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/loading-indicator/spinner-variant</example-url>
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
  styleUrls: ['./loading-indicator.css'],
})
export class CngxLoadingIndicator {
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });
  private readonly loadingConfig = injectLoadingConfig();

  /** Bind an async state - shows indicator when `isBusy()`. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** Direct boolean control - alternative to `[state]`. */
  readonly loading = input<boolean>(false);

  /** Visual variant. */
  readonly variant = input<LoadingIndicatorVariant>('spinner');

  /** Screen reader label. */
  readonly label = input<string>('Loading');

  /** Delay in ms before showing the indicator. Defaults to `CNGX_LOADING_CONFIG.showDelay`. */
  readonly delay = input<number>(this.loadingConfig.showDelay);

  /** Minimum display time in ms once visible. Defaults to `CNGX_LOADING_CONFIG.minDwell`. */
  readonly minDwell = input<number>(this.loadingConfig.minDwell);

  /**
   * @deprecated Use `minDwell`. Kept one release for migration; when set, it
   * takes precedence over `minDwell`.
   */
  readonly minDuration = input<number | undefined>(undefined);

  /** @internal - true when the underlying source says "loading". */
  protected readonly isActive = computed(() => this.state()?.isBusy() ?? this.loading());

  /** @internal - custom spinner component from global config. */
  protected readonly customSpinner = computed(() => this.config?.spinnerComponent ?? null);

  /** @internal - deprecated `minDuration` alias forwards to `minDwell`. */
  protected readonly effectiveMinDwell = computed(() => this.minDuration() ?? this.minDwell());

  /** @internal - final visibility after delay + minDwell. */
  readonly visible = createVisibilityGate(this.isActive, this.delay, this.effectiveMinDwell);
}
