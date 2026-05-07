import { Component, effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  CngxTab,
  CngxTabOverflowItem,
  CngxTabOverflowTrigger,
  provideTabsConfig,
  withTabOverflowMaxDeferMs,
  type CngxTabOverflowDomAdapter,
} from '@cngx/common/tabs';

import { CngxTabGroup } from './tab-group.component';
import { CngxTabOverflow } from './tab-overflow.component';

@Component({
  standalone: true,
  imports: [CngxTabGroup, CngxTab, CngxTabOverflow],
  template: `
    <cngx-tab-group aria-label="Overflow host">
      @for (label of labels(); track label) {
        <div cngxTab [label]="label"></div>
      }
      <cngx-tab-overflow></cngx-tab-overflow>
    </cngx-tab-group>
  `,
})
class OverflowHost {
  readonly labels = signal(['A', 'B', 'C', 'D']);
}

interface MockObserverCallback {
  (entries: IntersectionObserverEntry[]): void;
}

interface MockObserverInstance {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
  fire(entries: Array<{ target: Element; isIntersecting: boolean; intersectionRatio: number }>): void;
}

function stubPopoverApi(): void {
  // jsdom ships no `HTMLElement.showPopover` / `.hidePopover`. The
  // CngxPopover directive uses the modern Popover API; without these
  // stubs the popover toggle throws an Uncaught TypeError that
  // pollutes the spec run even though the assertions land first.
  if (!('showPopover' in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      writable: true,
      value: function () {},
    });
  }
  if (!('hidePopover' in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
      configurable: true,
      writable: true,
      value: function () {},
    });
  }
}

async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

// Wait out the molecule's IO-debounce window plus a microtask drain
// so the visibilityState write has committed before assertions run.
// Real-timer based — the molecule uses setTimeout, and per
// `feedback_afternextrender_in_zoneless_tests` we avoid mixing fake
// timers with whenStable. CngxTabOverflow.STABILIZE_MS is 100ms;
// 130ms gives a safety margin for jsdom timer jitter.
async function flushStabilize(): Promise<void> {
  await new Promise((res) => setTimeout(res, 130));
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
  }
}

function installMockIntersectionObserver(): { instances: MockObserverInstance[] } {
  const instances: MockObserverInstance[] = [];

  class MockIntersectionObserver implements MockObserverInstance {
    private readonly observed = new Set<Element>();

    constructor(private readonly callback: MockObserverCallback) {
      instances.push(this);
    }

    observe(target: Element): void {
      this.observed.add(target);
    }

    unobserve(target: Element): void {
      this.observed.delete(target);
    }

    disconnect(): void {
      this.observed.clear();
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }

    fire(
      entries: Array<{
        target: Element;
        isIntersecting: boolean;
        intersectionRatio: number;
      }>,
    ): void {
      this.callback(
        entries.map(
          (e) =>
            ({
              target: e.target,
              isIntersecting: e.isIntersecting,
              intersectionRatio: e.intersectionRatio,
              boundingClientRect: e.target.getBoundingClientRect(),
              rootBounds: null,
              intersectionRect: e.target.getBoundingClientRect(),
              time: 0,
            }) as IntersectionObserverEntry,
        ),
      );
    }

    get root(): Element | Document | null {
      return null;
    }

    get rootMargin(): string {
      return '';
    }

    get thresholds(): readonly number[] {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  return { instances };
}

describe('CngxTabOverflow', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    stubPopoverApi();
  });

  it('mounts role=menu on the popover surface, role=presentation on the <ul> (APG flattened landmark)', async () => {
    // Pre-fix: <div cngxPopover>...<ul role="menu"><li role="menuitem">
    // — AT reported a generic group then drilled into a separate menu
    // landmark, doubling the depth. Post-fix: role=menu sits on the
    // popover surface itself, <ul> is flattened via role=presentation,
    // menuitems are direct children of the menu landmark.
    installMockIntersectionObserver();
    stubPopoverApi();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const popoverSurface = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__panel',
    ) as HTMLElement;
    const list = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__list',
    ) as HTMLElement;
    expect(popoverSurface.getAttribute('role')).toBe('menu');
    expect(list.getAttribute('role')).toBe('presentation');
  });

  it('hides the More trigger when no tabs are clipped', async () => {
    installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const trigger = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__trigger',
    ) as HTMLElement;
    expect(trigger).not.toBeNull();
    expect(trigger.hidden).toBe(true);
  });

  it('reveals the More trigger when a tab reports isIntersecting=false (fully clipped)', async () => {
    const { instances } = installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const observer = instances[0];
    expect(observer).toBeDefined();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'cngx-tab-group button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons.length).toBe(4);
    // Mark the last two as clipped. Partial-clip cases
    // (isIntersecting=true, ratio<1) count as visible under
    // threshold-0 semantics — the user can still see *some*
    // pixels of the tab, no need to surface it in the dropdown.
    observer.fire([
      { target: buttons[0], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[1], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[2], isIntersecting: true, intersectionRatio: 0.4 },
      { target: buttons[3], isIntersecting: false, intersectionRatio: 0 },
    ]);
    await flushStabilize();
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__trigger',
    ) as HTMLElement;
    expect(trigger.hidden).toBe(false);
    // Trigger label includes the count of fully-clipped tabs.
    expect(trigger.textContent?.trim()).toMatch(/1 more/);
  });

  it('clicking a hidden-tab row delegates selectById through the panel host', async () => {
    const { instances } = installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const observer = instances[0];
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'cngx-tab-group button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    observer.fire([
      { target: buttons[0], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[1], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[2], isIntersecting: false, intersectionRatio: 0 },
      { target: buttons[3], isIntersecting: false, intersectionRatio: 0 },
    ]);
    await flushStabilize();
    fixture.detectChanges();
    // Open the popover.
    const trigger = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.cngx-tab-overflow__item',
      ) as NodeListOf<HTMLElement>,
    );
    expect(items.length).toBe(2);
    items[0].click();
    fixture.detectChanges();
    expect(buttons[2].getAttribute('aria-selected')).toBe('true');
  });

  it('drops stale visibility entries when a tab is removed from the registry', async () => {
    const { instances } = installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const observer = instances[0];
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'cngx-tab-group button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    observer.fire([
      { target: buttons[2], isIntersecting: false, intersectionRatio: 0 },
      { target: buttons[3], isIntersecting: false, intersectionRatio: 0 },
    ]);
    await flushStabilize();
    fixture.detectChanges();
    const triggerBefore = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__trigger',
    ) as HTMLElement;
    expect(triggerBefore.hidden).toBe(false);
    // Remove the last two tabs from the registry — hiddenTabs should
    // re-derive to empty since the stale ids drop out.
    fixture.componentInstance.labels.set(['A', 'B']);
    fixture.detectChanges();
    const triggerAfter = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__trigger',
    ) as HTMLElement;
    expect(triggerAfter.hidden).toBe(true);
  });

  it('visibilityState signal is identity-stable across same-shape IO emissions (mapBoolEqual gate)', async () => {
    // Regression-fence for `reference_signal_architecture` Equality
    // Rule. The IO callback's `update((prev) => new Map(prev))`
    // produces a fresh Map reference on every fire. Without
    // `mapBoolEqual` on the source `visibilityState` signal, every
    // IO event would invalidate the signal — and every downstream
    // `effect`/`computed` that reads it would re-fire / recompute,
    // even when no tab actually flipped visibility. The cascading
    // recompute is the cost we want to avoid. Asserting against
    // `hiddenTabs` (which already carries `tabIdListEqual` on its
    // computed) does NOT prove the source-signal gate works —
    // `tabIdListEqual` would suppress the value write regardless,
    // producing a coincidence pass. Instead, install an
    // `effect()` that reads `visibilityState` directly via the
    // private field and count its invocations: if `mapBoolEqual`
    // works, two identical IO fires produce one effect run, not two.
    //
    // Implementation-detail trade-off (intentional): the cast at
    // line ~292 reaches into the private `visibilityState` field via
    // a type assertion. cngx testing convention discourages
    // implementation-detail coupling — but this regression-fence
    // CANNOT be expressed against the public surface (`hiddenTabs`)
    // without relying on the very downstream gate (`tabIdListEqual`)
    // that masks the bug we're testing for. Exposing a public
    // testing proxy for `visibilityState` would be worse: it
    // architecturally formalises a private slot. Future readers
    // tempted to "clean this up" by routing through `hiddenTabs`
    // should re-read this paragraph first — the cast is the price
    // of admission for a load-bearing fence.
    const { instances } = installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const observer = instances[0];
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'cngx-tab-group button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    const overflow = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxTabOverflow,
    ).componentInstance as InstanceType<typeof CngxTabOverflow>;

    // Install a tracking effect against the private signal. If
    // `mapBoolEqual` correctly suppresses identity-only writes, the
    // effect runs ONCE per real change — not once per IO emission.
    const visibilityRef = (
      overflow as unknown as {
        visibilityState: () => ReadonlyMap<string, boolean>;
      }
    ).visibilityState;
    let runs = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        visibilityRef();
        runs++;
      });
    });
    TestBed.flushEffects();
    const baseline = runs;

    observer.fire([
      { target: buttons[0], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[1], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[2], isIntersecting: false, intersectionRatio: 0 },
      { target: buttons[3], isIntersecting: false, intersectionRatio: 0 },
    ]);
    await flushStabilize();
    TestBed.flushEffects();
    const afterFirst = runs;

    // Second fire with IDENTICAL entries. `mapBoolEqual` MUST gate
    // the source signal — effect run count must NOT increment.
    observer.fire([
      { target: buttons[0], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[1], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[2], isIntersecting: false, intersectionRatio: 0 },
      { target: buttons[3], isIntersecting: false, intersectionRatio: 0 },
    ]);
    await flushStabilize();
    TestBed.flushEffects();
    const afterSecond = runs;

    // First IO fire flipped two tabs from "not yet observed" to
    // "false" → real change → effect re-fired. afterFirst > baseline.
    expect(afterFirst).toBeGreaterThan(baseline);
    // Second IO fire with identical entries → no real change →
    // `mapBoolEqual` suppresses the write → effect did NOT re-fire.
    expect(afterSecond).toBe(afterFirst);
  });

  it('hidden-tab rows emit aria-disabled by value (true / false), never by attribute presence (cngx ARIA-by-value rule)', async () => {
    // Pillar 2 + cngx-rule: ARIA attributes toggled by value, never
    // by add/remove. Absence of `aria-disabled` is technically valid
    // per W3C, but the cngx convention is structural presence so
    // AT can read state directly without inferring "not present"
    // means false.
    const { instances } = installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const observer = instances[0];
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'cngx-tab-group button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    observer.fire([
      { target: buttons[0], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[1], isIntersecting: true, intersectionRatio: 1 },
      { target: buttons[2], isIntersecting: false, intersectionRatio: 0 },
      { target: buttons[3], isIntersecting: false, intersectionRatio: 0 },
    ]);
    await flushStabilize();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const items = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.cngx-tab-overflow__item',
      ) as NodeListOf<HTMLElement>,
    );
    expect(items.length).toBe(2);
    for (const item of items) {
      const aria = item.getAttribute('aria-disabled');
      expect(aria).not.toBeNull();
      expect(['true', 'false']).toContain(aria);
    }
  });

  it('quiescence timer caps at MAX_DEFER_MS so the visibility map commits even under sustained IO churn', async () => {
    // Pillar-2 regression fence: without a max-defer cap, an IO
    // churn pattern (entries arriving every <STABILIZE_MS) would
    // keep clearing the stabilize timer indefinitely. The counter
    // would freeze on a stale value the entire time. The cap MUST
    // force a commit within MAX_DEFER_MS regardless of further
    // resets — proven here by counting visibilityState emissions
    // during a sustained-churn window that exceeds the cap.
    const { instances } = installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const observer = instances[0];
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'cngx-tab-group button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    const overflow = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxTabOverflow,
    ).componentInstance as InstanceType<typeof CngxTabOverflow>;

    const visibilityRef = (
      overflow as unknown as {
        visibilityState: () => ReadonlyMap<string, boolean>;
      }
    ).visibilityState;
    let emissions = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        visibilityRef();
        emissions++;
      });
    });
    TestBed.flushEffects();
    const baseline = emissions;

    // Sustained churn: 5 IO fires every 50ms (faster than the
    // 100ms quiescence window). Each fire toggles b3's visibility.
    // Without max-defer (250ms cap), 0 commits would land before
    // the loop ends. With the cap, at least one commit fires while
    // the churn is still in progress.
    for (let i = 0; i < 5; i++) {
      observer.fire([
        {
          target: buttons[3],
          isIntersecting: i % 2 === 0,
          intersectionRatio: 0,
        },
      ]);
      await new Promise((res) => setTimeout(res, 50));
    }
    // Tail wait — let the cap-driven flush land before assertions.
    await new Promise((res) => setTimeout(res, 130));
    TestBed.flushEffects();

    expect(emissions).toBeGreaterThan(baseline);
  });

  it('respects withTabOverflowMaxDeferMs override — a tighter cap forces a commit sooner', async () => {
    // Pins the cascade contract: per-instance > viewProviders >
    // root provider > library default. Library default is 250ms.
    // Override to 80ms — under sustained 50ms-period IO churn, the
    // tighter cap MUST flush at least one commit within ~120ms
    // wall-clock (well below the library default that would never
    // flush in this window).
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabOverflowMaxDeferMs(80)),
      ],
    });
    stubPopoverApi();
    const { instances } = installMockIntersectionObserver();
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const observer = instances[0];
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'cngx-tab-group button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    const overflow = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxTabOverflow,
    ).componentInstance as InstanceType<typeof CngxTabOverflow>;
    const visibilityRef = (
      overflow as unknown as {
        visibilityState: () => ReadonlyMap<string, boolean>;
      }
    ).visibilityState;
    let emissions = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        visibilityRef();
        emissions++;
      });
    });
    TestBed.flushEffects();
    const baseline = emissions;

    // Drive the same churn pattern as the library-default test: 5
    // IO fires every 50ms (faster than the 100ms quiescence). With
    // the 80ms cap, the very first cycle exhausts the budget and
    // the next IO event triggers the cap-driven flush — at least
    // one emission lands within the loop.
    for (let i = 0; i < 4; i++) {
      observer.fire([
        {
          target: buttons[3],
          isIntersecting: i % 2 === 0,
          intersectionRatio: 0,
        },
      ]);
      await new Promise((res) => setTimeout(res, 50));
    }
    // Tail wait — short, just enough to drain the cap-driven flush.
    await new Promise((res) => setTimeout(res, 30));
    TestBed.flushEffects();

    expect(emissions).toBeGreaterThan(baseline);
  });

  it('handles foreign-id button schemes via target→handle id mapping (Material-style ids)', async () => {
    // Regression fence for the smart-overflow-on-Material flow.
    // Material renders tab buttons with ids like `mat-tab-group-1-label-N`,
    // NOT the cngx-native `${handle.id}-header` convention. The
    // molecule's IO-callback used to recover the cngx handle id by
    // string-stripping the `-header` suffix from `target.id`; that
    // failed for Material because the foreign ids carry no `-header`
    // suffix and don't match any cngx handle. The fix keys the
    // visibility map via a target→handle id WeakMap populated at
    // observe time. This axis pins that contract by simulating a
    // custom adapter that returns buttons whose DOM ids deliberately
    // do NOT correlate to the cngx handle ids — the popover must
    // still surface the right hidden tabs.
    const { instances } = installMockIntersectionObserver();
    const customStrip = document.createElement('div');
    customStrip.className = 'custom-overflow-strip';
    document.body.appendChild(customStrip);

    // Pre-create 4 buttons with foreign-scheme ids, in registration
    // order, that the custom adapter will hand back via positional
    // index (Material-style resolution).
    const foreignButtons: HTMLButtonElement[] = ['alpha', 'bravo', 'charlie', 'delta'].map(
      (codeName) => {
        const btn = document.createElement('button');
        btn.id = `foreign-scheme-${codeName}`;
        customStrip.appendChild(btn);
        return btn;
      },
    );

    const customAdapter = {
      resolveStripRoot: () => customStrip,
      resolveTabButton: (
        _handle: unknown,
        _root: HTMLElement,
        idx: number,
      ): HTMLElement | null => foreignButtons[idx] ?? null,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
          useValue: () => customAdapter,
        },
      ],
    });
    stubPopoverApi();

    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();

    const observer = instances[0];
    expect(observer).toBeDefined();
    // Mark trailing 2 buttons as fully clipped — the IO entry's
    // target.id is `foreign-scheme-charlie` / `-delta`, which has
    // no relationship to the cngx handle ids of the 'C' / 'D' tabs
    // (those are nextUid-generated). Without the WeakMap fix, the
    // molecule would key the visibility map by the foreign ids and
    // hiddenTabs() would find zero matches.
    observer.fire([
      { target: foreignButtons[0], isIntersecting: true, intersectionRatio: 1 },
      { target: foreignButtons[1], isIntersecting: true, intersectionRatio: 1 },
      { target: foreignButtons[2], isIntersecting: false, intersectionRatio: 0 },
      { target: foreignButtons[3], isIntersecting: false, intersectionRatio: 0 },
    ]);
    await flushStabilize();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.cngx-tab-overflow__trigger',
    ) as HTMLElement;
    expect(trigger.hidden).toBe(false);
    expect(trigger.textContent?.trim()).toMatch(/2 more/);

    customStrip.remove();
  });

  it('delegates DOM resolution to the injected adapter (cascade axis — default vs override)', async () => {
    // The default `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY` mirrors the
    // cngx-native selector contract, so the existing axes already
    // pin the default cascade. This axis pins the OTHER side of the
    // cascade: a custom adapter override flows through the molecule
    // unchanged. The contract is structural (host element passed +
    // panelHost reference + per-tab idx), so a delegation spy is the
    // right shape — driving the IO callback through a fabricated
    // strip would test IO plumbing again, not the adapter swap.
    installMockIntersectionObserver();
    const customStrip = document.createElement('div');
    customStrip.className = 'custom-overflow-strip';
    document.body.appendChild(customStrip);

    const resolveStripRootSpy = vi.fn();
    const resolveTabButtonSpy = vi.fn();
    const customAdapter: CngxTabOverflowDomAdapter = {
      resolveStripRoot: (panelHost, host) => {
        resolveStripRootSpy(panelHost, host);
        return customStrip;
      },
      resolveTabButton: (handle, root, idx) => {
        resolveTabButtonSpy(handle, root, idx);
        const button = document.createElement('button');
        button.id = `${handle.id}-custom`;
        customStrip.appendChild(button);
        return button;
      },
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
          useValue: () => customAdapter,
        },
      ],
    });
    stubPopoverApi();

    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    expect(resolveStripRootSpy).toHaveBeenCalled();
    // Adapter receives the molecule's <cngx-tab-overflow> host element
    // — pins the contract that variants like the Material adapter rely
    // on for `closest('.mat-mdc-tab-header')` walks.
    const stripCall = resolveStripRootSpy.mock.calls[0];
    expect(stripCall[1]).toBeInstanceOf(HTMLElement);
    expect((stripCall[1] as HTMLElement).tagName).toBe('CNGX-TAB-OVERFLOW');

    // Each of the four registered tab handles flows through
    // `resolveTabButton` with its positional idx — pins the index
    // contract the Material adapter consumes.
    expect(resolveTabButtonSpy).toHaveBeenCalledTimes(4);
    const indices = resolveTabButtonSpy.mock.calls.map((c) => c[2]);
    expect(indices).toEqual([0, 1, 2, 3]);

    customStrip.remove();
  });

  describe('template-cascade slot directives', () => {
    @Component({
      standalone: true,
      imports: [
        CngxTabGroup,
        CngxTab,
        CngxTabOverflow,
        CngxTabOverflowTrigger,
        CngxTabOverflowItem,
      ],
      template: `
        <cngx-tab-group aria-label="Per-instance host">
          @for (label of labels(); track label) {
            <div cngxTab [label]="label"></div>
          }
          <cngx-tab-overflow>
            <ng-template
              cngxTabOverflowTrigger
              let-count
              let-hidden="hiddenTabs"
            >
              <span class="instance-trigger">
                INST(#{{ count }} | first={{ hidden[0]?.id ?? 'none' }})
              </span>
            </ng-template>
            <ng-template cngxTabOverflowItem let-tab let-index="index">
              <span class="instance-item">
                INST({{ index }}:{{ tab.id }})
              </span>
            </ng-template>
          </cngx-tab-overflow>
        </cngx-tab-group>
      `,
    })
    class PerInstanceHost {
      readonly labels = signal(['A', 'B', 'C', 'D']);
    }

    it('per-instance *cngxTabOverflowTrigger / *cngxTabOverflowItem win the cascade', async () => {
      installMockIntersectionObserver();
      stubPopoverApi();
      const fixture = TestBed.createComponent(PerInstanceHost);
      fixture.detectChanges();
      await flushMicrotasks();

      const overflow = fixture.debugElement.query(
        (el) => el.componentInstance instanceof CngxTabOverflow,
      ).componentInstance as InstanceType<typeof CngxTabOverflow>;
      // Pull a real tab id from the molecule's panel-host registry —
      // CngxTab auto-generates ids; hardcoding 'A'/'B' would not match.
      const realIds = (
        overflow as unknown as {
          panelHost: { tabs: () => readonly { id: string }[] };
        }
      ).panelHost.tabs().map((t) => t.id);
      const targetId = realIds[1];

      // Force a hidden state by writing the visibility map directly —
      // bypasses IO-debounce timing and pins the cascade contract
      // independent of intersection observer plumbing.
      (
        overflow as unknown as {
          visibilityState: {
            update: (
              fn: (
                prev: ReadonlyMap<string, boolean>,
              ) => ReadonlyMap<string, boolean>,
            ) => void;
          };
        }
      ).visibilityState.update(() => new Map([[targetId, false]]));
      TestBed.flushEffects();
      fixture.detectChanges();

      const triggerHtml = (
        fixture.nativeElement.querySelector(
          '.cngx-tab-overflow__trigger',
        ) as HTMLElement
      ).innerHTML;
      expect(triggerHtml).toContain(`INST(#1 | first=${targetId})`);
      const itemHtml = (
        fixture.nativeElement.querySelector(
          '.cngx-tab-overflow__item',
        ) as HTMLElement
      ).innerHTML;
      expect(itemHtml).toContain(`INST(0:${targetId})`);
    });

    // Middle-tier (config) cascade is covered by the factory-level
    // spec at projects/common/tabs/src/overflow/overflow-template-cascade.spec.ts —
    // reproducing the TemplateRef-through-config integration here adds
    // jsdom plumbing complexity without proving anything beyond what
    // the factory spec already pins. Per-instance + default tiers stay
    // covered as integration axes because they touch the molecule's
    // template path directly.

    it('falls through to the default built-in label when neither tier supplies a template', async () => {
      installMockIntersectionObserver();
      stubPopoverApi();
      const fixture = TestBed.createComponent(OverflowHost);
      fixture.detectChanges();
      await flushMicrotasks();

      const overflow = fixture.debugElement.query(
        (el) => el.componentInstance instanceof CngxTabOverflow,
      ).componentInstance as InstanceType<typeof CngxTabOverflow>;
      const realIds = (
        overflow as unknown as {
          panelHost: { tabs: () => readonly { id: string }[] };
        }
      ).panelHost.tabs().map((t) => t.id);

      (
        overflow as unknown as {
          visibilityState: {
            update: (
              fn: (
                prev: ReadonlyMap<string, boolean>,
              ) => ReadonlyMap<string, boolean>,
            ) => void;
          };
        }
      ).visibilityState.update(() => new Map([[realIds[3], false]]));
      TestBed.flushEffects();
      fixture.detectChanges();

      // Default branch — built-in span renders the i18n moreTabsLabel
      // (English library default `${count} more`). The exact phrasing
      // is brittle to lock; assert the fallback fired by checking for
      // the EN keyword `more` and absence of any consumer-template
      // markers.
      const triggerHtml = (
        fixture.nativeElement.querySelector(
          '.cngx-tab-overflow__trigger',
        ) as HTMLElement
      ).innerHTML.toLowerCase();
      expect(triggerHtml).toMatch(/\bmore\b/);
      expect(triggerHtml).not.toContain('inst(');
      expect(triggerHtml).not.toContain('cfg(');
    });
  });
});
