import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { CngxRovingTabindex } from '@cngx/common/a11y';

import { CngxCardGridEmpty } from './card-grid-empty.directive';
import type { EmptyReason } from './card.types';

/**
 * Responsive card grid layout with intrinsic sizing, keyboard navigation,
 * and reason-based empty-state template selection.
 *
 * Uses CSS Grid with `auto-fill` + `minmax` for intrinsic responsiveness —
 * no breakpoint management required.
 *
 * Keyboard navigation is provided by `CngxRovingTabindex` as a host directive.
 * Arrow keys navigate between cards; Enter/Space activates.
 *
 * @usageNotes
 *
 * ### Basic grid
 * ```html
 * <cngx-card-grid minWidth="280px">
 *   <cngx-card>...</cngx-card>
 *   <cngx-card>...</cngx-card>
 * </cngx-card-grid>
 * ```
 *
 * ### With empty state
 * ```html
 * <cngx-card-grid [items]="items()" [emptyReason]="emptyReason()">
 *   @for (item of items(); track item.id) {
 *     <cngx-card>...</cngx-card>
 *   }
 *   <ng-template cngxCardGridEmpty="no-results">
 *     <cngx-empty-state title="No results" />
 *   </ng-template>
 *   <ng-template cngxCardGridEmpty>
 *     <cngx-empty-state title="Nothing here yet" />
 *   </ng-template>
 * </cngx-card-grid>
 * ```
 *
 * @category card
 */
@Component({
  selector: 'cngx-card-grid',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxRovingTabindex,
      inputs: ['orientation', 'loop', 'activeIndex'],
    },
  ],
  host: {
    class: 'cngx-card-grid',
    '[attr.role]': 'semanticList() ? "list" : null',
    '[attr.aria-busy]': 'isLoading() || null',
    '[style.--cngx-card-grid-min]': 'minWidth()',
    '[style.--cngx-card-grid-gap]': 'density() === "default" ? gap() : null',
    '[class.cngx-card-grid--compact]': 'density() === "compact"',
    '[class.cngx-card-grid--comfortable]': 'density() === "comfortable"',
  },
  template: `
    @if (!empty()) {
      <ng-content />
    } @else if (activeEmptyTemplate()) {
      <ng-container [ngTemplateOutlet]="activeEmptyTemplate()!.templateRef" />
    }
  `,
})
export class CngxCardGrid {
  /** Minimum card width for the CSS Grid `minmax()` function. */
  readonly minWidth = input<string>('280px');

  /** Gap between grid items. */
  readonly gap = input<string>('var(--cngx-gap-md, 16px)');

  /** Grid density level — controls gap and card padding via CSS custom properties. */
  readonly density = input<'compact' | 'default' | 'comfortable'>('default');

  /** Whether the grid should have `role="list"`. Requires `role="listitem"` on each card. */
  readonly semanticList = input<boolean>(false);

  /**
   * Optional data source. When provided and empty, the grid shows the matching
   * empty-state template. When omitted, the grid is a pure layout tool.
   */
  readonly items = input<readonly unknown[] | undefined>(undefined);

  /** Reason why items are empty — selects the matching `cngxCardGridEmpty` template. */
  readonly emptyReason = input<EmptyReason | undefined>(undefined);

  /**
   * Bind an async state — drives loading and empty from a single source.
   * When set, `isLoading` derives from `state.isFirstLoad()` and
   * `empty` derives from `state.isEmpty()` (overrides `[items]`).
   */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** `true` during initial data load (skeleton phase). */
  readonly isLoading = computed(() => this.state()?.isFirstLoad() ?? false);

  /** Whether the grid should show an empty state. */
  readonly empty = computed(() => {
    const s = this.state();
    if (s) {
      return s.isEmpty();
    }
    const i = this.items();
    return i?.length === 0;
  });

  /** @internal All `ng-template[cngxCardGridEmpty]` instances projected by the consumer. */
  private readonly emptyTemplates = contentChildren(CngxCardGridEmpty);

  /**
   * @internal Selects the template matching `emptyReason`.
   * Falls back to a template without a reason as default.
   */
  readonly activeEmptyTemplate = computed(() => {
    const reason = this.emptyReason();
    const templates = this.emptyTemplates();
    const fallback = templates.find((t) => !t.reason());
    if (!reason) {
      return fallback;
    }
    return templates.find((t) => t.reason() === reason) ?? fallback;
  });
}
