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

  /** All `CngxRovingItem` children discovered via `contentChildren`. */
  private readonly items = contentChildren(CngxRovingItem);

  /**
   * Guards against setting tabindex before the DOM is ready.
   * `afterNextRender` fires once; after that, the effect runs freely.
   */
  private readonly initialized = signal(false);

  constructor() {
    afterNextRender(() => this.initialized.set(true));

    // Synchronise tabindex attributes whenever items or activeIndex change.
    // Active item gets tabindex="0", all others get tabindex="-1".
    effect(() => {
      if (!this.initialized()) {
        return;
      }
      const items = this.items();
      const active = this.activeIndex();
      // Clamp to valid range — prevents out-of-bounds when items are added/removed.
      const clamped = Math.max(0, Math.min(active, items.length - 1));

      for (let i = 0; i < items.length; i++) {
        const el = items[i].elementRef.nativeElement as HTMLElement;
        el.setAttribute('tabindex', i === clamped ? '0' : '-1');
      }
    });
  }

  /**
   * Handles arrow-key, Home, and End navigation.
   * Prevents default to stop the page from scrolling on arrow keys.
   * @internal — bound via `host: { '(keydown)': ... }`.
   */
  protected handleKeyDown(event: KeyboardEvent): void {
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
    for (let i = 0; i < items.length; i++) {
      if (!items[i].disabled()) {
        return i;
      }
    }
    return null;
  }

  private findLast(items: readonly CngxRovingItem[]): number | null {
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].disabled()) {
        return i;
      }
    }
    return null;
  }
}
