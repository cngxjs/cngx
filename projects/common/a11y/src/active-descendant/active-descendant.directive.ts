import {
  afterNextRender,
  computed,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { CNGX_AD_ITEM, type ActiveDescendantItem, type CngxAdItemHandle } from './ad-item.token';

/**
 * Implements the WAI-ARIA active-descendant keyboard pattern for composite
 * widgets where focus stays on a single host element and the currently active
 * option is communicated via `aria-activedescendant`.
 *
 * ### When to use this vs. `CngxRovingTabindex`
 *
 * - **Active-descendant** when focus should stay on one container and you need
 *   `role="listbox"`, `role="menu"`, combobox inputs, or any widget where
 *   individual options should not be tab-stops. Screen readers announce the
 *   referenced option while keeping the focus ring on the host.
 * - **Roving tabindex** when individual items should be tab-stops (toolbar,
 *   tab list, grid cells). See `CngxRovingTabindex`.
 *
 * ### Item registration
 *
 * Items register either by providing `CNGX_AD_ITEM` via `hostDirectives` or
 * `providers`, or by passing a `Signal<ActiveDescendantItem[]>` through the
 * `items` input. The latter takes precedence and is intended for combobox-style
 * consumers driven by a dynamic data source.
 *
 * ### Virtualization
 *
 * When `virtualCount` is set, navigation targets can address indices not
 * currently in the DOM. `pendingHighlight` signals the consumer to scroll the
 * missing item into view; after scroll, the consumer calls
 * `clearPendingHighlight()`.
 *
 * ### Material/CDK equivalent
 *
 * Mirrors the model used by `cdk-listbox` and `mat-select` but exposes it as a
 * standalone primitive — not coupled to any visual shell, signal-reactive end
 * to end, and unified across listbox/menu/combobox stacks.
 *
 * @category a11y
 */
@Directive({
  selector: '[cngxActiveDescendant]',
  exportAs: 'cngxActiveDescendant',
  standalone: true,
  host: {
    '[attr.aria-activedescendant]': 'activeId()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class CngxActiveDescendant {
  /**
   * Optional explicit item list. When provided, takes precedence over items
   * registered via `CNGX_AD_ITEM`. Useful for combobox-style consumers that
   * drive the menu from a dynamic data source — pass the unwrapped array
   * (typically the result of a `computed()`), Angular's signal inputs make it
   * reactive automatically.
   */
  readonly items = input<ActiveDescendantItem[] | undefined>(undefined);

  /** Arrow-key navigation axis. Defaults to `'vertical'` (listbox/menu style). */
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  /** Whether navigation wraps from last to first and vice versa. */
  readonly loop = input<boolean>(true);
  /** Whether alphanumeric typeahead navigation is enabled. */
  readonly typeahead = input<boolean>(true);
  /** Buffer reset window for typeahead, in milliseconds. */
  readonly typeaheadDebounce = input<number>(300);
  /** Whether the first non-disabled item is highlighted automatically. */
  readonly autoHighlightFirst = input<boolean>(false);
  /** Whether disabled items are skipped during navigation and value lookup. */
  readonly skipDisabled = input<boolean>(true);
  /**
   * When set, navigation treats the range `[0, virtualCount)` as the item
   * space even if only a subset is rendered. Targets outside the rendered
   * range surface as `pendingHighlight` for scroll-and-retry protocols.
   */
  readonly virtualCount = input<number | undefined>(undefined);

  /** Emitted when `activateCurrent()` is called with an active item. */
  readonly activated = output<unknown>();
  /** Emitted whenever the highlighted item changes. */
  readonly highlighted = output<ActiveDescendantItem | null>();

  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly registered = contentChildren(CNGX_AD_ITEM, { descendants: true });

  /** Guards host attribute writes until after first render. */
  private readonly initialized = signal(false);

  /** -1 means "no active item". Range is [0, resolvedItems().length). */
  private readonly activeIndexState = signal<number>(-1);

  /** Index of an item that should be highlighted but is not in the DOM. */
  private readonly pendingHighlightState = signal<number | null>(null);
  readonly pendingHighlight = this.pendingHighlightState.asReadonly();

  /**
   * Resolved item list. Input `items` wins; otherwise the contentChildren
   * handles are projected into `ActiveDescendantItem` shape.
   */
  readonly resolvedItems = computed<ActiveDescendantItem[]>(() => {
    const explicit = this.items();
    if (explicit) {
      return explicit;
    }
    return this.registered().map(handleToItem);
  });

  /** Current active index. `-1` when no item is highlighted. */
  readonly activeIndex = computed<number>(() => {
    const idx = this.activeIndexState();
    const total = this.totalCount();
    if (idx < 0 || idx >= total) {
      return -1;
    }
    return idx;
  });

  /**
   * `activeIndex` always mapped back to an item. `null` when no active index
   * or the item is out of rendered range (virtual mode).
   */
  readonly activeItem = computed<ActiveDescendantItem | null>(() => {
    const idx = this.activeIndex();
    if (idx < 0) {
      return null;
    }
    const list = this.resolvedItems();
    return list[idx] ?? null;
  });

  readonly activeId = computed<string | null>(() => this.activeItem()?.id ?? null);
  readonly activeValue = computed<unknown>(() => this.activeItem()?.value ?? null);

  private readonly typeaheadBuffer = signal<string>('');
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => this.initialized.set(true));

    effect(() => {
      if (!this.initialized()) {
        return;
      }
      if (this.autoHighlightFirst() && this.activeIndexState() === -1) {
        this.highlightFirst();
      }
    });

    effect(() => {
      this.highlighted.emit(this.activeItem());
    });

    effect(() => {
      const idx = this.activeIndex();
      if (idx < 0) {
        return;
      }
      if (this.virtualCount() != null) {
        if (!this.isRendered(idx)) {
          this.pendingHighlightState.set(idx);
          return;
        }
        this.pendingHighlightState.set(null);
      }
      queueMicrotask(() => this.scrollActiveIntoView());
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.typeaheadTimer !== null) {
        clearTimeout(this.typeaheadTimer);
      }
    });
  }

  /* ---------------- Public primitives ---------------- */

  highlightNext(): void {
    const next = this.findFrom(this.activeIndexState(), 1);
    if (next !== null) {
      this.activeIndexState.set(next);
    }
  }

  highlightPrev(): void {
    const next = this.findFrom(this.activeIndexState(), -1);
    if (next !== null) {
      this.activeIndexState.set(next);
    }
  }

  highlightFirst(): void {
    const first = this.findBoundary(1);
    if (first !== null) {
      this.activeIndexState.set(first);
    }
  }

  highlightLast(): void {
    const last = this.findBoundary(-1);
    if (last !== null) {
      this.activeIndexState.set(last);
    }
  }

  /**
   * Highlight by zero-based index. Out-of-range indices are ignored.
   * Disabled items are rejected when `skipDisabled()` is true.
   */
  highlightByIndex(index: number): void {
    const total = this.totalCount();
    if (index < 0 || index >= total) {
      return;
    }
    if (this.skipDisabled() && this.isDisabledAt(index)) {
      return;
    }
    this.activeIndexState.set(index);
  }

  /**
   * Highlight the first item whose value matches (via `Object.is`). No-op if
   * no match. Disabled items are rejected when `skipDisabled()` is true.
   */
  highlightByValue(value: unknown): void {
    const items = this.resolvedItems();
    const idx = items.findIndex((it) => Object.is(it.value, value));
    if (idx < 0) {
      return;
    }
    if (this.skipDisabled() && items[idx].disabled) {
      return;
    }
    this.activeIndexState.set(idx);
  }

  /** Clear the highlight. */
  resetHighlight(): void {
    this.activeIndexState.set(-1);
  }

  /** Emit `activated` with the current item's value. No-op if nothing active. */
  activateCurrent(): void {
    const item = this.activeItem();
    if (item) {
      this.activated.emit(item.value);
    }
  }

  /** Called by recycler bridges after scrolling the pending index into view. */
  clearPendingHighlight(): void {
    this.pendingHighlightState.set(null);
  }

  /* ---------------- Keyboard handler ---------------- */

  protected handleKeydown(event: KeyboardEvent): void {
    const key = event.key;

    if (this.isNavKey(key)) {
      const before = this.activeIndexState();
      this.dispatchNav(key);
      if (this.activeIndexState() !== before) {
        event.preventDefault();
      }
      return;
    }

    if (key === 'Enter' || key === ' ') {
      if (this.activeItem()) {
        event.preventDefault();
        this.activateCurrent();
      }
      return;
    }

    if (this.typeahead() && isPrintableChar(key)) {
      event.preventDefault();
      this.handleTypeahead(key);
    }
  }

  private isNavKey(key: string): boolean {
    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End':
        return true;
      default:
        return false;
    }
  }

  private dispatchNav(key: string): void {
    const orientation = this.orientation();
    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          this.highlightNext();
        }
        return;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          this.highlightPrev();
        }
        return;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          this.highlightNext();
        }
        return;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          this.highlightPrev();
        }
        return;
      case 'Home':
        this.highlightFirst();
        return;
      case 'End':
        this.highlightLast();
        return;
    }
  }

  private handleTypeahead(ch: string): void {
    const next = this.typeaheadBuffer() + ch.toLowerCase();
    this.typeaheadBuffer.set(next);

    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer.set('');
      this.typeaheadTimer = null;
    }, this.typeaheadDebounce());

    const items = this.resolvedItems();
    const skip = this.skipDisabled();
    const start = Math.max(0, this.activeIndexState());
    const total = items.length;
    for (let offset = 0; offset < total; offset++) {
      const i = (start + offset) % total;
      const candidate = items[i];
      if (skip && candidate.disabled) {
        continue;
      }
      if (candidate.label.toLowerCase().startsWith(next)) {
        this.activeIndexState.set(i);
        return;
      }
    }
  }

  /* ---------------- Navigation helpers ---------------- */

  private findFrom(current: number, direction: 1 | -1): number | null {
    const total = this.totalCount();
    if (total === 0) {
      return null;
    }
    const items = this.resolvedItems();
    const skip = this.skipDisabled();
    const loop = this.loop();

    let idx = current < 0 ? (direction === 1 ? -1 : total) : current;
    for (let step = 0; step < total; step++) {
      idx += direction;
      if (idx < 0 || idx >= total) {
        if (!loop) {
          return null;
        }
        idx = ((idx % total) + total) % total;
      }
      if (!skip || !items[idx]?.disabled) {
        return idx;
      }
    }
    return null;
  }

  private findBoundary(direction: 1 | -1): number | null {
    const items = this.resolvedItems();
    const total = items.length;
    if (total === 0) {
      return null;
    }
    const skip = this.skipDisabled();
    if (direction === 1) {
      for (let i = 0; i < total; i++) {
        if (!skip || !items[i].disabled) {
          return i;
        }
      }
    } else {
      for (let i = total - 1; i >= 0; i--) {
        if (!skip || !items[i].disabled) {
          return i;
        }
      }
    }
    return null;
  }

  private totalCount(): number {
    const vc = this.virtualCount();
    if (vc != null) {
      return vc;
    }
    return this.resolvedItems().length;
  }

  private isDisabledAt(index: number): boolean {
    const items = this.resolvedItems();
    return !!items[index]?.disabled;
  }

  private isRendered(index: number): boolean {
    const items = this.resolvedItems();
    return index >= 0 && index < items.length && !!items[index];
  }

  private scrollActiveIntoView(): void {
    const id = this.activeId();
    if (!id) {
      return;
    }
    const el = (this.hostEl.nativeElement as HTMLElement).querySelector(
      `#${cssEscape(id)}`,
    );
    if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
}

function handleToItem(handle: CngxAdItemHandle): ActiveDescendantItem {
  return {
    id: handle.id,
    value: handle.value(),
    label: handle.label(),
    disabled: handle.disabled?.() ?? false,
  };
}

function isPrintableChar(key: string): boolean {
  return key.length === 1 && /\S/.exec(key) !== null;
}

function cssEscape(id: string): string {
  const api = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS;
  if (api && typeof api.escape === 'function') {
    return api.escape(id);
  }
  return id.replace(/[^a-zA-Z0-9_-]/g, (m) => `\\${m}`);
}
