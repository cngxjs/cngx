import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxTab, CngxTabContent, CngxTabLabel } from '@cngx/common/tabs';
import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTabGroup } from './tab-group.component';

// Runs in a real Chromium (the `test-geometry` target). Two browser-only
// invariants the `@scope (.cngx-tab-group)` block SETs (tab-group.component.css):
// the tab panel is a per-panel inline-size query container named `cngx-tab-panel`
// (a cross-consumer contract - consumers write `@container cngx-tab-panel (...)`
// against the panel's own content width, and it is on the panel not the host so a
// vertical strip width never pollutes the query), and the tab strip is a
// non-wrapping horizontal flex row. This one spec sits in `tabs/`, which also
// carries `tab-nav.component.css` and `tab-overflow.component.css` under the
// folder-level coverage heuristic. jsdom reports `''` for every one of these
// reads.

@Component({
  selector: 'cngx-tab-group-geometry-host',
  standalone: true,
  imports: [CngxTabGroup, CngxTab, CngxTabLabel, CngxTabContent],
  template: `
    <cngx-tab-group aria-label="Settings">
      <div cngxTab [label]="'A'">
        <ng-template cngxTabLabel>A</ng-template>
        <ng-template cngxTabContent>A content</ng-template>
      </div>
      <div cngxTab [label]="'B'">
        <ng-template cngxTabLabel>B</ng-template>
        <ng-template cngxTabContent>B content</ng-template>
      </div>
    </cngx-tab-group>
  `,
})
class TabGroupHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TabGroupHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-tab-group');
  if (!host) {
    throw new Error('cngx-tab-group did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function stubAggregator(): CngxErrorAggregatorContract {
  return {
    hasError: signal(true),
    errorCount: signal(3),
    activeErrors: signal<readonly string[]>([]),
    errorLabels: signal<readonly string[]>([]),
    shouldShow: signal(true),
    announcement: signal('3 errors'),
    addSource: () => {},
    removeSource: () => {},
  };
}

@Component({
  selector: 'cngx-tab-badge-geometry-host',
  standalone: true,
  imports: [CngxTabGroup, CngxTab],
  template: `
    <cngx-tab-group aria-label="Settings">
      <div cngxTab [label]="'A'" [errorAggregator]="agg"></div>
      <div cngxTab [label]="'B'"></div>
    </cngx-tab-group>
  `,
})
class TabBadgeHost {
  agg = stubAggregator();
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxTabGroup geometry', () => {
  it('names the per-panel inline-size query container on the panel, not the host', () => {
    const host = mount();
    // The container context sits on `.cngx-tabs__panel`; the host is deliberately
    // NOT a container so a vertical strip width cannot pollute the panel query.
    const panel = query(host, '.cngx-tabs__panel');
    const container = containerState(panel);
    expect(container.type).toBe('inline-size');
    expect(container.name).toBe('cngx-tab-panel');
    // The host itself declares no containment.
    expect(containerState(host).type).toBe('normal');
  });

  it('lays the tab strip out as a non-wrapping horizontal flex row', () => {
    const host = mount();
    const strip = query(host, '.cngx-tabs__strip');
    expect(computedValue(strip, 'display')).toBe('flex');
    expect(computedValue(strip, 'flex-direction')).toBe('row');
    expect(computedValue(strip, 'flex-wrap')).toBe('nowrap');
    expect(computedValue(strip, 'align-items')).toBe('stretch');
  });

  it('isolates the error-badge count as a bidi run under dir=rtl', () => {
    document.documentElement.dir = 'rtl';
    const fixture = TestBed.createComponent(TabBadgeHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const badge = query(mountedRoot, '.cngx-tabs__badge');
    // Single self-contained error count; isolate fences the bidi boundary
    // without forcing a direction (metric bucket-A).
    expect(computedValue(badge, 'unicode-bidi')).toBe('isolate');
  });
});
