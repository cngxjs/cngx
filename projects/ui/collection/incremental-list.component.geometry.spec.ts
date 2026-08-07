import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createAsyncStateMock, type AsyncStateMock } from '@cngx/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxIncrementalList } from './incremental-list.component';

// Runs in a real Chromium (the `test-geometry` target). Two browser-only
// invariants the `@scope (.cngx-incremental-list)` block SETs
// (incremental-list.component.css): the organism host is a block, and the
// first-load error branch is a centred vertical flex stack whose built-in retry
// button floors its height to the pointer-derived target so a coarse pointer
// always gets a full tap target. jsdom reports `''` for these reads.

@Component({
  selector: 'cngx-incremental-list-geometry-host',
  standalone: true,
  imports: [CngxIncrementalList],
  template: `<cngx-incremental-list [total]="0" [state]="state()" />`,
})
class IncrementalListHost {
  readonly state = signal<AsyncStateMock | undefined>(undefined);
}

let mountedRoot: HTMLElement | null = null;

function mount(): { host: HTMLElement; state: AsyncStateMock } {
  const fixture = TestBed.createComponent(IncrementalListHost);
  const state = createAsyncStateMock();
  // First-load error: renders the built-in `.cngx-incremental-list__error`
  // branch with its retry button.
  state.set({ status: 'error', firstLoad: true, empty: true });
  fixture.componentInstance.state.set(state);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-incremental-list');
  if (!host) {
    throw new Error('cngx-incremental-list did not render');
  }
  return { host: host as HTMLElement, state };
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

describe('CngxIncrementalList geometry', () => {
  it('renders the organism host as a block', () => {
    const { host } = mount();
    expect(computedValue(host, 'display')).toBe('block');
  });

  it('centres the first-load error branch as a vertical flex stack', () => {
    const { host } = mount();
    const error = query(host, '.cngx-incremental-list__error');
    expect(computedValue(error, 'display')).toBe('flex');
    expect(computedValue(error, 'flex-direction')).toBe('column');
    expect(computedValue(error, 'align-items')).toBe('center');
  });

  it('floors the retry button height to the pointer-derived minimum', () => {
    const { host } = mount();
    const retry = query(host, '.cngx-incremental-list__retry');
    // min-block-size is var(--cngx-target-min, 0px): inert on a fine pointer,
    // lifts to the floor on a coarse pointer.
    expect(computedValue(retry, 'min-block-size')).toBe('0px');
    host.style.setProperty('--cngx-target-min', '48px');
    expect(computedValue(retry, 'min-block-size')).toBe('48px');
  });
});
