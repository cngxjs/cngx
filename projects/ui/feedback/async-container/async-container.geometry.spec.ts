import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAsyncContainer } from './async-container';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-async-container)` block owns two out-of-flow surfaces
// (async-container.css): the refresh overlay is absolutely positioned and pinned
// across the block-start edge, and the always-present live-region span is the
// standard visually-hidden clip (absolute, 1px, overflow hidden) so it announces
// without occupying layout. The live-region span renders in every view, so it is
// the stable read here. jsdom reports `''` for every one of these values.

@Component({
  selector: 'cngx-async-container-geometry-host',
  standalone: true,
  imports: [CngxAsyncContainer],
  template: `
    <cngx-async-container [state]="state()">
      <ng-template>content</ng-template>
    </cngx-async-container>
  `,
})
class AsyncContainerHost {
  readonly state = signal<ManualAsyncState<string[]>>(createManualState<string[]>());
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AsyncContainerHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-async-container');
  if (!host) {
    throw new Error('cngx-async-container did not render');
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxAsyncContainer geometry', () => {
  it('clips the live-region span out of layout while keeping it in the DOM', () => {
    // The `.cngx-async-container__sr-only` span is present in every view (it is
    // rendered outside the view @switch). The absolute + 1px clip is the
    // visually-hidden pattern: announced by AT, zero layout footprint.
    const host = mount();
    const sr = query(host, '.cngx-async-container__sr-only');
    expect(computedValue(sr, 'position')).toBe('absolute');
    expect(computedValue(sr, 'width')).toBe('1px');
    expect(computedValue(sr, 'height')).toBe('1px');
    expect(computedValue(sr, 'overflow')).toBe('hidden');
  });
});
