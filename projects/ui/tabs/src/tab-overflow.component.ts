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
  // on first render). Structural-equal `mapBoolEqual` prevents
  // identity-only re-emissions (the IO callback below allocates a
  // fresh Map every fire) from cascading into `hiddenTabs`.
  private readonly visibilityState = signal<ReadonlyMap<string, boolean>>(
    new Map(),
    { equal: mapBoolEqual },
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
    // Lazy-attach the IntersectionObserver. `afterNextRender` fires
    // after change-detection commits but content-projected elements
    // can land in their slot on a later microtask — closest() may
    // still return null on the first attempt. `requestAnimationFrame`
    // retry loop keeps polling until the host is connected to the
    // strip, capped at MAX_ATTACH_ATTEMPTS (~1s @ 60fps) so a
    // detached host inside a never-rendered ancestor (e.g. an
    // `*ngIf="false"` parent) cannot loop forever; cancelled on
    // destroy.
    const MAX_ATTACH_ATTEMPTS = 60;
    let frameHandle: number | null = null;
    let attachAttempts = 0;
    const tryAttach = (): void => {
      const root = this.findStripContainer();
      if (root) {
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
        frameHandle = null;
        return;
      }
      attachAttempts++;
      if (attachAttempts >= MAX_ATTACH_ATTEMPTS) {
        // Give up — the molecule is mounted somewhere the strip
        // wrapper never materialises. Any future projection would
        // re-construct the directive, restarting the attempt loop
        // with a fresh budget.
        frameHandle = null;
        return;
      }
      frameHandle = requestAnimationFrame(tryAttach);
    };
    afterNextRender(() => tryAttach());

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
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
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
        // threshold: 0 — any visible pixel = "in the strip". A
        // partially-clipped tab stays out of the dropdown; only
        // fully-clipped entries surface as "hidden".
        next.set(tabId, entry.isIntersecting);
      }
      return next;
    });
  }

  /**
   * Resolves the parent organism's scroll container
   * (`.cngx-tabs__strip`). The molecule sits as a sibling of the
   * strip inside `.cngx-tabs__strip-wrapper`, so we walk up to the
   * wrapper and then queryselect the strip child.
   */
  private findStripContainer(): HTMLElement | null {
    const wrapper = this.hostElement.closest<HTMLElement>(
      '.cngx-tabs__strip-wrapper',
    );
    return wrapper?.querySelector<HTMLElement>('.cngx-tabs__strip') ?? null;
  }
}
