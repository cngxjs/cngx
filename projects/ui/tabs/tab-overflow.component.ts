import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  isDevMode,
  linkedSignal,
  untracked,
  viewChild,
} from '@angular/core';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import { CngxClickOutside } from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';
import {
  CNGX_DOM_ANCHOR_RETRY_FACTORY,
  CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  CNGX_TAB_PANEL_HOST,
  CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY,
  CngxTabOverflowItem,
  CngxTabOverflowTrigger,
  createTabOverflowTemplateBindings,
  injectTabsConfig,
  injectTabsI18n,
  tabOverflowOptionId,
  type CngxDomAnchorRetryHandle,
  type CngxTabHandle,
  type CngxTabPanelHost,
} from '@cngx/common/tabs';

/**
 * Structural equal for `hiddenTabs` - same ids in same order.
 *
 * @internal
 */
function tabIdListEqual(a: readonly CngxTabHandle[], b: readonly CngxTabHandle[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) {
      return false;
    }
  }
  return true;
}

/**
 * Auto-open keys for the trigger button (APG combobox).
 *
 * @internal
 */
const NAV_OPEN_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);

/**
 * Structural equal for `visibilityState`. Without this, the
 * `update((prev) => new Map(prev))` cycle in `handleIntersections`
 * cascades into `hiddenTabs` on every IO fire even when no tab
 * actually flipped visibility.
 *
 * @internal
 */
function mapBoolEqual(a: ReadonlyMap<string, boolean>, b: ReadonlyMap<string, boolean>): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, value] of a) {
    if (b.get(key) !== value) {
      return false;
    }
  }
  return true;
}

/**
 * Opt-in overflow indicator for `<cngx-tab-group>`. Surfaces clipped
 * tab buttons through a "More" `CngxPopover` dropdown. Talks to the
 * organism only via {@link CNGX_TAB_PANEL_HOST}.
 *
 * Visibility is tracked through a native `IntersectionObserver`
 * rooted on the parent strip - `CngxIntersectionObserver` doesn't
 * fit (single-element scope, can't reach sibling `viewChildren`).
 * `threshold: 0` - only fully-clipped tabs surface. Combined with
 * the organism's `scrollIntoView` effect this forms the self-healing
 * loop: pick hidden tab -> strip scrolls -> IO fires -> `hiddenTabs`
 * self-trims.
 *
 * @playground Overflow showcase ./examples/overflow-showcase/overflow-showcase.component.ts
 *
 * @category ui/tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/tabs/tab-overflow.component.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroup, CngxPopover, CngxActiveDescendant
 * <example-url>http://localhost:4200/#/ui/tabs/tab-overflow/8-tabs-in-a-narrow-container</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-overflow/all-skins-horizontal</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-overflow/all-skins-vertical</example-url>
 */
@Component({
  selector: 'cngx-tab-overflow',
  exportAs: 'cngxTabOverflow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    CngxActiveDescendant,
    CngxClickOutside,
    CngxPopover,
    CngxPopoverTrigger,
  ],
  templateUrl: './tab-overflow.component.html',
  styleUrls: ['./tab-overflow.component.css'],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.cngx-tab-overflow]': 'true',
  },
})
export class CngxTabOverflow {
  // Projected via <ng-content>, so DI walks up to the parent's injector.
  // `{ host: true }` would scope to the molecule and miss the provider.
  protected readonly panelHost: CngxTabPanelHost = inject(CNGX_TAB_PANEL_HOST);
  protected readonly i18n = injectTabsI18n();
  protected readonly popover = viewChild.required(CngxPopover);
  private readonly adRef = viewChild.required(CngxActiveDescendant);

  private readonly hostElement: HTMLElement =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  // DOM-resolution strategy. Default factory targets the cngx-native
  // strip selectors; Material/custom variants swap via providers.
  private readonly adapter = inject(CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY)();

  // tab id -> visibility. `undefined` = not yet observed (treat as
  // visible - prevents More-button flash on first render).
  // `linkedSignal` prunes stale ids when the tabs list changes;
  // observer re-attach lives in the effect below. `mapBoolEqual`
  // suppresses identity-only re-emissions from the IO callback.
  private readonly visibilityState = linkedSignal<
    readonly CngxTabHandle[],
    ReadonlyMap<string, boolean>
  >({
    source: () => this.panelHost.tabs(),
    computation: (tabs, prev) => {
      if (!prev) {
        return new Map();
      }
      const liveIds = new Set(tabs.map((t) => t.id));
      const next = new Map<string, boolean>();
      for (const [id, vis] of prev.value) {
        if (liveIds.has(id)) {
          next.set(id, vis);
        }
      }
      return next;
    },
    equal: mapBoolEqual,
  });

  protected readonly hiddenTabs = computed<readonly CngxTabHandle[]>(
    () => {
      const visMap = this.visibilityState();
      return this.panelHost.tabs().filter((t) => visMap.get(t.id) === false);
    },
    { equal: tabIdListEqual },
  );

  protected readonly hasHiddenTabs = computed(() => this.hiddenTabs().length > 0, {
    equal: Object.is,
  });

  // Counter projected into trigger label + aria-label. Explicit
  // computed isolates `Object.is` distinct-gate from `hiddenTabs`
  // identity churn - prevents flicker on length-equal re-emissions.
  protected readonly hiddenCount = computed(() => this.hiddenTabs().length);

  // ARIA menu-button pattern: <button aria-haspopup="menu"> + popover
  // role="menu". Quick-jump navigation (selectById is not a value
  // commit), so menu/menuitem is correct - listbox/option implies
  // persistent aria-selected. WAI-ARIA 1.2 §combobox forbids
  // aria-haspopup="menu", so combobox is deliberately not used.
  protected readonly adItemId = tabOverflowOptionId;

  // Read first - TS field-init order; downstream fields snapshot off this.
  private readonly tabsConfig = injectTabsConfig();

  // 3-stage cascade: directive > config.templates.overflow* > built-in.
  // `contentChild` must be a field-direct initializer (Angular AOT).
  private readonly triggerSlot = contentChild(CngxTabOverflowTrigger);
  private readonly itemSlot = contentChild(CngxTabOverflowItem);
  protected readonly templates = createTabOverflowTemplateBindings({
    triggerSlot: this.triggerSlot,
    itemSlot: this.itemSlot,
    config: this.tabsConfig,
    hiddenCount: this.hiddenCount,
    hiddenTabs: this.hiddenTabs,
    pickTab: (tab) => this.pickTab(tab),
  });

  private observer: IntersectionObserver | null = null;
  // Variant-agnostic target -> id lookup. cngx-native uses
  // `${id}-header`, Material `mat-tab-group-N-label-M`.
  private readonly targetToHandleId = new WeakMap<HTMLElement, string>();

  // IO-debounce knobs - see `CngxTabsConfig.overflowStabilizeMs` /
  // `.overflowMaxDeferMs` for semantics. Captured once at construction.
  private readonly stabilizeMs = this.tabsConfig.overflowStabilizeMs ?? 100;
  private readonly maxDeferMs = this.tabsConfig.overflowMaxDeferMs ?? 250;
  private stabilizeHandle: ReturnType<typeof setTimeout> | null = null;
  private pendingEntries: IntersectionObserverEntry[] = [];
  // performance.now() of the first entry since the last commit; null
  // between commits. Drives the max-defer cap.
  private firstPendingAt: number | null = null;

  // rAF-scheduled IO attach retry. `display: none` toggles do NOT
  // recover - unmount/remount is required to re-arm. Policy swap
  // via CNGX_DOM_ANCHOR_RETRY_FACTORY.
  private readonly attachRetry: CngxDomAnchorRetryHandle = inject(CNGX_DOM_ANCHOR_RETRY_FACTORY)({
    attempt: () => {
      const root = this.resolveStrip();
      if (!root) {
        return null;
      }
      // threshold: 0 - any visible pixel = "in the strip". Drives
      // the self-healing loop with the organism's scrollIntoView.
      this.observer = new IntersectionObserver((entries) => this.handleIntersections(entries), {
        root,
        threshold: 0,
      });
      this.observeCurrentTabs();
      return true;
    },
    maxAttempts: 60,
    schedule: (cb) => {
      const handle = requestAnimationFrame(cb);
      return () => cancelAnimationFrame(handle);
    },
    onGiveUp: () => {
      if (isDevMode()) {
        console.warn(
          '[CngxTabOverflow] Strip wrapper not found after 60 attach ' +
            'attempts; the More popover will not surface clipped tabs. ' +
            'Verify the molecule is projected inside <cngx-tab-group> ' +
            'via its <ng-content> slot.',
        );
      }
    },
  });

  constructor() {
    afterNextRender(() => this.attachRetry.start());

    // Re-observe on tab-list change. Stale-id pruning is derived in
    // `visibilityState`'s linkedSignal source.
    effect(() => {
      this.panelHost.tabs();
      untracked(() => {
        if (!this.observer) {
          return;
        }
        this.observer.disconnect();
        this.observeCurrentTabs();
      });
    });

    inject(CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY)(this.popover, this.adRef);

    this.destroyRef.onDestroy(() => {
      this.attachRetry.cancel();
      if (this.stabilizeHandle !== null) {
        clearTimeout(this.stabilizeHandle);
        this.stabilizeHandle = null;
      }
      this.firstPendingAt = null;
      this.pendingEntries.length = 0;
      this.observer?.disconnect();
      this.observer = null;
    });
  }

  protected pickTab(tab: CngxTabHandle): void {
    this.panelHost.selectById(tab.id);
    this.popover().hide();
  }

  /** AD `(activated)` - Enter / Space on a highlighted option picks. */
  protected handleAdActivated(value: unknown): void {
    const tab = value as CngxTabHandle;
    if (tab?.id) {
      this.pickTab(tab);
    }
  }

  /**
   * Auto-opens popover on nav-key when collapsed. AD's host listener
   * fires first, so `activeIndex` is already set when this runs.
   * No-op while open - AD owns navigation.
   */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.popover().isVisible() || !this.hasHiddenTabs()) {
      return;
    }
    if (NAV_OPEN_KEYS.has(event.key)) {
      this.popover().show();
    }
  }

  private observeCurrentTabs(): void {
    if (!this.observer) {
      return;
    }
    const root = this.resolveStrip();
    if (!root) {
      return;
    }
    const tabs = this.panelHost.tabs();
    for (let idx = 0; idx < tabs.length; idx++) {
      const button = this.adapter.resolveTabButton(tabs[idx], root, idx);
      if (button) {
        this.targetToHandleId.set(button, tabs[idx].id);
        this.observer.observe(button);
      }
    }
  }

  private handleIntersections(entries: IntersectionObserverEntry[]): void {
    // Buffer entries; signal write deferred to commitPendingVisibility
    // once IO settles for stabilizeMs (capped by maxDeferMs).
    for (const entry of entries) {
      this.pendingEntries.push(entry);
    }
    const now = performance.now();
    this.firstPendingAt ??= now;
    if (this.stabilizeHandle !== null) {
      clearTimeout(this.stabilizeHandle);
    }
    // Wait min(stabilizeMs, remaining max-defer). Math.max(0, …)
    // guards a negative remaining after a long task.
    const elapsed = now - this.firstPendingAt;
    const maxDeferRemaining = this.maxDeferMs - elapsed;
    const wait = Math.max(0, Math.min(this.stabilizeMs, maxDeferRemaining));
    this.stabilizeHandle = setTimeout(() => this.commitPendingVisibility(), wait);
  }

  private commitPendingVisibility(): void {
    this.stabilizeHandle = null;
    this.firstPendingAt = null;
    const entries = this.pendingEntries;
    if (entries.length === 0) {
      return;
    }
    this.pendingEntries = [];
    this.visibilityState.update((prev) => {
      const next = new Map(prev);
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const tabId = this.targetToHandleId.get(target);
        if (tabId === undefined) {
          // Stale registration during disconnect/observeCurrentTabs
          // churn - skip rather than mis-key.
          continue;
        }
        // threshold: 0 - partially-clipped stays visible; only
        // fully-clipped surfaces as hidden.
        next.set(tabId, entry.isIntersecting);
      }
      return next;
    });
  }

  /**
   * IO-root resolution via the injected adapter. Returns `null`
   * before the molecule is anchored - the rAF retry loop re-polls.
   */
  private resolveStrip(): HTMLElement | null {
    return this.adapter.resolveStripRoot(this.panelHost, this.hostElement);
  }
}
