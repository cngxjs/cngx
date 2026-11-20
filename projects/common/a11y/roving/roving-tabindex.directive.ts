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
  untracked,
} from '@angular/core';
import {
  injectDirection,
  resolveBoundaryStep,
  resolveInlineStep,
  resolveStepFrom,
} from '@cngx/core';
import { isComposingKeydown, isTextEntryTarget } from '@cngx/core/utils';

/**
 * Widgets whose arrow keys are their own. A key from inside one that sits in
 * the roving group (a slider in a toolbar item, a nested listbox) belongs to
 * it, not to the group.
 */
const ARROW_KEY_WIDGETS = [
  'input[type="range"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="scrollbar"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="tree"]',
  '[role="treegrid"]',
  '[role="grid"]',
  '[role="menu"]',
  '[role="menubar"]',
  '[role="tablist"]',
  '[role="radiogroup"]',
  '[role="toolbar"]',
].join(', ');

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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/roving/roving-tabindex.directive.ts
 * @since 0.1.0
 * @relatedTo CngxRovingTabindex, CngxButtonToggle
 * <example-url>/#/common/a11y/roving-tabindex/horizontal-toolbar</example-url>
 * <example-url>/#/common/a11y/roving-tabindex/vertical-menu</example-url>
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
 * Only the active item in the group has `tabindex="0"` - all others get
 * `tabindex="-1"`. Arrow keys move focus within the group; Tab leaves it.
 * Home/End jump to first/last item.
 *
 * Works for toolbars, tab lists, card grids, menu bars, and any composite
 * widget where only one item should be in the tab order at a time.
 *
 * ### Keys the group leaves alone
 *
 * A key from a text field (an `<input>` item, a field inside an item), a key
 * of an IME composition, and an arrow from inside a nested widget that owns
 * its arrows (a range input or an element with a slider, spinbutton,
 * scrollbar, combobox, listbox, tree, treegrid, grid, menu, menubar,
 * tablist, radiogroup or toolbar role)
 * stays with that element. A custom widget without one of those roles keeps
 * its arrows by calling `preventDefault()` on the keys it handles: the group
 * skips every key that arrives already handled.
 *
 * ### Virtual mode
 *
 * When `virtualCount` is set, `activeIndex` ranges from 0 to `virtualCount - 1`
 * instead of being bounded by `contentChildren.length`. Items are matched by
 * `data-cngx-recycle-index` attribute. When the target item is not in the DOM
 * (out of rendered range), `pendingFocus` is set so a wiring function like
 * `connectRecyclerToRoving()` can scroll it into view.
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/roving/roving-tabindex.directive.ts
 * @since 0.1.0
 * @relatedTo CngxRovingItem, CngxActiveDescendant
 * <example-url>/#/common/a11y/roving-tabindex/horizontal-toolbar</example-url>
 * <example-url>/#/common/a11y/roving-tabindex/vertical-menu</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxRovingTabindex]',
  exportAs: 'cngxRovingTabindex',
  standalone: true,
  host: {
    '(keydown)': 'handleKeyDown($event)',
    '(focusin)': 'handleFocusIn($event)',
  },
})
export class CngxRovingTabindex {
  /**
   * Arrow key navigation axis. `'both'` enables both horizontal and
   * vertical arrows. Exposed as a `model` so composite hosts (e.g.
   * `CngxRadioGroup`, where the keyboard axis must always be `'both'`
   * per WAI-ARIA APG regardless of the cosmetic group orientation) can
   * override it from their own constructor.
   */
  readonly orientation = model<'horizontal' | 'vertical' | 'both'>('horizontal');
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

  /**
   * Flips after the first browser render. Virtual mode waits for it: it reads
   * the `data-cngx-recycle-index` attributes, which the item bindings write
   * during that render. Standard mode writes before it (so a server render
   * carries the tab stops) and once more after it, because an item's own
   * `[attr.tabindex]` binding (null under a roving parent) clears the
   * attribute during that render.
   */
  private readonly rendered = signal(false);

  /** Host element for `data-cngx-recycle-index` queries in virtual mode. */
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  private readonly pendingFocusState = signal<number | null>(null);

  /** Document writing direction - flips the horizontal-arrow index deltas under `rtl` (APG). */
  private readonly direction = injectDirection();

  /**
   * Set true just before a navigation key (arrow / Home / End) moves focus to a
   * new item, cleared by {@link consumeNavigationKey}. Transient handshake, not
   * reactive state: consumer groups read it synchronously from the
   * newly-focused leaf's `(focus)` handler.
   */
  private navigationKeyInFlight = false;

  /**
   * Index of the item that should receive focus but is not currently in the DOM.
   * Non-null when virtual navigation targets an out-of-range item.
   * Used by `connectRecyclerToRoving()` to scroll the item into view and focus it.
   */
  readonly pendingFocus = this.pendingFocusState.asReadonly();

  constructor() {
    // The item list and the index the last run settled on: a list change with
    // an unchanged index re-finds the item that held the tab stop.
    let previousItems: readonly CngxRovingItem[] = [];
    let previousActive = -1;

    afterNextRender(() => this.rendered.set(true));

    effect(() => {
      const rendered = this.rendered();
      const items = this.items();
      const active = this.activeIndex();
      const vc = this.virtualCount();

      if (vc != null) {
        if (!rendered) {
          return;
        }
        // Virtual mode: match by data-cngx-recycle-index attribute. Clamp the
        // model itself when the virtual space shrinks below it - a ghost
        // index would otherwise anchor the next arrow press. An empty space
        // (vc 0) keeps the model untouched so a repopulated list restores it.
        const clamped = vc > 0 ? Math.max(0, Math.min(active, vc - 1)) : active;
        if (clamped !== active) {
          untracked(() => this.activeIndex.set(clamped));
        }
        const stop = virtualTabStop(items, clamped);
        items.forEach((item) =>
          (item.elementRef.nativeElement as HTMLElement).setAttribute(
            'tabindex',
            item === stop ? '0' : '-1',
          ),
        );
        return;
      }

      // Standard mode: match by array index. When the list changed under an
      // unchanged index, the item that held the tab stop is looked up again,
      // so a removal or reorder before it does not hand the stop to another
      // item. The tab stop must land on an enabled item - fall back to the
      // first enabled one when the target is disabled (initial index into a
      // disabled leaf, or the active item got disabled). The model is written
      // back so keyboard navigation anchors where the tab stop actually sits.
      // An empty list keeps the model untouched so a repopulated list
      // restores it.
      if (items.length === 0) {
        return;
      }
      let anchor = active;
      if (items !== previousItems && active === previousActive) {
        const held = previousItems[active];
        const moved = held ? items.indexOf(held) : -1;
        anchor = moved >= 0 ? moved : active;
      }
      let target = Math.max(0, Math.min(anchor, items.length - 1));
      if (items[target]?.disabled()) {
        target = this.findFirst(items) ?? target;
      }
      previousItems = items;
      previousActive = target;
      if (target !== active) {
        untracked(() => this.activeIndex.set(target));
      }
      items.forEach((item, i) =>
        (item.elementRef.nativeElement as HTMLElement).setAttribute(
          'tabindex',
          i === target ? '0' : '-1',
        ),
      );
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
   * Whether the last focus move was driven by a navigation key, consuming the
   * flag so it reads `true` exactly once. Consumer groups (radio,
   * button-toggle) call this from the newly-focused leaf's `(focus)` handler to
   * decide whether to auto-select. The flag is set before `.focus()`, so it is
   * already `true` when focus lands - this closes the one-press-behind race
   * that a group's own `(keydown)` binding suffered (#135).
   */
  consumeNavigationKey(): boolean {
    const inFlight = this.navigationKeyInFlight;
    this.navigationKeyInFlight = false;
    return inFlight;
  }

  /**
   * Handles arrow-key, Home, and End navigation within the group.
   * Prevents default scrolling on arrow keys.
   *
   * Unified handler - delegates to virtual or contentChildren navigation
   * based on whether `virtualCount` is set.
   */
  protected handleKeyDown(event: KeyboardEvent): void {
    // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
    // untouched (Ctrl+Home, Cmd+ArrowLeft and friends belong to the app).
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (!this.ownsKey(event)) {
      return;
    }

    const vc = this.virtualCount();
    const allItems = this.items();
    const isVirtual = vc != null;
    const total = isVirtual ? vc : allItems.length;

    if (total === 0) {
      return;
    }
    if (!isVirtual && this.enabledItems().length === 0) {
      return;
    }

    const currentActive = this.activeIndex();
    const navigate = (direction: 1 | -1): number | null =>
      isVirtual
        ? this.findNextVirtual(currentActive, total, direction)
        : this.findNext(currentActive, allItems, direction);

    const inlineNav = (key: string): number | null => {
      if (!this.isHorizontal()) {
        return null;
      }
      const step = resolveInlineStep(key, this.direction());
      return step === null ? null : navigate(step);
    };

    const keyMap: Record<string, () => number | null> = {
      ArrowRight: () => inlineNav('ArrowRight'),
      ArrowLeft: () => inlineNav('ArrowLeft'),
      ArrowDown: () => (this.isVertical() ? navigate(1) : null),
      ArrowUp: () => (this.isVertical() ? navigate(-1) : null),
      Home: () => (isVirtual ? 0 : this.findFirst(allItems)),
      End: () => (isVirtual ? total - 1 : this.findLast(allItems)),
    };

    const handler = keyMap[event.key];
    if (!handler) {
      return;
    }

    const nextIndex = handler();
    if (nextIndex !== null && nextIndex !== currentActive) {
      event.preventDefault();
      this.activeIndex.set(nextIndex);
      // Expose the navigation intent before focus moves, so the newly-focused
      // leaf's (focus) handler reads an already-set fact instead of racing the
      // group's own late (keydown) binding (#135).
      this.navigationKeyInFlight = true;
      if (isVirtual) {
        this.focusVirtualItem(nextIndex);
      } else {
        allItems[nextIndex].focus();
      }
    } else if (nextIndex === currentActive) {
      event.preventDefault();
    }
  }

  /**
   * Whether the group may take the key: not one a nested widget already
   * handled, not part of an IME composition, not from a text field (an
   * `<input>` item or one inside an item keeps its caret keys) and not from
   * inside a nested widget that owns its arrows.
   */
  private ownsKey(event: KeyboardEvent): boolean {
    if (event.defaultPrevented || isComposingKeydown(event)) {
      return false;
    }
    const target = event.target as Element | null;
    if (isTextEntryTarget(target)) {
      return false;
    }
    const host = this.hostEl.nativeElement as HTMLElement;
    const widget = target?.closest(ARROW_KEY_WIDGETS) ?? null;
    return widget === null || widget === host || !host.contains(widget);
  }

  /**
   * Keeps `activeIndex` in sync with real focus (APG): when an item gains
   * focus by any means - pointer click, script focus, assistive tech - the
   * tab stop follows it instead of staying on the last arrow-key target.
   */
  protected handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    const vc = this.virtualCount();
    if (vc != null) {
      const holder = target.closest('[data-cngx-recycle-index]');
      const idx = holder === null ? NaN : Number(holder.getAttribute('data-cngx-recycle-index'));
      if (Number.isInteger(idx) && idx >= 0 && idx < vc && idx !== this.activeIndex()) {
        this.activeIndex.set(idx);
      }
      return;
    }
    const items = this.items();
    const idx = items.findIndex((item) => {
      const el = item.elementRef.nativeElement as HTMLElement;
      return el === target || el.contains(target);
    });
    if (idx >= 0 && !items[idx].disabled() && idx !== this.activeIndex()) {
      this.activeIndex.set(idx);
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
   * Finds the next index in virtual mode. No disabled-item skipping - can't check
   * disabled state of items not in the DOM (the resolver treats every index as
   * enabled when no `isDisabledAt` is supplied).
   */
  private findNextVirtual(current: number, total: number, direction: 1 | -1): number | null {
    return resolveStepFrom(current, direction, { count: total, loop: this.loop() });
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
   * Respects `loop` - wraps around or stops at the boundary.
   * Skips disabled items.
   */
  private findNext(
    current: number,
    items: readonly CngxRovingItem[],
    direction: 1 | -1,
  ): number | null {
    return resolveStepFrom(current, direction, {
      count: items.length,
      loop: this.loop(),
      isDisabledAt: (i) => items[i].disabled(),
    });
  }

  private findFirst(items: readonly CngxRovingItem[]): number | null {
    return resolveBoundaryStep(1, {
      count: items.length,
      isDisabledAt: (i) => items[i].disabled(),
    });
  }

  private findLast(items: readonly CngxRovingItem[]): number | null {
    return resolveBoundaryStep(-1, {
      count: items.length,
      isDisabledAt: (i) => items[i].disabled(),
    });
  }
}

/**
 * @internal The rendered item that holds the tab stop in virtual mode: the
 * one at the active index, or, while that index is outside the rendered
 * window, the rendered item nearest to it, so the group never drops out of
 * the Tab order. Focusing it moves the active index there (`focusin`).
 */
function virtualTabStop(
  items: readonly CngxRovingItem[],
  active: number,
): CngxRovingItem | null {
  let nearest: CngxRovingItem | null = null;
  let distance = Infinity;
  for (const item of items) {
    const raw = (item.elementRef.nativeElement as HTMLElement).dataset['cngxRecycleIndex'];
    if (raw == null) {
      continue;
    }
    const gap = Math.abs(Number(raw) - active);
    if (gap < distance) {
      nearest = item;
      distance = gap;
    }
  }
  return nearest;
}
