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
      <cngx-sidenav class="island-end" position="end" mode="side" [opened]="true" ariaLabel="End">
        Inbox
      </cngx-sidenav>
      <span
        class="island-probe"
        style="
          background-color: var(--cngx-color-surface);
          border-top: 1px solid var(--cngx-color-border);
          color: var(--cngx-color-text);
        "
      ></span>
      <span class="muted-probe" style="color: var(--cngx-color-text-muted)"></span>
    </div>
    <cngx-sidenav
      class="brand-rail"
      mode="side"
      [opened]="true"
      ariaLabel="Brand"
      style="--cngx-sidenav-bg: rgb(20, 40, 80); --cngx-sidenav-color: rgb(250, 240, 200)"
    >
      <span class="brand-ring-probe">Inbox</span>
    </cngx-sidenav>
    <cngx-sidenav class="page-rail" mode="side" [opened]="true" ariaLabel="Page"
      >Inbox</cngx-sidenav
    >
    <div dir="rtl">
      <cngx-sidenav class="rtl-rail" mode="side" [opened]="true" ariaLabel="RTL"
        >Inbox</cngx-sidenav
      >
      <cngx-sidenav class="rtl-end" position="end" mode="side" [opened]="true" ariaLabel="RTL end">
        Inbox
      </cngx-sidenav>
    </div>
    <div class="bridge-probe">
      <cngx-sidenav-layout>
        <cngx-sidenav class="bridged-rail" mode="side" [opened]="true" ariaLabel="Bridged">
          Inbox
        </cngx-sidenav>
        <cngx-sidenav-content>Main</cngx-sidenav-content>
      </cngx-sidenav-layout>
      <cngx-sidenav class="bare-bridged-rail" mode="side" [opened]="true" ariaLabel="Bare">
        Inbox
      </cngx-sidenav>
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

function ringColor(root: HTMLElement, token: string, selector = '.ring-probe'): string {
  const probe = el(root, selector);
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

      it('writes the rail text in the island text colour', () => {
        const root = mountIn();
        expect(getComputedStyle(el(root, '.island-rail')).color).toBe(
          getComputedStyle(el(root, '.island-probe')).color,
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

      it('writes the section label in the island muted text colour', () => {
        const root = mountIn();
        expect(ringColor(root, '--cngx-nav-label-color')).toBe(
          getComputedStyle(el(root, '.muted-probe')).color,
        );
      });
    });
  }

  it('draws the focus ring outer colour from the brand rail ink', () => {
    const root = mount();
    expect(ringColor(root, '--cngx-nav-link-focus-outline-color', '.brand-ring-probe')).toBe(
      'rgb(250, 240, 200)',
    );
    expect(ringColor(root, '--cngx-nav-link-focus-inner-color', '.brand-ring-probe')).toBe(
      'rgb(20, 40, 80)',
    );
  });

  // The peek casts the expanded shadow; the state is the sidebar's attribute.
  function peekShadow(root: HTMLElement, selector: string): { x: string; tint: string } {
    const rail = el(root, selector);
    rail.setAttribute('data-sidebar-state', 'peek');
    const shadow = getComputedStyle(rail).boxShadow;
    const match = /^(.*\)) (-?\d+px) 0px 12px/.exec(shadow);
    if (!match) {
      throw new Error(`${selector} casts no expanded shadow: ${shadow}`);
    }
    return { tint: match[1], x: match[2] };
  }

  it('deepens the peek shadow inside a dark island and keeps it light on a light page', () => {
    const root = mount();
    expect(peekShadow(root, '.island-rail').tint).toContain('0.45');
    expect(peekShadow(root, '.page-rail').tint).toContain('0.1');
  });

  it('casts the shadow toward the content for start, end and RTL rails', () => {
    const root = mount();
    expect(peekShadow(root, '.page-rail').x).toBe('4px');
    expect(peekShadow(root, '.island-end').x).toBe('-4px');
    expect(peekShadow(root, '.rtl-rail').x).toBe('-4px');
    expect(peekShadow(root, '.rtl-end').x).toBe('4px');
  });

  it('gives a bare rail without a layout the Material surface', () => {
    const root = mount();
    expect(getComputedStyle(el(root, '.bare-bridged-rail')).backgroundColor).toBe(
      getComputedStyle(el(root, '.bridge-surface')).backgroundColor,
    );
  });

  it('keeps the Material surface on a rail inside a bridged layout', () => {
    const root = mount();
    expect(getComputedStyle(el(root, '.bridged-rail')).backgroundColor).toBe(
      getComputedStyle(el(root, '.bridge-surface')).backgroundColor,
    );
  });
});
