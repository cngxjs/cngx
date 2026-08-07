import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, gridTracks } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxLoadingOverlay } from './loading-overlay';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-loading-overlay)` block SETs (loading-overlay.css): the host is
// a single-cell grid so the content and the backdrop share one grid area and
// stack without absolute positioning, which is what keeps the spinner centred
// over the content it covers. This one spec sits in `feedback/loading/`, which
// also carries `progress.css` under the folder-level coverage heuristic. jsdom
// reports `''` for the grid reads.

@Component({
  selector: 'cngx-loading-overlay-geometry-host',
  standalone: true,
  imports: [CngxLoadingOverlay],
  template: `
    <cngx-loading-overlay [loading]="loading()">
      <div class="under">content underneath</div>
    </cngx-loading-overlay>
  `,
})
class LoadingOverlayHost {
  readonly loading = signal(false);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(LoadingOverlayHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-loading-overlay');
  if (!host) {
    throw new Error('cngx-loading-overlay did not render');
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

describe('CngxLoadingOverlay geometry', () => {
  it('resolves the host to a single-cell grid', () => {
    // grid-template: 1fr / 1fr resolves to exactly one column track and one row
    // track; the content and the backdrop both take grid-area 1/1, so the overlay
    // sits directly on top of the content without leaving the flow.
    const host = mount();
    expect(computedValue(host, 'display')).toBe('grid');
    expect(gridTracks(host, 'columns')).toHaveLength(1);
    expect(gridTracks(host, 'rows')).toHaveLength(1);
  });

  it('keeps the content wrapper on that single cell', () => {
    const host = mount();
    // The content wrapper is always in the DOM (it hosts the projected content),
    // pinned to the shared cell so the backdrop overlays it rather than displacing
    // it.
    const content = query(host, '.cngx-loading-overlay__content');
    expect(computedValue(content, 'grid-row-start')).toBe('1');
    expect(computedValue(content, 'grid-column-start')).toBe('1');
  });
});
