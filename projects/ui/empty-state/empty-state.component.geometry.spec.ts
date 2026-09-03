import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxEmptyState } from './empty-state.component';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-empty-state)` block SETs (empty-state.component.css): the host
// is a centred vertical flex column whose row gap and block padding are derived
// from the `--cngx-space-*` scale (the registered pixel initials would otherwise
// defeat the use-site fallbacks, so a `[data-density]` swap has to reach through
// the SET), and the trailing action row is its own flex line. jsdom reports `''`
// for every one of these reads.

@Component({
  selector: 'cngx-empty-state-geometry-host',
  standalone: true,
  imports: [CngxEmptyState],
  template: `<cngx-empty-state [title]="'Nothing here'" />`,
})
class EmptyStateHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(EmptyStateHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-empty-state');
  if (!host) {
    throw new Error('cngx-empty-state did not render');
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

describe('CngxEmptyState geometry', () => {
  it('centres its content as a vertical flex column', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('flex');
    expect(computedValue(host, 'flex-direction')).toBe('column');
    expect(computedValue(host, 'align-items')).toBe('center');
  });

  it('derives the row gap and block padding from the --cngx-space scale', () => {
    // `:scope` SETs `--cngx-empty-gap: var(--cngx-space-md)` and
    // `--cngx-empty-padding: var(--cngx-space-xl)`, both read on the host, so
    // driving the scale mimics what a `[data-density]` ancestor does. Driving the
    // scale rather than the component token proves the SET is live (the registered
    // pixel initial would otherwise freeze the value).
    const host = mount();
    host.style.setProperty('--cngx-space-md', '10px');
    host.style.setProperty('--cngx-space-xl', '40px');
    expect(computedValue(host, 'row-gap')).toBe('10px');
    expect(computedValue(host, 'padding-block-start')).toBe('40px');
  });

  it('lays the trailing action row out as its own flex line', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-empty-state__actions'), 'display')).toBe('flex');
  });

  it('removes the host from layout when the [state] auto-hide sets hidden', () => {
    // The author-layer `display: flex` on `:scope` beats the UA's
    // non-important `[hidden] { display: none }` - the stylesheet re-asserts
    // `:scope[hidden]`, otherwise the auto-hide is visually dead.
    const host = mount();
    host.setAttribute('hidden', '');
    expect(computedValue(host, 'display')).toBe('none');
  });
});
