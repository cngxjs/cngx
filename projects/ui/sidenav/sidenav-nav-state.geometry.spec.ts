/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxNavLink } from '@cngx/common/interactive';
import { computedValue, contrastRatio, oklabOf, parkPointer } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

import { CngxSidenav } from './sidenav';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// sidenav.css and the system tokens. The nav rows paint five states in one
// shape: rest (transparent), hover, pressed, active, active+hover, each fill a
// primary tint over transparent that composites over the rail surface. Pins the
// contrast floors (row text >= 4.5:1 on every fill), the fill order (each step
// further from the surface, light and dark), the state precedence on real
// pseudo-classes, and that the fills are SET on the host, so an accent scoped
// to one rail reaches only that rail.

const SCHEMES = ['light', 'dark'] as const;
const FILLS = ['hover', 'pressed', 'active', 'active-hover'] as const;
type Fill = (typeof FILLS)[number];

@Component({
  selector: 'cngx-sidenav-nav-state-host',
  standalone: true,
  imports: [CngxSidenav, CngxNavLink],
  styleUrls: ['../../core/theming/system-tokens.css', '../../core/theming/density-tokens.css'],
  // Unlayered, so it beats the layered row transition: state reads must not
  // land mid-transition. The transition test mounts without the class.
  styles: ['.still :is(.cngx-nav-link, [cngxNavGroup]) { transition: none; }'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-sidenav class="rail-a" mode="side" [opened]="true" ariaLabel="Primary">
      <nav>
        <a cngxNavLink href="#inbox" class="row-active" [active]="true">Inbox</a>
        <a cngxNavLink href="#drafts" class="row-idle">Drafts</a>
        <button type="button" cngxNavGroup class="row-group">Settings</button>
      </nav>
      <span class="probe-hover" style="background-color: var(--cngx-nav-link-hover-bg)"></span>
      <span class="probe-pressed" style="background-color: var(--cngx-nav-link-pressed-bg)"></span>
      <span class="probe-active" style="background-color: var(--cngx-nav-link-active-bg)"></span>
      <span
        class="probe-active-hover"
        style="background-color: var(--cngx-nav-link-active-hover-bg)"
      ></span>
    </cngx-sidenav>
    <cngx-sidenav
      class="rail-b"
      mode="side"
      [opened]="true"
      ariaLabel="Secondary"
      style="--cngx-color-primary: oklch(0.5 0.2 145)"
    >
      <a cngxNavLink href="#home" class="row-scoped" [active]="true">Home</a>
    </cngx-sidenav>
    <div dir="rtl">
      <cngx-sidenav class="rail-rtl" mode="side" [opened]="true" ariaLabel="Right to left">
        <a cngxNavLink href="#rtl" class="row-rtl" [active]="true">Inbox</a>
      </cngx-sidenav>
    </div>
    <cngx-sidenav
      class="rail-mini"
      mode="side"
      [collapsed]="true"
      [expandOnHover]="false"
      ariaLabel="Mini"
    >
      <a cngxNavLink href="#mini" class="row-mini" [active]="true">Inbox</a>
    </cngx-sidenav>
    <div data-density="compact">
      <cngx-sidenav class="rail-compact" mode="side" [opened]="true" ariaLabel="Compact">
        <a cngxNavLink href="#compact" class="row-compact" [active]="true">Inbox</a>
      </cngx-sidenav>
      <cngx-sidenav
        class="rail-mini-compact"
        mode="side"
        [collapsed]="true"
        [expandOnHover]="false"
        ariaLabel="Mini compact"
      >
        <a cngxNavLink href="#mini-compact" class="row-mini-compact" [active]="true">Inbox</a>
      </cngx-sidenav>
    </div>
    <span class="probe-highlighttext" style="color: HighlightText"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
  `,
})
class NavStateHost {}

let mountedRoot: HTMLElement | null = null;

function mount({ still = true } = {}): HTMLElement {
  const fixture = TestBed.createComponent(NavStateHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  mountedRoot.classList.toggle('still', still);
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

const bg = (root: ParentNode, selector: string): string =>
  computedValue(one(root, selector), 'background-color');

// Computed colours come back as oklch or oklab depending on how they were
// produced; compare their rasterised paint over white instead of the strings.
const fillOf = (root: ParentNode, selector: string): string => paint('white', bg(root, selector));

// Paint the colours bottom-up into a 1px canvas and read the pixel back: this
// resolves oklch / color-mix to sRGB and composites the translucent row fill
// over the rail surface the way it renders.
function paint(...layers: string[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no 2d context');
  }
  for (const layer of layers) {
    ctx.fillStyle = layer;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return `rgb(${r}, ${g}, ${b})`;
}

function distance(a: string, b: string): number {
  const [l1, a1, b1] = oklabOf(a);
  const [l2, a2, b2] = oklabOf(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

function fillOver(root: ParentNode, fill: Fill): string {
  const surface = computedValue(one(root, '.rail-a'), 'background-color');
  return paint(surface, bg(root, `.probe-${fill}`));
}

interface DomNode {
  readonly nodeId: number;
  readonly children?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

function documentsOf(node: DomNode): DomNode[] {
  const nested = [
    ...(node.children ?? []),
    ...(node.contentDocument ? [node.contentDocument] : []),
  ];
  return [...(node.contentDocument ? [node.contentDocument] : []), ...nested.flatMap(documentsOf)];
}

// Force real pseudo-classes over CDP; `:active` cannot be held by userEvent.
// The node lookup mirrors accessibleName(): the spec runs in the runner iframe.
async function forceStates(selector: string, states: readonly string[]): Promise<void> {
  const session = cdp();
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = (await session.send('DOM.getDocument', { depth: -1, pierce: true })) as {
    root: DomNode;
  };
  for (const doc of [root, ...documentsOf(root)]) {
    const { nodeId } = (await session.send('DOM.querySelector', {
      nodeId: doc.nodeId,
      selector,
    })) as { nodeId: number };
    if (nodeId) {
      await session.send('CSS.forcePseudoState', {
        nodeId,
        forcedPseudoClasses: [...states],
      });
      return;
    }
  }
  throw new Error(`${selector} is in no document`);
}

const bar = (el: HTMLElement, property: string): string =>
  getComputedStyle(el, '::before').getPropertyValue(property);

const forced: string[] = [];

async function force(selector: string, states: readonly string[]): Promise<void> {
  forced.push(selector);
  await forceStates(selector, states);
}

afterEach(async () => {
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  for (const selector of forced.splice(0)) {
    await forceStates(selector, []);
  }
  await parkPointer();
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('data-color-scheme');
});

for (const scheme of SCHEMES) {
  describe(`nav row fills, ${scheme}`, () => {
    const mountIn = (): HTMLElement => {
      document.documentElement.setAttribute('data-color-scheme', scheme);
      return mount();
    };

    it('keeps the row text at 4.5:1 or more on every fill', () => {
      const root = mountIn();
      const surface = computedValue(one(root, '.rail-a'), 'background-color');
      const idleInk = computedValue(one(root, '.row-idle'), 'color');
      const activeInk = computedValue(one(root, '.row-active'), 'color');
      expect(contrastRatio(idleInk, paint(surface))).toBeGreaterThanOrEqual(4.5);
      for (const fill of ['hover', 'pressed'] as const) {
        expect(contrastRatio(idleInk, fillOver(root, fill))).toBeGreaterThanOrEqual(4.5);
      }
      for (const fill of ['active', 'active-hover'] as const) {
        expect(contrastRatio(activeInk, fillOver(root, fill))).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('keeps the active indicator at 3:1 or more on the active fills', () => {
      const root = mountIn();
      const indicator = bar(one(root, '.row-active'), 'background-color');
      for (const fill of ['active', 'active-hover'] as const) {
        expect(contrastRatio(paint(indicator), fillOver(root, fill))).toBeGreaterThanOrEqual(3);
      }
    });

    it('keeps the outer focus ring at 3:1 or more on every fill and on the inner ring', () => {
      const root = mountIn();
      const row = one(root, '.row-idle');
      row.focus();
      const outer = paint(computedValue(row, 'outline-color'));
      const surface = computedValue(one(root, '.rail-a'), 'background-color');
      const inner = computedValue(one(root, '.rail-a'), '--cngx-nav-link-focus-inner-color');
      expect(contrastRatio(outer, paint(surface))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(outer, paint(surface, inner))).toBeGreaterThanOrEqual(3);
      for (const fill of FILLS) {
        expect(contrastRatio(outer, fillOver(root, fill))).toBeGreaterThanOrEqual(3);
      }
    });

    it('moves each fill further from the surface than the one before', () => {
      const root = mountIn();
      const surface = paint(computedValue(one(root, '.rail-a'), 'background-color'));
      const steps = FILLS.map((fill) => distance(surface, fillOver(root, fill)));
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i]).toBeGreaterThan(steps[i - 1]);
      }
    });
  });
}

describe('nav row shape', () => {
  it('transitions only background-color and color', () => {
    const root = mount({ still: false });
    for (const selector of ['.row-idle', '.row-group']) {
      expect(computedValue(one(root, selector), 'transition-property')).toBe(
        'background-color, color',
      );
    }
  });

  it('paints a group head transparent at rest and with the hover fill under the pointer', async () => {
    const root = mount();
    expect(bg(root, '.row-group')).toBe('rgba(0, 0, 0, 0)');
    await userEvent.hover(one(root, '.row-group'));
    expect(fillOf(root, '.row-group')).toBe(fillOf(root, '.probe-hover'));
  });
});

describe('nav row state precedence', () => {
  it('paints the active fill on the active row at rest', () => {
    const root = mount();
    expect(fillOf(root, '.row-active')).toBe(fillOf(root, '.probe-active'));
  });

  it('paints the hover fill on an inactive row under the pointer', async () => {
    const root = mount();
    await userEvent.hover(one(root, '.row-idle'));
    expect(fillOf(root, '.row-idle')).toBe(fillOf(root, '.probe-hover'));
  });

  it('paints active+hover, not hover, on the active row under the pointer', async () => {
    const root = mount();
    await userEvent.hover(one(root, '.row-active'));
    expect(fillOf(root, '.row-active')).toBe(fillOf(root, '.probe-active-hover'));
  });

  it('paints the pressed fill on a pressed inactive row', async () => {
    const root = mount();
    await force('.row-idle', ['active', 'hover']);
    expect(fillOf(root, '.row-idle')).toBe(fillOf(root, '.probe-pressed'));
  });

  it('keeps active+hover on a pressed active row', async () => {
    const root = mount();
    await force('.row-active', ['active', 'hover']);
    expect(fillOf(root, '.row-active')).toBe(fillOf(root, '.probe-active-hover'));
  });
});

describe('nav row fills are SET on the host', () => {
  it('lets an accent scoped to one rail recolour only that rail', () => {
    const root = mount();
    expect(fillOf(root, '.row-scoped')).not.toBe(fillOf(root, '.row-active'));
    expect(fillOf(root, '.row-active')).toBe(fillOf(root, '.probe-active'));
  });
});

describe('active indicator', () => {
  it('draws a bar on the inline-start edge of the active row only', () => {
    const root = mount();
    const active = one(root, '.row-active');
    expect(bar(active, 'content')).toBe('""');
    expect(bar(active, 'position')).toBe('absolute');
    expect(bar(active, 'left')).toBe('0px');
    expect(parseFloat(bar(active, 'right'))).toBeGreaterThan(0);
    expect(bar(one(root, '.row-idle'), 'content')).toBe('none');
  });

  it('moves the bar to the right edge under dir="rtl"', () => {
    const root = mount();
    const row = one(root, '.row-rtl');
    // A positioned box resolves `left` to pixels, so the far edge shows as a
    // large offset rather than `auto`.
    expect(bar(row, 'right')).toBe('0px');
    expect(parseFloat(bar(row, 'left'))).toBeGreaterThan(0);
  });

  it('leaves the collapsed rail its initial instead of the bar', () => {
    const root = mount();
    expect(one(root, '.rail-mini').getAttribute('data-sidebar-state')).toBe('rail');
    const row = one(root, '.row-mini');
    expect(bar(row, 'content')).not.toBe('""');
    expect(bar(row, 'position')).not.toBe('absolute');
  });

  it('thins the bar under compact density', () => {
    const root = mount();
    const regular = parseFloat(bar(one(root, '.row-active'), 'width'));
    const compact = parseFloat(bar(one(root, '.row-compact'), 'width'));
    expect(compact).toBeLessThan(regular);
  });

  it('paints the bar in HighlightText under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const root = mount();
    const row = one(root, '.row-active');
    expect(bar(row, 'forced-color-adjust')).toBe('none');
    expect(bar(row, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(bar(row, 'background-color')).toBe(
      computedValue(one(root, '.probe-highlighttext'), 'color'),
    );
  });
});

describe('rail row height', () => {
  const height = (root: ParentNode, selector: string): number =>
    one(root, selector).getBoundingClientRect().height;

  it('keeps a rail row as tall as an expanded row at comfortable density', () => {
    const root = mount();
    expect(one(root, '.rail-mini').getAttribute('data-sidebar-state')).toBe('rail');
    expect(Math.abs(height(root, '.row-mini') - height(root, '.row-active'))).toBeLessThanOrEqual(
      0.5,
    );
  });

  it('keeps a rail row as tall as an expanded row at compact density', () => {
    const root = mount();
    expect(one(root, '.rail-mini-compact').getAttribute('data-sidebar-state')).toBe('rail');
    expect(
      Math.abs(height(root, '.row-mini-compact') - height(root, '.row-compact')),
    ).toBeLessThanOrEqual(0.5);
  });
});

describe('double focus ring', () => {
  it('draws an outline and an inset inner ring on a focused row', () => {
    const root = mount();
    const row = one(root, '.row-idle');
    row.focus();
    expect(row.matches(':focus-visible')).toBe(true);
    expect(computedValue(row, 'outline-style')).toBe('solid');
    expect(computedValue(row, 'box-shadow')).toContain('inset');
  });

  it('gives a focused group head the same rings as a link', () => {
    const root = mount();
    const link = one(root, '.row-idle');
    link.focus();
    const linkRing = ['outline', 'outline-offset', 'box-shadow'].map((p) => computedValue(link, p));
    const head = one(root, '.row-group');
    head.focus();
    expect(head.matches(':focus-visible')).toBe(true);
    expect(['outline', 'outline-offset', 'box-shadow'].map((p) => computedValue(head, p))).toEqual(
      linkRing,
    );
  });

  it('draws one HighlightText ring on the focused active row under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const root = mount();
    const active = one(root, '.row-active');
    active.focus();
    const ring = computedValue(active, 'outline-color');
    expect(ring).toBe(computedValue(one(root, '.probe-highlighttext'), 'color'));
    expect(computedValue(active, 'box-shadow')).toBe('none');
    expect(
      contrastRatio(paint(ring), paint(computedValue(one(root, '.probe-highlight'), 'color'))),
    ).toBeGreaterThanOrEqual(3);
  });

  it('keeps the ring and the bar off the row edge under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const root = mount();
    const active = one(root, '.row-active');
    active.focus();
    const width = parseFloat(computedValue(active, 'outline-width'));
    const ringInner = -parseFloat(computedValue(active, 'outline-offset'));
    // A Highlight band between the row edge and the ring, so the ring never meets Canvas.
    expect(ringInner - width).toBeGreaterThan(0);
    // The bar starts inside the ring, with Highlight between them.
    expect(parseFloat(bar(active, 'left'))).toBeGreaterThan(ringInner);
  });

  it('drops the inner ring on a focused inactive row under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const root = mount();
    const row = one(root, '.row-idle');
    row.focus();
    expect(computedValue(row, 'box-shadow')).toBe('none');
  });
});
