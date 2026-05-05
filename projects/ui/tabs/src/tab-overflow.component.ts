import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';
import {
  CNGX_TAB_PANEL_HOST,
  injectTabsI18n,
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
 * observer treats `intersectionRatio < 1` as "hidden" so partially
 * clipped tabs are surfaced through the More dropdown.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-tab-overflow',
  exportAs: 'cngxTabOverflow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxPopover, CngxPopoverTrigger],
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

  // Maps tab id -> visibility. `undefined` = not yet observed (treat
  // as visible until proven otherwise so the More button never flashes
  // on first render).
  private readonly visibilityState = signal<ReadonlyMap<string, boolean>>(
    new Map(),
  );

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

  private observer: IntersectionObserver | null = null;

  constructor() {
    // Set up the observer once the parent organism has rendered the
    // tab buttons — `afterNextRender` defers until the DOM is mounted.
    afterNextRender(() => {
      this.setupObserver();
      this.observeCurrentTabs();
    });

    // Re-observe whenever the tab list changes. The presenter's
    // structural-equal `tabsState` short-circuits no-op re-emissions,
    // so this fires only on real add / remove / replace.
    effect(() => {
      const tabs = this.panelHost.tabs();
      untracked(() => {
        if (!this.observer) {
          return;
        }
        // Drop visibility entries for tabs that no longer exist so
        // `hiddenTabs` doesn't stay populated with stale ids.
        const liveIds = new Set(tabs.map((t) => t.id));
        const next = new Map<string, boolean>();
        for (const [id, vis] of this.visibilityState()) {
          if (liveIds.has(id)) {
            next.set(id, vis);
          }
        }
        this.visibilityState.set(next);
        this.observer.disconnect();
        this.observeCurrentTabs();
      });
    });

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  }

  protected pickTab(tab: CngxTabHandle): void {
    this.panelHost.selectById(tab.id);
    this.popover().hide();
  }

  private setupObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const root = this.findStripContainer();
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersections(entries),
      { root, threshold: 1.0 },
    );
  }

  private observeCurrentTabs(): void {
    if (!this.observer) {
      return;
    }
    const root = this.findStripContainer();
    if (!root) {
      return;
    }
    for (const tab of this.panelHost.tabs()) {
      const button = root.querySelector<HTMLElement>(
        `[id="${tab.id}-header"]`,
      );
      if (button) {
        this.observer.observe(button);
      }
    }
  }

  private handleIntersections(entries: IntersectionObserverEntry[]): void {
    this.visibilityState.update((prev) => {
      const next = new Map(prev);
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const headerId = target.id;
        const tabId = headerId.endsWith('-header')
          ? headerId.slice(0, -'-header'.length)
          : headerId;
        next.set(tabId, entry.isIntersecting && entry.intersectionRatio >= 1);
      }
      return next;
    });
  }

  /**
   * Walks up from this molecule's host to find the parent organism's
   * scroll container (`.cngx-tabs__strip`). The molecule lives as a
   * sibling of the strip inside `<cngx-tab-group>`, so a single
   * ancestor lookup + `querySelector` reaches it.
   */
  private findStripContainer(): HTMLElement | null {
    let node: HTMLElement | null = this.hostElement;
    while (node) {
      const strip = node.querySelector<HTMLElement>('.cngx-tabs__strip');
      if (strip) {
        return strip;
      }
      node = node.parentElement;
    }
    return null;
  }
}
