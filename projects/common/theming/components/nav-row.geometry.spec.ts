/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  accessibleName,
  computedValue,
  contrastRatio,
  oklabOf,
  parkPointer,
} from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxNavBadge } from '../../interactive/nav/nav-badge.directive';
import { CngxNavFooter } from '../../interactive/nav/nav-footer.directive';
import { CngxNavGroup } from '../../interactive/nav/nav-group.directive';
import { CngxNavHeader } from '../../interactive/nav/nav-header.directive';
import { CngxNavIcon } from '../../interactive/nav/nav-icon.directive';
import { CngxNavLabel } from '../../interactive/nav/nav-label.directive';
import { CngxNavLink } from '../../interactive/nav/nav-link.directive';
import { CngxNavMark } from '../../interactive/nav/nav-mark.directive';
import { CngxNavName } from '../../interactive/nav/nav-name.directive';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// cngx-nav.css and the system tokens, with the rows in a plain <nav> and no
// container. Pins the same floors as the sidenav rows: row text >= 4.5:1 on
// every fill, the fill order, the state precedence on real pseudo-classes, the
// active bar in LTR, RTL and forced colours, and that the defaults follow the
// foundation (an ancestor SET reaches the row, density reaches the padding).

const SCHEMES = ['light', 'dark'] as const;
const FILLS = ['hover', 'pressed', 'active', 'active-hover'] as const;
type Fill = (typeof FILLS)[number];

@Component({
  selector: 'cngx-nav-row-host',
  standalone: true,
  imports: [
    CngxNavLink,
    CngxNavGroup,
    CngxNavLabel,
    CngxNavBadge,
    CngxNavIcon,
    CngxNavHeader,
    CngxNavFooter,
    CngxNavMark,
    CngxNavName,
  ],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/density-tokens.css',
    './cngx-nav.css',
  ],
  // Unlayered, so it beats the layered row transition: state reads must not
  // land mid-transition. The transition test mounts without the class.
  styles: [
    '.still :is(.cngx-nav-link, .cngx-nav-group) { transition: none; }',
    '.surface { background: var(--cngx-color-surface); color: var(--cngx-color-text); }',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav class="surface nav-a" aria-label="Primary">
      <cngx-nav-header class="header">
        <span cngxNavMark class="header-mark">A</span>
        <span cngxNavName class="header-name">Acme</span>
      </cngx-nav-header>
      <span cngxNavLabel class="label-main">Main</span>
      <a cngxNavLink href="#inbox" class="row-active" [active]="true">Inbox</a>
      <a cngxNavLink href="#drafts" class="row-idle">
        Drafts
        <span cngxNavBadge [value]="3" class="badge-count">3</span>
      </a>
      <a cngxNavLink href="#empty" class="row-empty">
        Empty
        <span cngxNavBadge [value]="0" class="badge-empty">0</span>
      </a>
      <button type="button" cngxNavGroup class="row-group">Settings</button>
      <button type="button" cngxNavGroup [cngxDisclosureOpened]="true" class="row-group-open">
        Team
      </button>
      <a cngxNavLink href="#nested" [depth]="1" class="row-nested">Nested</a>
      <a cngxNavLink href="#starred" class="row-icon">
        <span cngxNavIcon class="icon-starred">S</span>
        Starred
      </a>
      <a cngxNavLink href="#shared" class="row-icon-wrapped">
        <span class="icon-wrapper"><span cngxNavIcon class="icon-shared">H</span></span>
        Shared
      </a>
      <cngx-nav-footer class="footer">
        <span cngxNavMark class="footer-mark">JD</span>
        <span cngxNavName class="footer-name">Jane Doe with a name far too long for any nav</span>
      </cngx-nav-footer>
    </nav>
    <span class="probe-hover" style="background-color: var(--cngx-nav-link-hover-bg)"></span>
    <span class="probe-pressed" style="background-color: var(--cngx-nav-link-pressed-bg)"></span>
    <span class="probe-active" style="background-color: var(--cngx-nav-link-active-bg)"></span>
    <span
      class="probe-active-hover"
      style="background-color: var(--cngx-nav-link-active-hover-bg)"
    ></span>
    <nav aria-label="Scoped" style="--cngx-nav-link-active-bg: oklch(0.5 0.2 145 / 0.3)">
      <a cngxNavLink href="#home" class="row-scoped" [active]="true">Home</a>
    </nav>
    <nav dir="rtl" aria-label="Right to left">
      <a cngxNavLink href="#rtl" class="row-rtl" [active]="true">Inbox</a>
      <button type="button" cngxNavGroup class="row-group-rtl">Settings</button>
    </nav>
    <div data-density="compact">
      <nav aria-label="Compact">
        <a cngxNavLink href="#compact" class="row-compact" [active]="true">Inbox</a>
      </nav>
    </div>
    <span class="probe-highlighttext" style="color: HighlightText"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
  `,
})
class NavRowHost {}

let mountedRoot: HTMLElement | null = null;

function mount({ still = true } = {}): HTMLElement {
  const fixture = TestBed.createComponent(NavRowHost);
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

// Paint the colours bottom-up into a 1px canvas and read the pixel back: this
// resolves oklch / color-mix to sRGB and composites a translucent fill over
// the surface the way it renders.
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

const fillOf = (root: ParentNode, selector: string): string => paint('white', bg(root, selector));

function distance(a: string, b: string): number {
  const [l1, a1, b1] = oklabOf(a);
  const [l2, a2, b2] = oklabOf(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const surfaceOf = (root: ParentNode): string => bg(root, '.nav-a');

const fillOver = (root: ParentNode, fill: Fill): string =>
  paint(surfaceOf(root), bg(root, `.probe-${fill}`));

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

// Force real pseudo-classes over CDP; `:active` cannot be held by userEvent,
// and userEvent.hover cannot find a row: its locator computes the name in JS
// and reads the letter's `content: attr(data-initial) / ''` into it. The spec
// runs in the runner iframe, so the lookup walks nested documents.
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

const letter = (el: HTMLElement, property: string): string =>
  getComputedStyle(el, '::before').getPropertyValue(property);

// The active bar and the group chevron both live on ::after (links have no
// chevron, group heads no bar).
const bar = (el: HTMLElement, property: string): string =>
  getComputedStyle(el, '::after').getPropertyValue(property);

const chevron = bar;

const forced: string[] = [];

async function force(selector: string, states: readonly string[]): Promise<void> {
  forced.push(selector);
  await forceStates(selector, states);
}

async function forcedColors(): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'forced-colors', value: 'active' }],
  });
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
  describe(`nav row fills outside a container, ${scheme}`, () => {
    const mountIn = (): HTMLElement => {
      document.documentElement.setAttribute('data-color-scheme', scheme);
      return mount();
    };

    it('keeps the row text at 4.5:1 or more on every fill', () => {
      const root = mountIn();
      const idleInk = computedValue(one(root, '.row-idle'), 'color');
      const activeInk = computedValue(one(root, '.row-active'), 'color');
      expect(contrastRatio(idleInk, paint(surfaceOf(root)))).toBeGreaterThanOrEqual(4.5);
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
      const inner = computedValue(row, '--cngx-nav-link-focus-inner-color');
      expect(contrastRatio(outer, paint(surfaceOf(root)))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(outer, paint(surfaceOf(root), inner))).toBeGreaterThanOrEqual(3);
      for (const fill of FILLS) {
        expect(contrastRatio(outer, fillOver(root, fill))).toBeGreaterThanOrEqual(3);
      }
    });

    it('moves each fill further from the surface than the one before', () => {
      const root = mountIn();
      const surface = paint(surfaceOf(root));
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

  it('stretches a group head across the nav like a link row', () => {
    const root = mount();
    const link = one(root, '.row-idle').getBoundingClientRect();
    const head = one(root, '.row-group').getBoundingClientRect();
    expect(Math.abs(head.left - link.left)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(head.width - link.width)).toBeLessThanOrEqual(0.5);
  });

  it('paints a group head transparent at rest and with the hover fill under the pointer', async () => {
    const root = mount();
    expect(bg(root, '.row-group')).toBe('rgba(0, 0, 0, 0)');
    await force('.row-group', ['hover']);
    expect(fillOf(root, '.row-group')).toBe(fillOf(root, '.probe-hover'));
  });

  it('indents a nested row by its depth', () => {
    const root = mount();
    const flat = one(root, '.row-idle').getBoundingClientRect().left;
    const nested = one(root, '.row-nested').getBoundingClientRect().left;
    expect(nested - flat).toBeCloseTo(12, 0);
  });
});

describe('nav row state precedence', () => {
  it('paints the active fill on the active row at rest', () => {
    const root = mount();
    expect(fillOf(root, '.row-active')).toBe(fillOf(root, '.probe-active'));
  });

  it('paints the hover fill on an inactive row under the pointer', async () => {
    const root = mount();
    await force('.row-idle', ['hover']);
    expect(fillOf(root, '.row-idle')).toBe(fillOf(root, '.probe-hover'));
  });

  it('paints active+hover, not hover, on the active row under the pointer', async () => {
    const root = mount();
    await force('.row-active', ['hover']);
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

describe('nav row defaults follow the foundation', () => {
  it('lets an ancestor SET reach the row', () => {
    const root = mount();
    expect(fillOf(root, '.row-scoped')).not.toBe(fillOf(root, '.row-active'));
    expect(fillOf(root, '.row-scoped')).toBe(paint('white', 'oklch(0.5 0.2 145 / 0.3)'));
  });

  it('shrinks the row padding under compact density with no SET', () => {
    const root = mount();
    const regular = parseFloat(computedValue(one(root, '.row-active'), 'padding-top'));
    const compact = parseFloat(computedValue(one(root, '.row-compact'), 'padding-top'));
    expect(compact).toBeLessThan(regular);
  });

  it('aligns the section label text with the row text', () => {
    const root = mount();
    const label = one(root, '.label-main');
    const row = one(root, '.row-idle');
    const labelText =
      label.getBoundingClientRect().left + parseFloat(computedValue(label, 'padding-left'));
    const rowText =
      row.getBoundingClientRect().left + parseFloat(computedValue(row, 'padding-left'));
    expect(Math.abs(labelText - rowText)).toBeLessThanOrEqual(0.5);
  });
});

describe('active indicator', () => {
  it('draws a bar on the inline-start edge of the active row only', () => {
    const root = mount();
    const active = one(root, '.row-active');
    expect(bar(active, 'content')).toBe('""');
    expect(bar(active, 'position')).toBe('absolute');
    expect(bar(active, 'left')).toBe('0px');
    expect(bar(one(root, '.row-idle'), 'content')).toBe('none');
  });

  it('moves the bar to the right edge under dir="rtl"', () => {
    const root = mount();
    const row = one(root, '.row-rtl');
    expect(bar(row, 'right')).toBe('0px');
    expect(parseFloat(bar(row, 'left'))).toBeGreaterThan(0);
  });

  it('thins the bar under compact density', () => {
    const root = mount();
    const regular = parseFloat(bar(one(root, '.row-active'), 'width'));
    const compact = parseFloat(bar(one(root, '.row-compact'), 'width'));
    expect(compact).toBeLessThan(regular);
  });
});

describe('icon box and letter fallback', () => {
  const iconX = (root: ParentNode): number =>
    one(root, '.icon-starred').getBoundingClientRect().left;
  const letterX = (root: ParentNode, selector: string): number => {
    const row = one(root, selector);
    return row.getBoundingClientRect().left + parseFloat(computedValue(row, 'padding-left'));
  };

  it('puts the icon and the letter at the same x', () => {
    const root = mount();
    expect(Math.abs(iconX(root) - letterX(root, '.row-idle'))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(iconX(root) - letterX(root, '.row-group'))).toBeLessThanOrEqual(0.5);
  });

  it('sizes the icon and the letter to the same box', () => {
    const root = mount();
    const icon = one(root, '.icon-starred').getBoundingClientRect();
    const row = one(root, '.row-idle');
    expect(parseFloat(letter(row, 'width'))).toBeCloseTo(icon.width, 1);
    expect(parseFloat(letter(row, 'height'))).toBeCloseTo(icon.height, 1);
  });

  it('draws the letter as a round filled badge on rows and group heads without an icon', () => {
    const root = mount();
    for (const selector of ['.row-idle', '.row-group']) {
      const row = one(root, selector);
      expect(letter(row, 'content')).toContain(row.dataset['initial']);
      expect(letter(row, 'border-top-left-radius')).toBe('50%');
      expect(letter(row, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  it('draws no letter on a row with an icon', () => {
    const root = mount();
    expect(letter(one(root, '.row-icon'), 'content')).toBe('none');
  });

  it('draws no letter on a row whose icon sits inside a wrapper', () => {
    const root = mount();
    expect(letter(one(root, '.row-icon-wrapped'), 'content')).toBe('none');
  });

  it('keeps the letter and the icon out of the accessible name', async () => {
    const root = mount();
    expect(one(root, '.icon-starred').getAttribute('aria-hidden')).toBe('true');
    expect((await accessibleName('.row-idle'))?.trim()).toBe('Drafts');
    expect((await accessibleName('.row-icon'))?.trim()).toBe('Starred');
  });

  it('paints both the bar and the letter on an active letter row', () => {
    const root = mount();
    const row = one(root, '.row-active');
    expect(letter(row, 'content')).toContain('I');
    expect(bar(row, 'content')).toBe('""');
    expect(bar(row, 'position')).toBe('absolute');
  });
});

describe('header and footer slots', () => {
  it('puts the header and footer marks at the row icon x', () => {
    const root = mount();
    const row = one(root, '.row-idle');
    const rowIconX =
      row.getBoundingClientRect().left + parseFloat(computedValue(row, 'padding-left'));
    for (const selector of ['.header-mark', '.footer-mark']) {
      expect(
        Math.abs(one(root, selector).getBoundingClientRect().left - rowIconX),
      ).toBeLessThanOrEqual(0.5);
    }
  });

  it('sizes a mark to the icon box', () => {
    const root = mount();
    const icon = one(root, '.icon-starred').getBoundingClientRect();
    const mark = one(root, '.header-mark').getBoundingClientRect();
    expect(mark.width).toBeCloseTo(icon.width, 1);
    expect(mark.height).toBeCloseTo(icon.height, 1);
  });

  it('starts the name at the row label x', () => {
    const root = mount();
    const label = one(root, '.icon-starred').getBoundingClientRect().right;
    const gap = parseFloat(computedValue(one(root, '.row-icon'), 'column-gap'));
    expect(
      Math.abs(one(root, '.header-name').getBoundingClientRect().left - (label + gap)),
    ).toBeLessThanOrEqual(0.5);
  });

  it('truncates a long name inside the footer', () => {
    const root = mount();
    const name = one(root, '.footer-name');
    expect(computedValue(name, 'text-overflow')).toBe('ellipsis');
    expect(name.getBoundingClientRect().right).toBeLessThanOrEqual(
      one(root, '.footer').getBoundingClientRect().right,
    );
  });

  it('keeps the mark out of the accessible name of its region', () => {
    const root = mount();
    expect(one(root, '.header-mark').getAttribute('aria-hidden')).toBe('true');
    expect(one(root, '.header-name').hasAttribute('aria-hidden')).toBe(false);
  });

  it('draws the header and footer dividers in the foundation border colour', () => {
    const root = mount();
    const header = one(root, '.header');
    const footer = one(root, '.footer');
    expect(computedValue(header, 'border-bottom-style')).toBe('solid');
    expect(computedValue(footer, 'border-top-style')).toBe('solid');
    expect(computedValue(header, 'border-bottom-color')).toBe(
      computedValue(footer, 'border-top-color'),
    );
  });
});

describe('group chevron', () => {
  it('points inline-end while closed and down while open', () => {
    const root = mount();
    expect(chevron(one(root, '.row-group'), 'rotate')).toBe('-45deg');
    expect(chevron(one(root, '.row-group-open'), 'rotate')).toBe('45deg');
  });

  it('mirrors the closed chevron under dir="rtl"', () => {
    const root = mount();
    expect(chevron(one(root, '.row-group-rtl'), 'rotate')).toBe('135deg');
  });

  it('sits at the inline end of the head', () => {
    const root = mount();
    // The auto margin resolves to the free space, so a positive value means
    // the chevron was pushed to the end.
    expect(parseFloat(chevron(one(root, '.row-group'), 'margin-left'))).toBeGreaterThan(0);
  });
});

describe('nav badge', () => {
  it('draws a count as a filled pill', () => {
    const root = mount();
    const badge = one(root, '.badge-count');
    expect(computedValue(badge, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(parseFloat(computedValue(badge, 'border-top-left-radius'))).toBeGreaterThan(
      badge.getBoundingClientRect().height / 2 - 1,
    );
  });

  for (const scheme of SCHEMES) {
    it(`keeps the count at 4.5:1 or more on its pill, ${scheme}`, () => {
      document.documentElement.setAttribute('data-color-scheme', scheme);
      const root = mount();
      const badge = one(root, '.badge-count');
      const pill = paint(surfaceOf(root), computedValue(badge, 'background-color'));
      expect(contrastRatio(computedValue(badge, 'color'), pill)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('keeps an empty badge hidden', () => {
    const root = mount();
    expect(computedValue(one(root, '.badge-empty'), 'display')).toBe('none');
  });

  it('rings a filled badge under forced colors', async () => {
    await forcedColors();
    const root = mount();
    expect(computedValue(one(root, '.badge-count'), 'border-top-style')).toBe('solid');
  });
});

describe('forced colors', () => {
  it('paints the active row in Highlight and its bar in HighlightText', async () => {
    await forcedColors();
    const root = mount();
    const row = one(root, '.row-active');
    expect(bg(root, '.row-active')).toBe(computedValue(one(root, '.probe-highlight'), 'color'));
    expect(bar(row, 'background-color')).toBe(
      computedValue(one(root, '.probe-highlighttext'), 'color'),
    );
  });

  it('keeps the ring and the bar off the row edge', async () => {
    await forcedColors();
    const root = mount();
    const active = one(root, '.row-active');
    active.focus();
    const width = parseFloat(computedValue(active, 'outline-width'));
    const ringInner = -parseFloat(computedValue(active, 'outline-offset'));
    expect(computedValue(active, 'outline-color')).toBe(
      computedValue(one(root, '.probe-highlighttext'), 'color'),
    );
    expect(ringInner - width).toBeGreaterThan(0);
    expect(parseFloat(bar(active, 'left'))).toBeGreaterThan(ringInner);
  });

  it('drops the inner ring on a focused inactive row', async () => {
    await forcedColors();
    const root = mount();
    const row = one(root, '.row-idle');
    row.focus();
    expect(computedValue(row, 'box-shadow')).toBe('none');
  });
});
