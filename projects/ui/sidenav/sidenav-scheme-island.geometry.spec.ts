import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

// Runs in a real Chromium (the `test-geometry` target). The rail surface,
// border and focus ring resolve where the rail sits: a `[data-color-scheme]`
// island takes the island values, not the ones resolved once at :root. The
// bridged case guards the other direction: the Material bridge's zero-
// specificity broadcast still wins, so no SET on the host may shadow it.

@Component({
  selector: 'cngx-sidenav-scheme-island-host',
  standalone: true,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../common/theming/components/cngx-nav.css',
    './sidenav-scheme-island.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="island" data-color-scheme="dark">
      <cngx-sidenav class="island-rail" mode="side" [opened]="true" ariaLabel="Island">
        <span class="ring-probe">Inbox</span>
      </cngx-sidenav>
      <span
        class="island-probe"
        style="
          background-color: var(--cngx-color-surface);
          border-top: 1px solid var(--cngx-color-border);
          color: var(--cngx-color-text);
        "
      ></span>
    </div>
    <div class="bridge-probe">
      <cngx-sidenav-layout>
        <cngx-sidenav class="bridged-rail" mode="side" [opened]="true" ariaLabel="Bridged">
          Inbox
        </cngx-sidenav>
        <cngx-sidenav-content>Main</cngx-sidenav-content>
      </cngx-sidenav-layout>
      <span
        class="bridge-surface"
        style="background-color: var(--mat-sys-surface-container)"
      ></span>
    </div>
  `,
})
class SchemeIslandHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SchemeIslandHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function el(root: HTMLElement, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (!found) {
    throw new Error(`${selector} did not render`);
  }
  return found;
}

function ringColor(root: HTMLElement, token: string): string {
  const probe = el(root, '.ring-probe');
  probe.style.color = `var(${token})`;
  return getComputedStyle(probe).color;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  // isolate: false shares one environment across the file.
  document.documentElement.removeAttribute('data-color-scheme');
});

describe('CngxSidenav scheme island', () => {
  for (const placement of ['wrapper', 'root'] as const) {
    describe(`dark scheme on the ${placement}`, () => {
      function mountIn(): HTMLElement {
        const root = mount();
        if (placement === 'root') {
          el(root, '.island').removeAttribute('data-color-scheme');
          document.documentElement.setAttribute('data-color-scheme', 'dark');
        }
        return root;
      }

      it('paints the rail with the island surface', () => {
        const root = mountIn();
        expect(getComputedStyle(el(root, '.island-rail')).backgroundColor).toBe(
          getComputedStyle(el(root, '.island-probe')).backgroundColor,
        );
      });

      it('draws the rail edge in the island border colour', () => {
        const root = mountIn();
        expect(getComputedStyle(el(root, '.island-rail')).borderInlineEndColor).toBe(
          getComputedStyle(el(root, '.island-probe')).borderTopColor,
        );
      });

      it('builds the focus ring from the island text and surface', () => {
        const root = mountIn();
        const probe = getComputedStyle(el(root, '.island-probe'));
        expect(ringColor(root, '--cngx-nav-link-focus-outline-color')).toBe(probe.color);
        expect(ringColor(root, '--cngx-nav-link-focus-inner-color')).toBe(probe.backgroundColor);
      });
    });
  }

  it('keeps the Material surface on a rail inside a bridged layout', () => {
    const root = mount();
    expect(getComputedStyle(el(root, '.bridged-rail')).backgroundColor).toBe(
      getComputedStyle(el(root, '.bridge-surface')).backgroundColor,
    );
  });
});
