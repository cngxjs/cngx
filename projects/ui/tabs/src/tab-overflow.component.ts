import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
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

import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';
import {
  CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  CNGX_TAB_PANEL_HOST,
  CngxTabOverflowItem,
  CngxTabOverflowTrigger,
  createDomAnchorRetry,
  createTabOverflowTemplateBindings,
  injectTabsConfig,
  injectTabsI18n,
  type CngxDomAnchorRetryHandle,
  type CngxTabHandle,
  type CngxTabPanelHost,
} from '@cngx/common/tabs';

/**
 * Structural equality for `hiddenTabs` — identical when the same tab
 * ids appear in the same order. Prevents the popover-list from
 * re-rendering on shape-stable visibility re-emissions.
 */
function tabIdListEqual(
  a: readonly CngxTabHandle[],
  b: readonly CngxTabHandle[],
): boolean {
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
 * Structural equality for the `visibilityState` map: identical when
 * both maps carry the same key-set with the same boolean visibility
 * per key. Without this, `handleIntersections`'s `update((prev) =>
 * new Map(prev))` cycle produces a fresh Map reference on every
 * IntersectionObserver fire — `hiddenTabs` would re-derive on every
 * scroll even when no tab actually flipped visibility, cascading
 * into the popover-list outlet.
 */
function mapBoolEqual(
  a: ReadonlyMap<string, boolean>,
  b: ReadonlyMap<string, boolean>,
): boolean {
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
 * Opt-in overflow indicator for `<cngx-tab-group>`. Detects tab
 * buttons that have scrolled out of the strip viewport (or never
 * fit) and surfaces them through a "More" `CngxPopover` dropdown.
 *
 * Designed to live as a sibling of `<cngx-tab-group>`'s tablist —
 * consumers project it inside the organism explicitly (Pillar 3,
 * opt-in composition). The molecule talks to the organism only
 * through {@link CNGX_TAB_PANEL_HOST}; never the concrete
 * `CngxTabGroup` class.
 *
 * Visibility is tracked via a native `IntersectionObserver` rooted
 * on the parent's `.cngx-tabs__strip` scroll container — the
 * directive `CngxIntersectionObserver` is intentionally NOT used
 * here because it attaches to a single element, while this
 * molecule needs to observe N tab buttons that live in a sibling
 * component's view (`viewChildren` would never reach them). The
 * observer runs at `threshold: 0` so any visible pixel of a tab
 * counts as "in the strip" — only fully-clipped entries land in
 * the More dropdown. Combined with the organism's
 * `scrollIntoView` effect on `activeId` change, this forms the
 * self-healing loop: pick a hidden tab → strip scrolls it in →
 * IO fires `isIntersecting=true` → `hiddenTabs` self-trims.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-tab-overflow',
  exportAs: 'cngxTabOverflow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxPopover, CngxPopoverTrigger],
  templateUrl: './tab-overflow.component.html',
  styleUrls: ['./tab-overflow.component.css'],
  host: {
    '[class.cngx-tab-overflow]': 'true',
  },
})
export class CngxTabOverflow {
  // The molecule is rendered via the organism's `<ng-content>` slot,
  // so projected DI lookup walks up to `<cngx-tab-group>`'s injector
  // without `{ host: true }` (which would scope to the molecule's
  // own host element and miss the parent provider).
  protected readonly panelHost: CngxTabPanelHost = inject(CNGX_TAB_PANEL_HOST);
  protected readonly i18n = injectTabsI18n();
  protected readonly popover = viewChild.required(CngxPopover);

  private readonly hostElement: HTMLElement = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  // DOM-resolution strategy. The default factory mirrors the
  // cngx-native `<cngx-tab-group>` selector contract (walks up to
  // `.cngx-tabs__strip-wrapper`, looks up `[id="${handle.id}-header"]`);
  // overrides via the directive's `providers` swap in Material or
  // custom-skin variants without forking the molecule.
  private readonly adapter = inject(
    CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  )();

  // Maps tab id -> visibility. `undefined` = not yet observed (treat
  // as visible until proven otherwise so the More button never flashes
  // on first render). `linkedSignal` derives stale-id pruning from
  // the panel-host tabs list — when a tab is removed, its
  // visibility entry drops automatically; user writes via the IO
  // callback persist until the next tabs-list change. Splits the
  // two responsibilities (derived pruning vs imperative observer
  // rewire) cleanly: stale-id removal lives here, observer
  // re-attachment lives in the effect below.
  // Structural-equal `mapBoolEqual` prevents identity-only
  // re-emissions (the IO callback allocates a fresh Map every fire)
  // from cascading into `hiddenTabs`.
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

  protected readonly hasHiddenTabs = computed(
    () => this.hiddenTabs().length > 0,
    { equal: Object.is },
  );

  // Stable counter signal — the More button's label and aria-label
  // both project this value. The default `Object.is` equality on a
  // primitive number is the correct distinct-until-changed gate;
  // making the signal explicit ensures the trigger button never
  // re-renders the counter text when `hiddenTabs` has emitted an
  // identity-different but length-equal value (flicker prevention).
  protected readonly hiddenCount = computed(() => this.hiddenTabs().length);

  // Resolved tabs config — read once at construction so downstream
  // field-init reads (`stabilizeMs`, `maxDeferMs`, `templates`) all
  // see the same snapshot. Declared here ahead of those fields
  // because TypeScript class fields execute in declaration order.
  private readonly tabsConfig = injectTabsConfig();

  // Family-standard 3-stage template cascade — per-instance
  // directive > config.templates.overflow* > built-in markup. The
  // `contentChild` queries must be field-direct initializers per
  // Angular's compile-time contract; the factory absorbs the
  // resolution + context-builder logic so the organism stays under
  // the 180-LOC class-body guard.
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
  // Maps an observed DOM target back to the cngx handle id whose
  // visibility it represents. Populated in `observeCurrentTabs` (where
  // we already have both the target and the handle in scope), read in
  // `handleIntersections`. Decouples the molecule from any specific
  // DOM-id convention — cngx-native renders buttons with id
  // `${handle.id}-header`; Material owns the rendered DOM and uses
  // `mat-tab-group-N-label-M`. Either flow works as long as the
  // adapter resolves the right element. WeakMap so detached buttons
  // GC freely; entries auto-drop with the DOM nodes.
  private readonly targetToHandleId = new WeakMap<HTMLElement, string>();

  // Quiescence window (ms) for the IO-driven visibility map. Strip
  // animations (Material's mat-tab transition; the cngx-native
  // active-bar slide; pagination scroll; tab-list reflow on resize)
  // emit a burst of IntersectionObserver events through the
  // animation's keyframes — the boolean `isIntersecting` for any
  // particular tab can flip multiple times before settling. Without
  // a quiescence gate, the More button's counter flickers through
  // the intermediate states. This timer collapses bursts: every IO
  // event resets the timer; commit happens only after `stabilizeMs`
  // of silence — i.e. effectively at animation-end. The accumulated
  // entries are replayed in arrival order so the FINAL state for
  // each target wins (Map.set in commitPendingVisibility overwrites
  // earlier transients per key).
  //
  // Both timing knobs read from the resolved `CngxTabsConfig` so
  // consumers can tune them via `withTabOverflowStabilizeMs(...)` /
  // `withTabOverflowMaxDeferMs(...)` to match their strip animation
  // duration and freshness contract. Library defaults: 100ms
  // quiescence, 250ms max-defer ceiling. Field-init reads — the
  // resolved config is captured once at construction (see
  // `tabsConfig` above for the canonical snapshot); runtime config
  // swaps would require a re-instantiation regardless because
  // IntersectionObserver attachment is one-shot.
  private readonly stabilizeMs = this.tabsConfig.overflowStabilizeMs ?? 100;
  // Hard ceiling on the quiescence-debounce window. Without this, a
  // sustained IO churn pattern (entries arriving every <stabilizeMs
  // for >maxDeferMs — momentum scrolling, continuous resize, an
  // animation that keeps Material's tab-list reflowing every frame)
  // would keep clearing the stabilize timer indefinitely. The
  // counter would freeze on a stale value the entire time, breaking
  // Pillar 2 (state-change communication must hold under sustained
  // input). `maxDeferMs` forces a flush regardless of further IO
  // events once the buffer has been waiting this long.
  private readonly maxDeferMs = this.tabsConfig.overflowMaxDeferMs ?? 250;
  private stabilizeHandle: ReturnType<typeof setTimeout> | null = null;
  private pendingEntries: IntersectionObserverEntry[] = [];
  // Timestamp (performance.now()) of the FIRST entry pushed since
  // the last commit. `null` between commits. Drives the max-defer
  // cap above.
  private firstPendingAt: number | null = null;

  // rAF-scheduled retry loop for the IntersectionObserver attach.
  // Field-init reference; .start() is called from `afterNextRender`
  // below; .cancel() runs on destroy. The give-up branch dev-warns
  // and bails — a detached host inside a never-rendered ancestor
  // (e.g. `*ngIf="false"` parent) requires an unmount/remount cycle
  // so Angular re-instantiates the directive with a fresh budget.
  // `display: none` toggles do NOT recover — constructor never
  // re-runs.
  private readonly attachRetry: CngxDomAnchorRetryHandle =
    createDomAnchorRetry({
      attempt: () => {
        const root = this.resolveStrip();
        if (!root) {
          return null;
        }
        // threshold: 0 — any pixel of the tab inside the strip
        // counts as "visible". Combined with the organism's
        // `scrollIntoView` effect, this means once a hidden tab is
        // selected the strip scrolls it in, the IO fires
        // `isIntersecting=true`, the visibility map updates, and the
        // entry self-removes from `hiddenTabs`. The plan's
        // "self-healing" loop.
        this.observer = new IntersectionObserver(
          (entries) => this.handleIntersections(entries),
          { root, threshold: 0 },
        );
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

    // Re-observe whenever the tab list changes. Stale-id pruning is
    // derived through `visibilityState`'s `linkedSignal` source —
    // this effect's only remaining responsibility is the imperative
    // observer rewire (disconnect + observe-current-tabs), which
    // cannot live inside a derived signal. Reading
    // `panelHost.tabs()` is the tracking trigger.
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
    // Buffer entries; the actual signal write happens in
    // `commitPendingVisibility` once IO emissions go quiet for
    // STABILIZE_MS — capped by MAX_DEFER_MS. See the comment blocks
    // above for why.
    for (const entry of entries) {
      this.pendingEntries.push(entry);
    }
    const now = performance.now();
    this.firstPendingAt ??= now;
    if (this.stabilizeHandle !== null) {
      clearTimeout(this.stabilizeHandle);
    }
    // Wait the smaller of (STABILIZE_MS, remaining max-defer window).
    // Once the max-defer window is exhausted, fire on the very next
    // tick (`Math.max(0, …)` guards a negative remaining when the
    // event loop returned from a long task).
    const elapsed = now - this.firstPendingAt;
    const maxDeferRemaining = this.maxDeferMs - elapsed;
    const wait = Math.max(
      0,
      Math.min(this.stabilizeMs, maxDeferRemaining),
    );
    this.stabilizeHandle = setTimeout(
      () => this.commitPendingVisibility(),
      wait,
    );
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
          // Unknown target — possible during a tabs-list churn between
          // observer.disconnect() and the next observeCurrentTabs(),
          // or for a target observed by a stale registration. Skip
          // rather than mis-key the visibility map.
          continue;
        }
        // threshold: 0 — any visible pixel = "in the strip". A
        // partially-clipped tab stays out of the dropdown; only
        // fully-clipped entries surface as "hidden".
        next.set(tabId, entry.isIntersecting);
      }
      return next;
    });
  }

  /**
   * Delegates IntersectionObserver-root resolution to the injected
   * adapter. The default adapter mirrors the cngx-native organism's
   * `.cngx-tabs__strip-wrapper` → `.cngx-tabs__strip` walk; the
   * Material adapter shipped from `@cngx/ui/mat-tabs` walks
   * `.mat-mdc-tab-header` → `.mat-mdc-tab-label-container` instead.
   * Either path returns `null` when the molecule's host has not yet
   * been anchored inside the variant's scroll container — the rAF
   * retry loop polls again on the next frame.
   */
  private resolveStrip(): HTMLElement | null {
    return this.adapter.resolveStripRoot(this.panelHost, this.hostElement);
  }
}
