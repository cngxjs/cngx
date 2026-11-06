import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). Error copy is text, so
// it reads the danger text rung, not the raw danger fill colour, and clears
// 4.5:1 on the surface in both schemes.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-error-text-contrast-host',
  standalone: true,
  styleUrls: [
    '../core/theming/system-tokens.css',
    './stat-card/stat-card.component.css',
    './collection/incremental-list.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
        <div class="cngx-stat-card">
          <div class="cngx-stat-card__error cngx-empty-state">
            <span class="cngx-stat-card__error-icon stat-card-icon">!</span>
            <p class="cngx-empty-state__title stat-card-title">Could not load</p>
          </div>
        </div>
        <div class="cngx-incremental-list">
          <p class="cngx-incremental-list__error-text list-error">Could not load</p>
        </div>
      </div>
    }
  `,
})
class ErrorTextHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ErrorTextHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function at(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('error copy contrast', () => {
  it.each(SCHEMES)('paints the stat-card error title at 4.5:1 or more in %s', (scheme) => {
    const block = at(mount(), `.scheme-${scheme}`);
    const surface = computedValue(at(block, '.probe-surface'), 'color');
    const title = computedValue(at(block, '.stat-card-title'), 'color');
    expect(contrastRatio(title, surface)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SCHEMES)('paints the incremental-list error text at 4.5:1 or more in %s', (scheme) => {
    const block = at(mount(), `.scheme-${scheme}`);
    const surface = computedValue(at(block, '.probe-surface'), 'color');
    const text = computedValue(at(block, '.list-error'), 'color');
    expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(4.5);
  });
});
