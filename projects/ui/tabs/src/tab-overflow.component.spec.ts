import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxTab } from '@cngx/common/tabs';

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
});
