import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { CngxLiveRegion } from '@cngx/common/a11y';
import { CngxPaginate, connectPaginateResetOn } from '@cngx/common/data';
import { CngxProgress } from '@cngx/ui/feedback';

import { CNGX_PAGINATOR_ANNOUNCER_FACTORY } from './paginator-announcer';
import { injectPaginatorConfig } from './paginator-config';
import { CNGX_PAGINATOR_HOST } from './paginator-host.token';
import { CngxPaginatorLoading } from './paginator-loading.directive';

/** Visual skin. Paint-only - structure, ARIA, and keyboard behaviour are identical across values. */
export type CngxPaginatorSkin =
  | 'numbered'
  | 'minimal'
  | 'pill'
  | 'segmented'
  | 'rail'
  | 'dots'
  | 'bar';

/** Density preset. Shifts spacing/hit-target tokens; orthogonal to skin. */
export type CngxPaginatorDensity = 'compact' | 'default' | 'comfortable';

/**
 * Declarative, skinnable pagination organism. \
 * A thin shell over the `CngxPaginate` brain (applied as a `hostDirective`), assembled by the
 * consumer from projected segment parts in DOM order - no `show*` config inputs.
 * `skin` / `density` are single paint attributes reflected onto `[data-skin]` / `[data-density]`.  \
 *
 * Two-way `[(pageIndex)]` / `[(pageSize)]`:  \
 * the brain's controlled inputs are aliased through `hostDirectives` (`cngxPageIndex` -> `pageIndex`, `cngxPageSize` -> `pageSize`);  \
 * the shell owns the matching `pageIndexChange` / `pageSizeChange` outputs and is their single emitter,
 * guarded by the shared `lastEmitted*` fields.  \
 * Two paths feed each output once:
 * (1) a subscription forwards the brain's nav-only `pageChange` /
 * `pageSizeChange` - the only signal that captures a controlled-mode `setPage`,
 * because the brain's `pageIndex()` stays pinned to the input until the
 * consumer feeds it back;  \
 * (2) an `effect()` reads the effective `pageIndex()` / `pageSize()` and covers a `total`-shrink clamp the nav-only
 * output misses.  \
 * The brain output is forwarded, NOT aliased through
 * `hostDirectives`:  \
 * a raw alias would bypass the shared guard and double-emit
 * on uncontrolled navigation.
 *
 * All ARIA attributes are signal-driven. `aria-busy` has a single owner here.
 *
 * @category ui/paginator
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator.component.ts
 * @since 0.1.0
 * @relatedTo CngxPaginate, CngxMatPaginator
 * @playground Material theme coverage across all skins ./examples/material-theme-coverage/skins-coverage.component.ts
 * @playground Data-table footer (Material) ./examples/data-table/data-table.component.ts
 * @playground Live filter with reset-to-first-page ./examples/filter-reset/filter-reset.component.ts
 * @playground Card grid with go-to and responsive collapse ./examples/card-grid/card-grid.component.ts
 * @playground Alphabetical bucket paging ./examples/alpha-mode/alpha-mode.component.ts
 * @playground Load-more (append) paging ./examples/load-more-mode/load-more-mode.component.ts
 * @playground Infinite scroll paging ./examples/infinite-mode/infinite-mode.component.ts
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/numbered</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/minimal</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/pill</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/segmented</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/rail</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/dots</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/bar</example-url>
 */
@Component({
  selector: 'cngx-paginator',
  exportAs: 'cngxPaginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxProgress, CngxLiveRegion, NgTemplateOutlet],
  templateUrl: './paginator.component.html',
  styleUrls: ['../../common/data/paginate/styles/paginator-base.css', './paginator.component.css'],
  hostDirectives: [
    {
      directive: CngxPaginate,
      inputs: ['cngxPageIndex: pageIndex', 'cngxPageSize: pageSize', 'total', 'state'],
    },
  ],
  providers: [{ provide: CNGX_PAGINATOR_HOST, useExisting: CngxPaginate }],
  host: {
    class: 'cngx-paginator',
    role: 'navigation',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-busy]': 'paginate.isBusy()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-paginator-size]': 'density()',
    '[attr.data-responsive]': "responsive() ? '' : null",
  },
})
export class CngxPaginator {
  /** Accessible name for the navigation landmark. Overrides the config default. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Visual skin; reflected onto `[data-skin]`. */
  readonly skin = input<CngxPaginatorSkin>('numbered');
  /**
   * Private size preset (hit-target + type); reflected onto
   * `[data-paginator-size]`, NOT the global `[data-density]`. Spacing is a
   * global concern derived from `--cngx-space-*`, so a root `[data-density]`
   * compacts this paginator's gaps like every other component; this input keeps
   * only the touch-target sizing the global scale does not yet cover.
   */
  readonly density = input<CngxPaginatorDensity>('default');
  /**
   * Opt into the responsive collapse; reflected onto `[data-responsive]`. When
   * set, a `@container` rule swaps the projected `cngx-pgn-pages` number row for
   * a `cngx-pgn-status` "Page n of m" readout once the paginator's own container
   * narrows past the collapse breakpoint. Compose both segments for it to apply.
   */
  readonly responsive = input(false, { transform: booleanAttribute });

  /**
   * Reset key. When its value changes (after the initial render) the paginator
   * jumps to the first page - bind the sort / filter / search value a result set
   * depends on so a narrowed result never strands the user on a now-empty page.
   * Bind a primitive or a `computed`; an inline array / object literal
   * recomputes every change-detection pass and would reset on each. Shares the
   * `connectPaginateResetOn` implementation with `[cngxPaginateResetOn]`.
   */
  readonly resetOn = input<unknown>(undefined);

  /** Emits the effective page index on every change - navigation or `total`-shrink clamp. */
  readonly pageIndexChange = output<number>();
  /** Emits the effective page size on every change. */
  readonly pageSizeChange = output<number>();

  protected readonly paginate = inject(CngxPaginate);
  protected readonly config = injectPaginatorConfig();
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Live-region message source - mounted onto the `cngxLiveRegion` span in the
   * template. Built through the swap token so a consumer can wrap the
   * busy / settle / page-change derivation without forking the shell.
   */
  protected readonly announcer = inject(CNGX_PAGINATOR_ANNOUNCER_FACTORY)();

  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() ?? this.config.ariaLabels.label,
  );

  // Loading-slot cascade: instance *cngxPaginatorLoading -> config default ->
  // built-in <cngx-progress>. Direct contentChild field initialiser (AOT
  // NG8110 rejects it from a helper). Returns existing TemplateRef references
  // or null - reference-stable, so no explicit equal fn is needed.
  protected readonly loadingSlot = contentChild(CngxPaginatorLoading, { read: TemplateRef });
  protected readonly loadingTemplate = computed(
    () => this.loadingSlot() ?? this.config.templates?.loading ?? null,
  );

  // Shared last-emitted guards across the nav (subscription) and clamp (effect)
  // paths. Plain non-signal fields, so the effects carry no signal write.
  // Seeded with the current effective values so mounting emits no initial change.
  private lastEmittedIndex = this.paginate.pageIndex();
  private lastEmittedSize = this.paginate.pageSize();

  constructor() {
    // Reset-on-change, shared verbatim with the bridge input and the generic
    // [cngxPaginateResetOn] directive.
    connectPaginateResetOn(this.paginate, this.resetOn);

    // Nav path. Forward the brain's nav-only outputs: in controlled mode a
    // setPage leaves the effective pageIndex() pinned to the input, so this
    // event is the only thing that reports the navigation. Forwarded (not
    // aliased) so the guard is shared with the clamp effect below.
    const indexSub = this.paginate.pageChange.subscribe((index) => {
      if (index !== this.lastEmittedIndex) {
        this.lastEmittedIndex = index;
        this.pageIndexChange.emit(index);
      }
    });
    const sizeSub = this.paginate.pageSizeChange.subscribe((size) => {
      if (size !== this.lastEmittedSize) {
        this.lastEmittedSize = size;
        this.pageSizeChange.emit(size);
      }
    });
    this.destroyRef.onDestroy(() => {
      indexSub.unsubscribe();
      sizeSub.unsubscribe();
    });

    // Clamp path. The effective pageIndex moved without a nav (a total-shrink
    // clamp the nav-only pageChange misses). The shared guard means a value the
    // nav path already emitted is a no-op here, so each change emits once.
    effect(() => {
      const index = this.paginate.pageIndex();
      if (index !== this.lastEmittedIndex) {
        this.lastEmittedIndex = index;
        this.pageIndexChange.emit(index);
      }
    });
    effect(() => {
      const size = this.paginate.pageSize();
      if (size !== this.lastEmittedSize) {
        this.lastEmittedSize = size;
        this.pageSizeChange.emit(size);
      }
    });
  }
}
