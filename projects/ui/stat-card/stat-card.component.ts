import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxCard } from '@cngx/common/card';
import {
  CNGX_STAT,
  CngxStatCoordinator,
  resolveAsyncView,
  type CngxStatSlotKind,
} from '@cngx/common/data';
import { CngxSkeleton } from '@cngx/common/layout';
import {
  createLatencyProbe,
  injectLoadingConfig,
  resolveLoadingTreatment,
  type CngxAsyncState,
  type CngxLoadingTreatment,
} from '@cngx/core/utils';
import { CngxEmptyState } from '@cngx/ui/empty-state';
import { CngxLoadingIndicator } from '@cngx/ui/feedback';

import { injectStatCardConfig } from './config/inject-stat-card-config';

/** Placeholder shape for a card whose consumer projected no stat slots at all. */
const DEFAULT_SKELETON_SLOTS: readonly CngxStatSlotKind[] = ['label', 'value', 'caption'];

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
 *
 * <example-url>http://localhost:4200/#/ui/stat-card/basic/composed-kpi-tile</example-url>
 * <example-url>http://localhost:4200/#/ui/stat-card/async/latency-aware-loading</example-url>
 * <example-url>http://localhost:4200/#/ui/stat-card/async/error-and-refresh</example-url>
 */
@Component({
  selector: 'cngx-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxCard, CngxSkeleton, CngxLoadingIndicator, CngxEmptyState],
  hostDirectives: [CngxStatCoordinator],
  providers: [{ provide: CNGX_STAT, useExisting: CngxStatCoordinator }],
  host: {
    class: 'cngx-stat-card',
    '[attr.aria-busy]': 'busy() || null',
    '[class.cngx-stat-card--busy]': 'busy()',
  },
  template: `
    <cngx-card
      [attr.aria-labelledby]="cardLabelledBy()"
      [attr.aria-live]="live() === 'off' ? null : live()"
    >
      <!-- A refresh over existing content would otherwise be invisible: the view
           stays 'content' and only aria-busy flips, which says nothing to a
           sighted user. The indicator is absolutely placed and the figure only
           dims, so the tile never reflows while refreshing - a dashboard grid
           would otherwise twitch on every poll. It carries the loading config's
           show-delay and min-dwell, so a fast refresh never flashes. -->
      @if (showRefreshIndicator()) {
        <cngx-loading-indicator
          class="cngx-stat-card__refresh"
          [loading]="true"
          variant="spinner"
          [label]="busyLabel()"
        />
      }

      @switch (activeView()) {
        @case ('skeleton') {
          @if (resolvedTreatment() === 'skeleton') {
            <!-- Same container and same row structure as the content branch, so
                 each bar sits exactly where its text will, and the swap to
                 content does not resize the tile. -->
            <div
              class="cngx-stat-card__stat cngx-stat-card__stat--skeleton"
              [cngxSkeleton]="true"
              aria-hidden="true"
            >
              @if (skeletonSlots().includes('label')) {
                <span class="cngx-stat-card__skeleton-line cngx-stat-card__skeleton-line--label">
                </span>
              }
              <div class="cngx-stat-card__row">
                @if (skeletonSlots().includes('value')) {
                  <span class="cngx-stat-card__skeleton-line cngx-stat-card__skeleton-line--value">
                  </span>
                }
                @if (skeletonSlots().includes('delta')) {
                  <span class="cngx-stat-card__skeleton-line cngx-stat-card__skeleton-line--delta">
                  </span>
                }
              </div>
              @if (skeletonSlots().includes('caption')) {
                <span class="cngx-stat-card__skeleton-line cngx-stat-card__skeleton-line--caption">
                </span>
              }
            </div>
          } @else {
            <div class="cngx-stat-card__spinner">
              <cngx-loading-indicator [loading]="true" variant="spinner" [label]="busyLabel()" />
            </div>
          }
        }
        @case ('error') {
          <cngx-empty-state
            class="cngx-stat-card__error"
            [title]="errorText()"
            [description]="errorDescription()"
          >
            <!-- The stock empty-state glyph is an archive box, which reads
                 "nothing here" rather than "this failed". Projecting into the
                 icon slot hides it. Decorative: the title carries the message. -->
            <svg
              cngxEmptyStateIcon
              class="cngx-stat-card__error-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </cngx-empty-state>
        }
        @case ('empty') {
          <!-- A settle with no data is its own message, not blank metric
               slots pretending to be a figure. -->
          <cngx-empty-state class="cngx-stat-card__empty" [title]="emptyText()" />
        }
        @case ('none') {
          <!-- Idle first load: nothing was asked for yet, so the tile shows
               nothing - projected slots over absent data would read as a
               real (blank) figure. -->
        }
        @default {
          <div class="cngx-stat-card__stat">
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

  /** Headline of the error state shown instead of the stat when the first load failed. */
  readonly errorText = input<string>(this.config.ariaLabels?.errorFallback ?? 'Could not load');

  /** Supporting detail under {@link errorText}. Omitted when unset. */
  readonly errorDescription = input<string | undefined>(
    this.config.ariaLabels?.errorDescription,
  );

  /** Note appended below the stat when a refresh failed but stale data is still shown. */
  readonly staleText = input<string>(
    this.config.ariaLabels?.staleFallback ?? 'Showing last known value',
  );

  /** Headline of the empty state shown when a load settled with no data. */
  readonly emptyText = input<string>(this.config.ariaLabels?.emptyFallback ?? 'No data');

  /**
   * Politeness of the tile's live region. `off` (default) for a static KPI;
   * `polite` for a tile that refreshes on a timer, so the new figure is
   * announced instead of changing silently. Mirrors `CngxStat.live`.
   */
  readonly live = input<'off' | 'polite' | 'assertive'>('off');

  /** @internal Whether any operation is running. Drives `aria-busy` (Pillar 2). */
  protected readonly busy = computed(() => this.state()?.isBusy() ?? false);

  /**
   * @internal Which bars the placeholder draws. Mirrors the slots the consumer
   * actually projected, so a tile without a delta gets no delta bar. Falls back
   * to the common label / value / caption shape when nothing has registered -
   * a card with no stat slots at all still needs a plausible placeholder.
   */
  protected readonly skeletonSlots = computed<readonly CngxStatSlotKind[]>(() => {
    const present = this.coordinator.presentKinds();
    return present.length > 0 ? present : DEFAULT_SKELETON_SLOTS;
  });

  /**
   * @internal A refresh over content the user can still read. The skeleton and
   * spinner branches already carry their own busy signal, so the bar would be
   * redundant there.
   */
  protected readonly showRefreshIndicator = computed(
    () => this.busy() && this.activeView() !== 'skeleton',
  );

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
  protected readonly resolvedTreatment = computed(() =>
    resolveLoadingTreatment(
      this.loadingTreatment(),
      this.probe.lastDuration(),
      this.loadingConfig.spinnerVsSkeletonCutoff,
    ),
  );

  /**
   * @internal The card element carries the accessible name, so the tile is one
   * named region instead of an unnamed `article` wrapped around a named group.
   * Null while the stat is not rendered: the slot ids live inside the content
   * branch, and pointing at ids that are out of the DOM reads as unnamed anyway.
   */
  protected readonly cardLabelledBy = computed(() => {
    const view = this.activeView();
    const showsStat = view === 'content' || view === 'content+error';
    return showsStat ? this.coordinator.labelledBy() : null;
  });

  /**
   * @internal Which body the card renders. Delegates to the shared
   * `resolveAsyncView` lookup table so the tile cannot drift from every other
   * async surface. Without a bound `[state]` the card always shows its content.
   */
  protected readonly activeView = computed(() => {
    const s = this.state();
    if (!s) {
      return 'content' as const;
    }
    const view = resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
    // A non-first-load busy phase over an empty tile resolves to content in
    // the lookup table - blank metric slots posing as a figure. A load with
    // nothing on screen is a load (same correction the timeline applies).
    if (view === 'content' && s.isEmpty() && s.isBusy()) {
      return 'skeleton' as const;
    }
    return view;
  });
}
