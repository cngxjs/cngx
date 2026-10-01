/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Quiet chrome without a
// state de-emphasises by colour, never opacity: the empty-state default icon
// and the sidenav footer take the muted text colour, and the stat-card error
// icon keeps its danger colour at full strength.
//
// The empty-state icon colour is a registered <color> token SET at :root, so
// it resolves against the document scheme, not a data-color-scheme wrapper;
// its scheme comes from prefers-color-scheme instead.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-de-emphasis-colour-host',
  standalone: true,
  styleUrls: [
    '../core/theming/system-tokens.css',
    './empty-state/empty-state.component.css',
    './stat-card/stat-card.component.css',
    './sidenav/sidenav.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cngx-empty-state">
      <span class="cngx-empty-state__icon-slot"></span>
      <span class="cngx-empty-state__default-icon empty-icon">?</span>
    </div>
    <span class="probe-root-muted" style="color: var(--cngx-color-text-muted)"></span>
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-stat-card">
          <div class="cngx-stat-card__error cngx-empty-state">
            <span class="cngx-stat-card__error-icon error-icon">!</span>
          </div>
        </div>
        <div class="cngx-sidenav-footer footer">Workspace v2.1</div>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
        <span
          class="probe-danger"
          style="color: var(--cngx-color-danger, oklch(0.6 0.18 25))"
        ></span>
      </div>
    }
  `,
})
class DeEmphasisHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(DeEmphasisHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

// Opacity of the element and every ancestor multiplied: the value a user
// actually sees, whichever element carries it.
function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('quiet de-emphasis by colour, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints the empty-state default icon in the muted colour at full opacity', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
    const root = mount();
    const icon = one(root, '.empty-icon');
    expect(effectiveOpacity(icon)).toBe(1);
    expect(computedValue(icon, 'color')).toBe(
      computedValue(one(root, '.probe-root-muted'), 'color'),
    );
  });

  it('paints the sidenav footer in the muted colour at full opacity', () => {
    const root = mount();
    const footer = at(root, '.footer');
    expect(effectiveOpacity(footer)).toBe(1);
    expect(computedValue(footer, 'color')).toBe(computedValue(at(root, '.probe-muted'), 'color'));
  });

  it('keeps the stat-card error icon at full strength in the danger colour', () => {
    const root = mount();
    const icon = at(root, '.error-icon');
    expect(effectiveOpacity(icon)).toBe(1);
    expect(computedValue(icon, 'color')).toBe(computedValue(at(root, '.probe-danger'), 'color'));
  });
});
