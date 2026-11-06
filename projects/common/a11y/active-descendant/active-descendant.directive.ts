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
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  injectDirection,
  resolveBoundaryStep,
  resolveInlineStep,
  resolveStepFrom,
} from '@cngx/core';
import {
  CNGX_NESTED_INTERACTIVE_SELECTOR,
  createTypeaheadWalker,
  injectLocale,
} from '@cngx/core/utils';

import { CNGX_AD_ITEM, type ActiveDescendantItem, type CngxAdItemHandle } from './ad-item.token';

/**
 * WAI-ARIA active-descendant pattern. Focus stays on the host; the active
 * option is reported via `aria-activedescendant`.
 *
 * ### When to use this vs. `CngxRovingTabindex`
 *
 * - **Active-descendant** when focus stays on one container (listbox, menu,
 *   combobox input) and items must not be tab-stops. Screen readers announce
 *   the referenced option while the focus ring stays on the host.
 * - **Roving tabindex** when items themselves are tab-stops (toolbar, tab
 *   list, grid cells). See `CngxRovingTabindex`.
 *
 * ### Item registration
 *
 * Items register either by providing `CNGX_AD_ITEM` via `hostDirectives` /
 * `providers`, or by passing a `Signal<ActiveDescendantItem[]>` through the
 * `items` input. The `items` input wins when both are present; use it when
 * items come from a dynamic data source.
 *
 * ### Virtualization
 *
 * When `virtualCount` is set, navigation addresses the absolute index space
 * `[0, virtualCount)` even when only a window is rendered. Bind `windowStart`
 * to the recycler's window start so item lookups (id resolution, disabled
 * checks, typeahead labels) map absolute indices onto the rendered subset.
 * Targets outside the window surface as `pendingHighlight`; the consumer
 * scrolls them into view (`connectRecyclerToActiveDescendant`) and the
 * directive clears the pending state once the target renders.
 *
 * ### Material/CDK equivalent
 *
 * Same model as `cdk-listbox` and `mat-select`, without the visual shell and
 * driven by signals instead of `ListKeyManager`.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/active-descendant/active-descendant.directive.ts
 * @since 0.1.0
 * @relatedTo CngxRovingTabindex, CngxListbox, CngxMenu
 * <example-url>/#/common/a11y/active-descendant/listbox-with-items-input</example-url>
 * <example-url>/#/common/a11y/active-descendant/typeahead</example-url>
 * @axis level atom
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
   * drive the menu from a dynamic data source - pass the unwrapped array
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
  /**
   * Absolute index of the first rendered item in virtual mode - the recycler
   * window start. All rendered-item lookups are offset by it so absolute
   * indices resolve the right item once the window has scrolled past 0.
   * Ignored when `virtualCount` is unset.
   */
  readonly windowStart = input<number>(0);
  /**
   * The full list in absolute index space, for a windowed list whose rendered
   * rows are only part of it. When bound, typeahead searches this list and a
   * match anywhere in it becomes the highlight; `typeaheadMissed` then means no
   * match in the whole list. Unbound, the rendered window stays the search
   * space. Items are read for `label` and `disabled` only, so `id` may be empty.
   */
  readonly typeaheadItems = input<readonly ActiveDescendantItem[] | undefined>(undefined);
  /**
   * Equality used to find the previously active value again after the item
   * list changes. Defaults to `Object.is`; pass the same comparator as the
   * surrounding listbox / select when options are re-fetched as new objects
   * with equal identity, or the highlight drops on every refresh. The
   * parameters are typed `never` so a comparator over any value type binds
   * while the directive itself stays non-generic.
   */
  readonly compareWith = input<(a: never, b: never) => boolean>(Object.is);

  /** Emitted when `activateCurrent()` is called with an active item. */
  readonly activated = output<unknown>();
  /** Emitted whenever the highlighted item changes. */
  readonly highlighted = output<ActiveDescendantItem | null>();
  /**
   * Emitted when a typeahead query finds no match in the rendered window.
   * Carries the resolved query term (lowercased; a repeated single letter
   * collapses to that letter per the APG cycle rule). The rendered window
   * is AD's whole search space - hosts whose real item space is larger
   * (collapsed tree branches, virtualized rows outside the window) listen
   * here to resolve the miss themselves.
   */
  readonly typeaheadMissed = output<string>();

  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly locale = injectLocale();
  private readonly registered = contentChildren(CNGX_AD_ITEM, { descendants: true });

  /** Document writing direction - flips the horizontal-arrow steps under `rtl` (APG). */
  private readonly direction = injectDirection();

  /** Guards host attribute writes until after first render. */
  private readonly initialized = signal(false);

  /**
   * A highlight gesture that fired while the option rows were not in the DOM
   * (a deferred-render panel just opened, OD5): the id space does not exist
   * yet, so the gesture is kept as INTENT - not a resolved index, which an
   * empty item space resolves to nothing - and re-applied once the rows
   * render. Non-virtual path only; the virtual path uses `pendingHighlight`.
   */
  private readonly pendingIntentState = signal<PendingIntent | null>(null);

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

  /**
   * -1 means "no active item". Range is `[0, totalCount())`.
   *
   * Navigation writes the index; a change of the item space re-derives it.
   * In a plain list the highlight follows its value: after the item list
   * changes, the previously active value is looked up again with `compareWith`,
   * and gone means no highlight. In a virtual window it holds its absolute
   * index, because the rendered rows trail `windowStart` and cannot say where a
   * value sits; a window turning plain drops it. The result is clamped to the
   * new item space, so the next arrow press never starts from a ghost index.
   */
  private readonly activeIndexState = linkedSignal<ActiveIndexSource, number>({
    source: () => ({
      items: this.resolvedItems(),
      total: this.totalCount(),
      virtual: this.virtualCount() != null,
      compareWith: this.compareWith() as (a: unknown, b: unknown) => boolean,
    }),
    computation: (source, previous) => {
      if (!previous) {
        return -1;
      }
      return clampIndex(reResolveIndex(source, previous.source, previous.value), source.total);
    },
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
   * The highlight plus whether its row is rendered. Structural equal: a window
   * move that leaves both unchanged notifies nobody.
   */
  private readonly highlightPlacement = computed<HighlightPlacement>(
    () => {
      const index = this.activeIndex();
      return {
        index,
        rendered: index >= 0 && this.isRendered(index),
        virtual: this.virtualCount() != null,
      };
    },
    {
      equal: (a, b) => a.index === b.index && a.rendered === b.rendered && a.virtual === b.virtual,
    },
  );

  /**
   * Index the highlight moved to while its row is not rendered. Armed by the
   * highlight change alone and cleared when the row renders; the same highlight
   * leaving the window later stays cleared, so scrolling a virtual list away
   * never asks to be scrolled back.
   */
  private readonly pendingHighlightState = linkedSignal<HighlightPlacement, number | null>({
    source: this.highlightPlacement,
    computation: (placement, previous) => {
      if (!placement.virtual || placement.index < 0 || placement.rendered) {
        return null;
      }
      return previous?.source.index === placement.index ? previous.value : placement.index;
    },
  });
  /** Index of an item that should be highlighted but is not in the DOM. */
  readonly pendingHighlight = this.pendingHighlightState.asReadonly();

  /**
   * `activeIndex` always mapped back to an item. `null` when no active index
   * or the item is out of rendered range (virtual mode).
   */
  readonly activeItem = computed<ActiveDescendantItem | null>(() => {
    const idx = this.activeIndex();
    if (idx < 0) {
      return null;
    }
    return this.itemAt(idx);
  });

  /**
   * `activeItem` pinned to the item id for the `highlighted` emission: a
   * re-render that produces a fresh object for the same item must not
   * re-emit. `activeItem` itself stays identity-equal so `activeValue`
   * tracks value changes on an unchanged id.
   */
  private readonly highlightedItem = computed<ActiveDescendantItem | null>(
    () => this.activeItem(),
    { equal: (a, b) => a === b || (a !== null && b !== null && a.id === b.id) },
  );

  readonly activeId = computed<string | null>(() => this.activeItem()?.id ?? null);
  readonly activeValue = computed<unknown>(() => this.activeItem()?.value ?? null);

  private readonly typeaheadWalker = createTypeaheadWalker({
    debounceMs: this.typeaheadDebounce,
    locale: this.locale,
  });

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

    // Leading nulls are start-up state, not a highlight change - emit only
    // once something was highlighted (later resets back to null still emit).
    let hadHighlight = false;
    effect(() => {
      const item = this.highlightedItem();
      if (!hadHighlight && item === null) {
        return;
      }
      hadHighlight = true;
      this.highlighted.emit(item);
    });

    // One DOM scroll per highlight change, delayed until the row renders. A
    // window move alone never scrolls: the row of an unchanged highlight
    // re-entering the window must not pull the list back to it.
    let lastIndex = -1;
    let scrollDue = false;
    effect(() => {
      const { index, rendered } = this.highlightPlacement();
      if (index !== lastIndex) {
        lastIndex = index;
        scrollDue = index >= 0;
      }
      if (!scrollDue || !rendered) {
        return;
      }
      scrollDue = false;
      queueMicrotask(() => this.scrollActiveIntoView());
    });

    // Deferred-render re-apply (non-virtual path): when the option rows arrive
    // after a highlight gesture was remembered as intent (empty item space at
    // the time), re-run the gesture against the now-populated space and drop
    // the intent. Tracks only `resolvedItems`; the intent is read and cleared
    // untracked so storing or clearing it never re-triggers this effect.
    effect(() => {
      if (this.resolvedItems().length === 0) {
        return;
      }
      const intent = untracked(() => this.pendingIntentState());
      if (intent === null) {
        return;
      }
      untracked(() => {
        this.pendingIntentState.set(null);
        this.applyIntent(intent);
      });
    });

    inject(DestroyRef).onDestroy(() => this.typeaheadWalker.clear());
  }

  /**
   * Non-virtual path with no rendered rows yet (a deferred-render panel just
   * opened, OD5): the option id space does not exist, so a highlight resolves
   * against nothing and is lost. Remember the gesture as intent - the
   * constructor effect re-applies it once the rows render - and report that it
   * was deferred. The virtual path never defers here; its out-of-window
   * targets surface through `pendingHighlight` instead.
   */
  private deferIfUnrendered(intent: PendingIntent): boolean {
    if (this.virtualCount() == null && this.resolvedItems().length === 0) {
      this.pendingIntentState.set(intent);
      return true;
    }
    return false;
  }

  /** Re-run a remembered highlight gesture now the rows exist. */
  private applyIntent(intent: PendingIntent): void {
    switch (intent.kind) {
      case 'first':
        this.highlightFirst();
        return;
      case 'last':
        this.highlightLast();
        return;
      case 'next':
        this.highlightNext();
        return;
      case 'prev':
        this.highlightPrev();
        return;
      case 'byIndex':
        this.highlightByIndex(intent.index);
        return;
      case 'byValue':
        this.highlightByValue(intent.value);
        return;
    }
  }

  /**
   * Moves the highlight to the next item after the active one. Disabled items
   * are skipped while `skipDisabled` is true; past the last item it wraps to the
   * first when `loop` is true and stays put otherwise.
   */
  highlightNext(): void {
    if (this.deferIfUnrendered({ kind: 'next' })) {
      return;
    }
    const next = this.findFrom(this.activeIndexState(), 1);
    if (next !== null) {
      this.activeIndexState.set(next);
    }
  }

  /**
   * Moves the highlight to the item before the active one. Disabled items are
   * skipped while `skipDisabled` is true; before the first item it wraps to the
   * last when `loop` is true and stays put otherwise.
   */
  highlightPrev(): void {
    if (this.deferIfUnrendered({ kind: 'prev' })) {
      return;
    }
    const next = this.findFrom(this.activeIndexState(), -1);
    if (next !== null) {
      this.activeIndexState.set(next);
    }
  }

  /**
   * Moves the highlight to the first enabled item (the first item when
   * `skipDisabled` is false). Does nothing when no item qualifies.
   */
  highlightFirst(): void {
    if (this.deferIfUnrendered({ kind: 'first' })) {
      return;
    }
    const first = this.findBoundary(1);
    if (first !== null) {
      this.activeIndexState.set(first);
    }
  }

  /**
   * Moves the highlight to the last enabled item (the last item when
   * `skipDisabled` is false). With a virtual count it targets the last absolute
   * index even when that item is not rendered yet. Does nothing when no item
   * qualifies.
   */
  highlightLast(): void {
    if (this.deferIfUnrendered({ kind: 'last' })) {
      return;
    }
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
    if (this.deferIfUnrendered({ kind: 'byIndex', index })) {
      return;
    }
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
   * Highlight the first rendered item whose value matches (via `Object.is`).
   * No-op if no match. Disabled items are rejected when `skipDisabled()` is
   * true. In virtual mode only the rendered window is searched; the resolved
   * index is absolute.
   */
  highlightByValue(value: unknown): void {
    if (this.deferIfUnrendered({ kind: 'byValue', value })) {
      return;
    }
    const items = this.resolvedItems();
    const idx = items.findIndex((it) => Object.is(it.value, value));
    if (idx < 0) {
      return;
    }
    if (this.skipDisabled() && items[idx].disabled) {
      return;
    }
    this.activeIndexState.set(idx + this.windowOffset());
  }

  /** Clear the highlight, including a gesture still pending a deferred render. */
  resetHighlight(): void {
    this.pendingIntentState.set(null);
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

  protected handleKeydown(event: KeyboardEvent): void {
    // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
    // untouched (Ctrl+C would otherwise hit the typeahead branch and get
    // preventDefault'd). Shift stays allowed - it produces printable chars.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Skip events from editable descendants. Without this, every
    // printable key typed into a descendant <input> hits AD's typeahead
    // branch, gets preventDefault'd, and never reaches the input.
    const target = event.target as HTMLElement | null;
    if (target && target !== event.currentTarget && isEditableTarget(target)) {
      return;
    }

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
      this.handleActivationKey(event, key);
      return;
    }

    if (this.typeahead() && isPrintableChar(key)) {
      event.preventDefault();
      this.handleTypeahead(key);
    }
  }

  /** @internal True when `el` renders one of the host's own items. */
  private isOwnItemElement(el: Element): boolean {
    const id = el.id;
    return id !== '' && this.resolvedItems().some((item) => item.id === id);
  }

  /** Descendants that own Enter / Space; `CNGX_NESTED_INTERACTIVE_SELECTOR`. */
  private readonly nestedInteractive = inject(CNGX_NESTED_INTERACTIVE_SELECTOR);

  private handleActivationKey(event: KeyboardEvent, key: string): void {
    const host = this.hostEl.nativeElement as HTMLElement;
    // A focused control inside the host (a Retry button in an error banner)
    // owns its Enter / Space: no preventDefault, so its native activation runs,
    // and the active item stays untouched. The host's own item elements
    // (a role="menuitem" row that took focus from a click) are not such a
    // control: their keys still activate through the directive.
    const target = event.target as Element | null;
    const interactive = target?.closest(this.nestedInteractive);
    if (
      interactive &&
      interactive !== host &&
      host.contains(interactive) &&
      !this.isOwnItemElement(interactive)
    ) {
      return;
    }

    if (this.activeItem()) {
      event.preventDefault();
      this.activateCurrent();
      return;
    }

    // Nothing to activate: Space would scroll the page from a focused host,
    // unless the host takes text and the space must be typed. Enter stays
    // untouched so a consumer's own Enter handler still runs.
    if (key === ' ' && !isEditableTarget(host)) {
      event.preventDefault();
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
      case 'ArrowRight':
      case 'ArrowLeft': {
        if (orientation !== 'horizontal') {
          return;
        }
        // RTL flips the horizontal arrows (same kernel roving uses).
        const step = resolveInlineStep(key, this.direction());
        if (step === 1) {
          this.highlightNext();
        } else if (step === -1) {
          this.highlightPrev();
        }
        return;
      }
      case 'ArrowUp':
        if (orientation === 'vertical') {
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

  /**
   * Push a printable character into the typeahead buffer and jump to the next
   * matching option. Exposed for external keyboard hosts (e.g. a select
   * trigger) that keep focus on themselves while using active-descendant
   * semantics on a separate listbox.
   *
   * Consumers should only forward single-character printable keys (`length === 1`,
   * non-whitespace). Navigation keys and non-printables must not be forwarded.
   */
  typeaheadChar(ch: string): void {
    if (!this.typeahead()) {
      return;
    }
    this.handleTypeahead(ch);
  }

  private handleTypeahead(ch: string): void {
    const term = this.typeaheadWalker.type(ch);
    // Labels exist only for rendered items unless the host hands the full list
    // over, so the search space is the rendered window by default; matches map
    // back to absolute indices in virtual mode.
    const fullList = this.typeaheadItems();
    const items = fullList ?? this.resolvedItems();
    if (items.length === 0) {
      this.typeaheadMissed.emit(term);
      return;
    }
    const offset = fullList ? 0 : this.windowOffset();
    const activeRel = this.activeIndexState() < 0 ? -1 : this.activeIndexState() - offset;
    const rel = this.typeaheadWalker.find(items, term, activeRel, this.skipDisabled());
    if (rel < 0) {
      this.typeaheadMissed.emit(term);
      return;
    }
    this.activeIndexState.set(rel + offset);
  }

  private findFrom(current: number, direction: 1 | -1): number | null {
    return resolveStepFrom(current, direction, {
      count: this.totalCount(),
      loop: this.loop(),
      isDisabledAt: this.skipDisabled() ? (i) => this.isDisabledAt(i) : undefined,
    });
  }

  /**
   * First/last navigable absolute index. Spans the full virtual range - End
   * targets `totalCount - 1` even when that item is not rendered (it surfaces
   * as `pendingHighlight`); unrendered items count as enabled because their
   * disabled state is unknowable (`isDisabledAt` resolves them to `false`).
   */
  private findBoundary(direction: 1 | -1): number | null {
    return resolveBoundaryStep(direction, {
      count: this.totalCount(),
      isDisabledAt: this.skipDisabled() ? (i) => this.isDisabledAt(i) : undefined,
    });
  }

  private totalCount(): number {
    const vc = this.virtualCount();
    if (vc != null) {
      return vc;
    }
    return this.resolvedItems().length;
  }

  /** Rendered-window offset: `windowStart` in virtual mode, `0` otherwise. */
  private windowOffset(): number {
    return this.virtualCount() != null ? this.windowStart() : 0;
  }

  /** Item at an absolute index, `null` when outside the rendered window. */
  private itemAt(index: number): ActiveDescendantItem | null {
    const rel = index - this.windowOffset();
    const items = this.resolvedItems();
    if (rel < 0 || rel >= items.length) {
      return null;
    }
    return items[rel] ?? null;
  }

  private isDisabledAt(index: number): boolean {
    return !!this.itemAt(index)?.disabled;
  }

  private isRendered(index: number): boolean {
    return this.itemAt(index) !== null;
  }

  private scrollActiveIntoView(): void {
    const id = this.activeId();
    if (!id) {
      return;
    }
    // Document-wide by escaped id: aria-owns layouts render the option list
    // outside the host subtree, a host-scoped query never finds those.
    const doc = (this.hostEl.nativeElement as HTMLElement).ownerDocument;
    const el = doc.querySelector(`#${cssEscape(id)}`);
    if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
}

/**
 * @internal A highlight gesture remembered while the option rows are absent,
 * re-applied once they render. Captured as the gesture, not a resolved index:
 * an empty item space resolves to nothing, so the index must be computed
 * against the populated space at re-apply time.
 */
type PendingIntent =
  | { readonly kind: 'first' }
  | { readonly kind: 'last' }
  | { readonly kind: 'next' }
  | { readonly kind: 'prev' }
  | { readonly kind: 'byIndex'; readonly index: number }
  | { readonly kind: 'byValue'; readonly value: unknown };

/** @internal Where the highlight sits relative to the rendered rows. */
interface HighlightPlacement {
  readonly index: number;
  readonly rendered: boolean;
  readonly virtual: boolean;
}

/** @internal Item space the active index is derived against. */
interface ActiveIndexSource {
  readonly items: readonly ActiveDescendantItem[];
  readonly total: number;
  readonly virtual: boolean;
  readonly compareWith: (a: unknown, b: unknown) => boolean;
}

/**
 * @internal
 * Re-derives the index for a new item space. A virtual window keeps its
 * absolute index, and that index means nothing once the list turns plain. In a
 * plain list the previously active value is looked up again; unchanged items,
 * no previous highlight, or an index past the old items keep the index.
 */
function reResolveIndex(
  source: ActiveIndexSource,
  previousSource: ActiveIndexSource,
  previousIndex: number,
): number {
  if (source.virtual) {
    return previousIndex;
  }
  if (previousSource.virtual) {
    return -1;
  }
  if (previousSource.items === source.items || previousIndex < 0) {
    return previousIndex;
  }
  const previous = previousSource.items[previousIndex];
  if (!previous) {
    return previousIndex;
  }
  return source.items.findIndex((it) => source.compareWith(it.value, previous.value));
}

/** @internal Pulls an index that ran past the item space back onto its last item. */
function clampIndex(index: number, total: number): number {
  if (index < total) {
    return index;
  }
  return total > 0 ? total - 1 : -1;
}

/** @internal */
function handleToItem(handle: CngxAdItemHandle): ActiveDescendantItem {
  return {
    id: handle.id,
    value: handle.value(),
    label: handle.label(),
    disabled: handle.disabled?.() ?? false,
  };
}

/** @internal */
function isPrintableChar(key: string): boolean {
  return key.length === 1 && /\S/.exec(key) !== null;
}

/**
 * True when the element would capture text input natively - a text
 * `<input>`, `<textarea>`, or any `contenteditable` host. Read-only /
 * button-type inputs (submit, radio, checkbox) are NOT editable; AD's
 * keyboard navigation still applies when focus lands on them.
 *
 * @internal
 */
function isEditableTarget(el: HTMLElement): boolean {
  if (el.isContentEditable) {
    return true;
  }
  const tag = el.tagName;
  if (tag === 'TEXTAREA') {
    return true;
  }
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type.toLowerCase();
    return (
      type !== 'button' &&
      type !== 'submit' &&
      type !== 'reset' &&
      type !== 'checkbox' &&
      type !== 'radio' &&
      type !== 'range' &&
      type !== 'color' &&
      type !== 'file' &&
      type !== 'image'
    );
  }
  return false;
}

/** @internal */
function cssEscape(id: string): string {
  const api = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS;
  if (api && typeof api.escape === 'function') {
    return api.escape(id);
  }
  return id.replace(/[^a-zA-Z0-9_-]/g, (m) => `\\${m}`);
}
