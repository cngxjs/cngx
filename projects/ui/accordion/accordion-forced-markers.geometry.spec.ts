/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxAccordionGroup } from './accordion-group.component';
import { CngxAccordionItemLeading } from './accordion-item-leading.directive';
import { CngxAccordionItemTitle } from './accordion-item-title.directive';
import { CngxAccordionItem } from './accordion-item.component';

// Runs in a real Chromium (the `test-geometry` target) with the real accordion
// components, since the skin selectors hang on the group's [data-skin] host
// attribute and the item's [data-expanded]. Under forced colors the
// severity-spine column, the plus-minus bars and the timeline rail and nodes
// were background-only paint and vanished. The spine column now keeps a
// CanvasText end rule and fills CanvasText when open (stamp in Canvas), the +/-
// bars paint CanvasText, the timeline rail is CanvasText and its nodes are
// ringed, the open node filled with Highlight.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-accordion-forced-markers-host',
  standalone: true,
  imports: [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemLeading, CngxAccordionItemTitle],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-accordion-group
      class="spine"
      [skin]="'severity-spine'"
      [multi]="true"
      style="--cngx-accordion-chevron-transition: 0s"
    >
      <cngx-accordion-item class="spine-open" [severity]="'error'">
        <span cngxAccordionItemLeading>P1</span>
        <span cngxAccordionItemTitle>Checkout</span>
        Body
      </cngx-accordion-item>
      <cngx-accordion-item class="spine-closed" [severity]="'warning'">
        <span cngxAccordionItemLeading>P2</span>
        <span cngxAccordionItemTitle>Search</span>
        Body
      </cngx-accordion-item>
    </cngx-accordion-group>
    <cngx-accordion-group class="pm" [skin]="'plus-minus'">
      <cngx-accordion-item class="pm-item">
        <span cngxAccordionItemTitle>Shipping</span>
        Body
      </cngx-accordion-item>
    </cngx-accordion-group>
    <cngx-accordion-group
      class="tl"
      [skin]="'timeline'"
      [multi]="true"
      style="--cngx-accordion-chevron-transition: 0s"
    >
      <cngx-accordion-item class="tl-open">
        <span cngxAccordionItemTitle>Ordered</span>
        Body
      </cngx-accordion-item>
      <cngx-accordion-item class="tl-closed">
        <span cngxAccordionItemTitle>Shipped</span>
        Body
      </cngx-accordion-item>
    </cngx-accordion-group>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
  `,
})
class AccordionMarkersHost {}

let mountedRoot: HTMLElement | null = null;

async function mount(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(AccordionMarkersHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  for (const item of ['.spine-open', '.tl-open']) {
    one(mountedRoot, `${item} .cngx-accordion-item__header`).click();
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

const pseudo = (el: Element, which: '::before' | '::after', property: string): string =>
  getComputedStyle(el, which).getPropertyValue(property).trim();

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('accordion skins under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string => computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('opens the fixture rows', async () => {
    const root = await mountForced();
    expect(one(root, '.spine-open').hasAttribute('data-expanded')).toBe(true);
    expect(one(root, '.spine-closed').hasAttribute('data-expanded')).toBe(false);
    expect(one(root, '.tl-open').hasAttribute('data-expanded')).toBe(true);
  });

  it('frames the closed severity-spine column with a CanvasText end rule on Canvas', async () => {
    const root = await mountForced();
    const closed = one(root, '.spine-closed');
    expect(pseudo(closed, '::before', 'background-color')).toBe(probe(root, 'canvas'));
    expect(pseudo(closed, '::before', 'border-right-style')).toBe('solid');
    expect(pseudo(closed, '::before', 'border-right-width')).toBe('1px');
    expect(pseudo(closed, '::before', 'border-right-color')).toBe(probe(root, 'canvastext'));
    expect(pseudo(closed, '::before', 'box-sizing')).toBe('border-box');
  });

  it('fills the open severity-spine column with CanvasText and stamps it in Canvas', async () => {
    const root = await mountForced();
    const open = one(root, '.spine-open');
    expect(pseudo(open, '::before', 'background-color')).toBe(probe(root, 'canvastext'));
    const stamp = one(open, '.cngx-accordion-item__leading');
    expect(computedValue(stamp, 'forced-color-adjust')).toBe('none');
    expect(computedValue(stamp, 'color')).toBe(probe(root, 'canvas'));
  });

  it('paints the plus-minus bars CanvasText', async () => {
    const root = await mountForced();
    const chevron = one(root, '.pm-item .cngx-accordion-item__chevron');
    expect(pseudo(chevron, '::before', 'background-color')).toBe(probe(root, 'canvastext'));
    expect(pseudo(chevron, '::after', 'background-color')).toBe(probe(root, 'canvastext'));
  });

  it('draws the timeline rail in CanvasText, rings the nodes and fills the open one with Highlight', async () => {
    const root = await mountForced();
    const closed = one(root, '.tl-closed');
    const open = one(root, '.tl-open');
    expect(pseudo(closed, '::before', 'background-color')).toBe(probe(root, 'canvastext'));
    expect(pseudo(closed, '::after', 'forced-color-adjust')).toBe('none');
    expect(pseudo(closed, '::after', 'background-color')).toBe(probe(root, 'canvas'));
    expect(pseudo(closed, '::after', 'box-shadow')).toContain(`${probe(root, 'canvastext')} 0px 0px 0px 2px inset`);
    expect(pseudo(open, '::after', 'background-color')).toBe(probe(root, 'highlight'));
    expect(pseudo(open, '::after', 'box-shadow')).toContain(`${probe(root, 'highlight')} 0px 0px 0px 2px inset`);
  });
});

describe('accordion skins without forced colors', () => {
  it('keeps the author paint: empty closed spine column, coloured open column, white stamp', async () => {
    const root = await mount();
    expect(pseudo(one(root, '.spine-closed'), '::before', 'border-right-style')).toBe('none');
    expect(pseudo(one(root, '.spine-closed'), '::before', 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(pseudo(one(root, '.spine-open'), '::before', 'background-color')).not.toBe(
      computedValue(one(root, '.probe-canvastext'), 'color'),
    );
    expect(computedValue(one(root, '.spine-open .cngx-accordion-item__leading'), 'color')).toBe('rgb(255, 255, 255)');
  });
});
