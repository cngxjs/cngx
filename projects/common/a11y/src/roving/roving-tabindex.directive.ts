import {
  afterNextRender,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

/**
 * Marker directive for items managed by `CngxRovingTabindex`.
 *
 * Place on each focusable child inside a `[cngxRovingTabindex]` container.
 * The roving tabindex controller sets `tabindex="0"` on the active item
 * and `tabindex="-1"` on all others.
 *
 * ```html
 * <div cngxRovingTabindex>
 *   <button cngxRovingItem>One</button>
 *   <button cngxRovingItem>Two</button>
 *   <button cngxRovingItem>Three</button>
 * </div>
 * ```
 *
 * @category a11y
 */
@Directive({
  selector: '[cngxRovingItem]',
  exportAs: 'cngxRovingItem',
  standalone: true,
})
export class CngxRovingItem {
  /** @internal Reference used by the parent `CngxRovingTabindex` to set `tabindex`. */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Whether this item is disabled and should be skipped during navigation. */
  readonly disabled = input<boolean>(false, { alias: 'cngxRovingItemDisabled' });

  /** Programmatically focus this item. Called by the parent on arrow-key navigation. */
  focus(): void {
    (this.elementRef.nativeElement as HTMLElement).focus();
  }
}

/**
 * Implements the WAI-ARIA roving tabindex pattern for composite widgets.
 *
 * Only the active item in the group has `tabindex="0"` — all others get
 * `tabindex="-1"`. Arrow keys move focus within the group; Tab leaves it.
 * Home/End jump to first/last item.
 *
 * Works for toolbars, tab lists, card grids, menu bars, and any composite
 * widget where only one item should be in the tab order at a time.
 *
 * ### Virtual mode
 *
 * When `virtualCount` is set, `activeIndex` ranges from 0 to `virtualCount - 1`
 * instead of being bounded by `contentChildren.length`. Items are matched by
 * `data-cngx-recycle-index` attribute. When the target item is not in the DOM
 * (out of rendered range), `pendingFocus` is set so a wiring function like
 * `connectRecyclerToRoving()` can scroll it into view.
 *
 * @usageNotes
 *
 * ### Horizontal toolbar
 * ```html
 * <div cngxRovingTabindex orientation="horizontal" #rv="cngxRovingTabindex">
 *   <button cngxRovingItem>Cut</button>
 *   <button cngxRovingItem>Copy</button>
 *   <button cngxRovingItem>Paste</button>
 * </div>
 * ```
 *
 * ### Vertical menu with controlled index
 * ```html
 * <ul cngxRovingTabindex orientation="vertical" [(activeIndex)]="selectedIdx">
 *   @for (item of items(); track item.id) {
 *     <li cngxRovingItem>{{ item.label }}</li>
 *   }
 * </ul>
 * ```
 *
 * ### Virtual scroll integration
 * ```html
 * <div cngxRovingTabindex orientation="vertical" [virtualCount]="recycler.ariaSetSize()">
 *   @for (item of visibleItems(); track item.id; let i = $index) {
 *     <div cngxRovingItem [cngxVirtualItem]="recycler" [cngxVirtualItemIndex]="recycler.start() + i">
 *       {{ item.name }}
 *     </div>
 *   }
 * </div>
 * ```
 *
 * @category a11y
 */
@Directive({
  selector: '[cngxRovingTabindex]',
  exportAs: 'cngxRovingTabindex',
  standalone: true,
  host: {
    '(keydown)': 'handleKeyDown($event)',
  },
})
export class CngxRovingTabindex {
  /** Arrow key navigation axis. `'both'` enables both horizontal and vertical arrows. */
  readonly orientation = input<'horizontal' | 'vertical' | 'both'>('horizontal');
  /** Whether navigation wraps from last to first and vice versa. */
  readonly loop = input<boolean>(true);
  /** Index of the currently active (focusable) item. Supports two-way `[(activeIndex)]` binding. */
  readonly activeIndex = model<number>(0);

  /**
   * Total item count for virtual mode. When set, `activeIndex` ranges from 0 to
   * `virtualCount - 1` and items are matched by `data-cngx-recycle-index` attribute.
   * When not set, standard `contentChildren`-based navigation is used.
   */
  readonly virtualCount = input<number | undefined>(undefined);

  /** All `CngxRovingItem` children discovered via `contentChildren`. */
  private readonly items = contentChildren(CngxRovingItem);

  /** Guards against setting `tabindex` before the DOM is ready. */
  private readonly initialized = signal(false);

  /** Host element for `data-cngx-recycle-index` queries in virtual mode. */
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  private readonly pendingFocusState = signal<number | null>(null);

  /**
   * Index of the item that should receive focus but is not currently in the DOM.
   * Non-null when virtual navigation targets an out-of-range item.
   * Used by `connectRecyclerToRoving()` to scroll the item into view and focus it.
   */
  readonly pendingFocus = this.pendingFocusState.asReadonly();

  constructor() {
    afterNextRender(() => this.initialized.set(true));

    // Sync tabindex on every items/activeIndex change: active = "0", others = "-1".
    effect(() => {
      if (!this.initialized()) {
        return;
      }
      const items = this.items();
      const active = this.activeIndex();
      const vc = this.virtualCount();

      if (vc != null) {
        // Virtual mode: match by data-cngx-recycle-index attribute
        items.forEach((item) => {
          const el = item.elementRef.nativeElement as HTMLElement;
          const idx = el.getAttribute('data-cngx-recycle-index');
          el.setAttribute('tabindex', idx != null && Number(idx) === active ? '0' : '-1');
        });
      } else {
        // Standard mode: match by array index
        const clamped = Math.max(0, Math.min(active, items.length - 1));
        items.forEach((item, i) =>
          (item.elementRef.nativeElement as HTMLElement).setAttribute(
            'tabindex',
            i === clamped ? '0' : '-1',
          ),
        );
      }
    });
  }

  /**
   * Clears the pending focus target. Called by `connectRecyclerToRoving()`
   * after the item has been scrolled into view and focused.
   */
  clearPendingFocus(): void {
    this.pendingFocusState.set(null);
  }

  /**
   * Handles arrow-key, Home, and End navigation within the group.
   * Prevents default scrolling on arrow keys.
   */
  protected handleKeyDown(event: KeyboardEvent): void {
    const vc = this.virtualCount();
    if (vc != null) {
      this.handleVirtualKeyDown(event, vc);
      return;
    }

    const items = this.enabledItems();
    if (items.length === 0) {
      return;
    }

    const allItems = this.items();
    const currentActive = this.activeIndex();
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        if (this.isHorizontal()) {
          nextIndex = this.findNext(currentActive, allItems, 1);
        }
        break;
      case 'ArrowLeft':
        if (this.isHorizontal()) {
          nextIndex = this.findNext(currentActive, allItems, -1);
        }
        break;
      case 'ArrowDown':
        if (this.isVertical()) {
          nextIndex = this.findNext(currentActive, allItems, 1);
        }
        break;
      case 'ArrowUp':
        if (this.isVertical()) {
          nextIndex = this.findNext(currentActive, allItems, -1);
        }
        break;
      case 'Home':
        nextIndex = this.findFirst(allItems);
        break;
      case 'End':
        nextIndex = this.findLast(allItems);
        break;
      default:
        return;
    }

    if (nextIndex !== null && nextIndex !== currentActive) {
      event.preventDefault();
      this.activeIndex.set(nextIndex);
      allItems[nextIndex].focus();
    } else if (nextIndex === currentActive) {
      event.preventDefault();
    }
  }

  /**
   * Virtual mode key handler. Uses `virtualCount` for bounds instead of contentChildren.
   * Focuses by querying `data-cngx-recycle-index`. If not found, sets `pendingFocus`.
   */
  private handleVirtualKeyDown(event: KeyboardEvent, total: number): void {
    if (total === 0) {
      return;
    }

    const currentActive = this.activeIndex();
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        if (this.isHorizontal()) {
          nextIndex = this.findNextVirtual(currentActive, total, 1);
        }
        break;
      case 'ArrowLeft':
        if (this.isHorizontal()) {
          nextIndex = this.findNextVirtual(currentActive, total, -1);
        }
        break;
      case 'ArrowDown':
        if (this.isVertical()) {
          nextIndex = this.findNextVirtual(currentActive, total, 1);
        }
        break;
      case 'ArrowUp':
        if (this.isVertical()) {
          nextIndex = this.findNextVirtual(currentActive, total, -1);
        }
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = total - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== null && nextIndex !== currentActive) {
      event.preventDefault();
      this.activeIndex.set(nextIndex);
      this.focusVirtualItem(nextIndex);
    } else if (nextIndex === currentActive) {
      event.preventDefault();
    }
  }

  /**
   * Attempts to focus a virtual item by querying `data-cngx-recycle-index`.
   * If the element is not in the DOM, sets `pendingFocus` for external resolution.
   */
  private focusVirtualItem(index: number): void {
    const el = (this.hostEl.nativeElement as HTMLElement).querySelector(
      `[data-cngx-recycle-index="${index}"]`,
    );
    if (el instanceof HTMLElement) {
      el.focus();
      this.pendingFocusState.set(null);
    } else {
      this.pendingFocusState.set(index);
    }
  }

  /**
   * Finds the next index in virtual mode. No disabled-item skipping — can't check
   * disabled state of items not in the DOM.
   */
  private findNextVirtual(current: number, total: number, direction: 1 | -1): number | null {
    if (total === 0) {
      return null;
    }
    const idx = current + direction;
    if (this.loop()) {
      return ((idx % total) + total) % total;
    }
    if (idx < 0 || idx >= total) {
      return null;
    }
    return idx;
  }

  private enabledItems(): readonly CngxRovingItem[] {
    return this.items().filter((item) => !item.disabled());
  }

  private isHorizontal(): boolean {
    const o = this.orientation();
    return o === 'horizontal' || o === 'both';
  }

  private isVertical(): boolean {
    const o = this.orientation();
    return o === 'vertical' || o === 'both';
  }

  /**
   * Searches for the next enabled item starting from `current + direction`.
   * Respects `loop` — wraps around or stops at the boundary.
   * Skips disabled items.
   */
  private findNext(
    current: number,
    items: readonly CngxRovingItem[],
    direction: 1 | -1,
  ): number | null {
    const len = items.length;
    if (len === 0) {
      return null;
    }

    let idx = current + direction;
    const loop = this.loop();

    for (let i = 0; i < len; i++) {
      if (loop) {
        idx = ((idx % len) + len) % len;
      } else if (idx < 0 || idx >= len) {
        return null;
      }

      if (!items[idx].disabled()) {
        return idx;
      }
      idx += direction;
    }

    return null;
  }

  private findFirst(items: readonly CngxRovingItem[]): number | null {
    const idx = items.findIndex((item) => !item.disabled());
    return idx >= 0 ? idx : null;
  }

  private findLast(items: readonly CngxRovingItem[]): number | null {
    const idx = [...items].reverse().findIndex((item) => !item.disabled());
    return idx >= 0 ? items.length - 1 - idx : null;
  }
}
