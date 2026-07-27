import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxCard } from '@cngx/common/card';
import { CNGX_STAT, CngxStatCoordinator, resolveAsyncView } from '@cngx/common/data';
import { CngxSkeleton } from '@cngx/common/layout';
import {
  createLatencyProbe,
  injectLoadingConfig,
  resolveLoadingTreatment,
  type CngxAsyncState,
  type CngxLoadingTreatment,
} from '@cngx/core/utils';
import { CngxLoadingIndicator } from '@cngx/ui/feedback';

import { injectStatCardConfig } from './config/inject-stat-card-config';

/**
 * Card-framed KPI tile: one `<cngx-stat-card>` renders a complete dashboard
 * metric - card surface, coordinated stat slots, an inline visualisation, a
 * footer, and the async view switch - from a single `[state]`.
 *
 * The stat slots are the existing `cngxStatLabel` / `cngxStatValue` /
 * `cngxStatDelta` / `cngxStatCaption` atoms from `@cngx/common/data`, not
 * copies. They resolve `CNGX_STAT` against their declaration site, so the card
 * hosts the same {@link CngxStatCoordinator} brain `CngxStat` hosts and
 * re-points the token at it - the shape `CngxIncrementalList` uses for
 * `CNGX_PAGINATOR_HOST`. A screen reader therefore reads the tile as one
 * phrase, not four fragments (Pillar 2).
 *
 * The view switch is a pure `computed()` off `[state]` via `resolveAsyncView`
 * (Pillar 1) - there is no second state machine and no boolean fallback inputs.
 *
 * Like `cngx-chart`, the card does **not** provide `CNGX_STATEFUL`: the
 * consumer already holds the state object it bound, so transition bridges take
 * it directly, e.g. `<cngx-toast-on [state]="revenue" />`.
 *
 * ```html
 * <cngx-stat-card [state]="revenue">
 *   <span cngxStatLabel>Revenue</span>
 *   <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
 *   <cngx-delta cngxStatDelta [value]="5.3" />
 *   <span cngxStatCaption>vs. last quarter</span>
 *   <cngx-sparkline cngxStatCardViz [data]="trend()" />
 * </cngx-stat-card>
 * ```
 *
 * @category ui/stat-card
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stat-card/stat-card.component.ts
 * @since 0.1.0
 * @relatedTo CngxStat, CngxStatCoordinator, CngxStatCardViz, CngxStatCardFooter, CngxCard
 */
@Component({
  selector: 'cngx-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxCard, CngxSkeleton, CngxLoadingIndicator],
  hostDirectives: [CngxStatCoordinator],
  providers: [{ provide: CNGX_STAT, useExisting: CngxStatCoordinator }],
  host: {
    class: 'cngx-stat-card',
    '[attr.aria-busy]': 'busy() || null',
    '[class.cngx-stat-card--busy]': 'busy()',
  },
  template: `
    <cngx-card>
      @switch (activeView()) {
        @case ('skeleton') {
          @if (resolvedTreatment() === 'skeleton') {
            <div
              class="cngx-stat-card__skeleton"
              [cngxSkeleton]="true"
              [count]="3"
              #sk="cngxSkeleton"
            >
              @for (i of sk.indices(); track i) {
                <div class="cngx-stat-card__skeleton-line" aria-hidden="true"></div>
              }
            </div>
          } @else {
            <div class="cngx-stat-card__spinner">
              <cngx-loading-indicator [loading]="true" variant="spinner" [label]="busyLabel()" />
            </div>
          }
        }
        @case ('error') {
          <p class="cngx-stat-card__error">{{ errorText() }}</p>
        }
        @default {
          <div
            class="cngx-stat-card__stat"
            role="group"
            [attr.aria-labelledby]="coordinator.labelledBy()"
          >
            <ng-content select="[cngxStatLabel]" />
            <div class="cngx-stat-card__row">
              <ng-content select="[cngxStatValue]" />
              <ng-content select="[cngxStatDelta]" />
            </div>
            <ng-content select="[cngxStatCaption]" />
          </div>

          <ng-content select="[cngxStatCardViz]" />

          @if (activeView() === 'content+error') {
            <p class="cngx-stat-card__stale">{{ staleText() }}</p>
          }
        }
      }

      <ng-content select="[cngxStatCardFooter]" />
    </cngx-card>
  `,
  styleUrls: ['./stat-card.component.css'],
})
export class CngxStatCard {
  /** @internal The shared slot-id brain, applied as a host directive. */
  protected readonly coordinator = inject(CngxStatCoordinator, { host: true });

  private readonly config = injectStatCardConfig();

  /**
   * The tile's async envelope. Every view decision derives from it; there are
   * no discrete `loading` / `error` boolean fallbacks. Optional per the
   * bridge-input rule, so `[state]` may be bound conditionally.
   */
  readonly state = input<CngxAsyncState<unknown> | undefined, CngxAsyncState<unknown> | '' | undefined>(
    undefined,
    { transform: (v) => (typeof v === 'string' ? undefined : v) },
  );

  /**
   * What the card shows while it loads. `'auto'` (default) picks from the
   * latency the tile itself observed: a tile whose last load was quick shows a
   * spinner blip, one whose last load dragged shows a skeleton. `'spinner'` and
   * `'skeleton'` pin the choice.
   */
  readonly loadingTreatment = input<CngxLoadingTreatment>(this.config.loadingTreatment ?? 'auto');

  /** Accessible label announced while the card is loading. */
  readonly busyLabel = input<string>(this.config.ariaLabels?.busy ?? 'Loading');

  /** Message shown instead of the stat when the first load failed. */
  readonly errorText = input<string>(this.config.ariaLabels?.errorFallback ?? 'Could not load');

  /** Note appended below the stat when a refresh failed but stale data is still shown. */
  readonly staleText = input<string>(
    this.config.ariaLabels?.staleFallback ?? 'Showing last known value',
  );

  /** Whether any operation is running. Drives `aria-busy` (Pillar 2). */
  readonly busy = computed(() => this.state()?.isBusy() ?? false);

  private readonly loadingConfig = injectLoadingConfig();

  /**
   * Measures how long this tile's own busy windows last. The measurement is a
   * wall-clock sample the probe writes from an effect; the selection below stays
   * a pure `computed()`, so nothing in the reactive graph writes state.
   */
  private readonly probe = createLatencyProbe(() => this.busy());

  /**
   * Spinner or skeleton for the current load, from the observed latency and the
   * cascaded cutoff. Never a hardcoded millisecond threshold - the cutoff always
   * comes from `CNGX_LOADING_CONFIG`, so one `provideLoadingConfig(...)` retunes
   * every tile in the app.
   */
  readonly resolvedTreatment = computed(() =>
    resolveLoadingTreatment(
      this.loadingTreatment(),
      this.probe.lastDuration(),
      this.loadingConfig.spinnerVsSkeletonCutoff,
    ),
  );

  /**
   * Which body the card renders. Delegates to the shared `resolveAsyncView`
   * lookup table so the tile cannot drift from every other async surface.
   * Without a bound `[state]` the card always shows its content.
   */
  readonly activeView = computed(() => {
    const s = this.state();
    if (!s) {
      return 'content' as const;
    }
    return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
  });
}
