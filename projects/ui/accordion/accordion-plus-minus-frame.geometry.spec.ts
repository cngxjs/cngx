import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAccordionGroup } from './accordion-group.component';
import { CngxAccordionItemTitle } from './accordion-item-title.directive';
import { CngxAccordionItem } from './accordion-item.component';

// Runs in a real Chromium (the `test-geometry` target). The plus-minus skin
// frames all rows in one rounded, overflow-clipped surface and keeps the base
// inset header ring. A square header ring on the first and last row gets its
// corners cut by the frame curve, so the edge headers take the frame's inner
// radius.

@Component({
  selector: 'cngx-accordion-plus-minus-frame-host',
  standalone: true,
  imports: [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-accordion-group
      [skin]="'plus-minus'"
      [multi]="true"
      style="--cngx-accordion-frame-radius: 20px; --cngx-accordion-frame-border-width: 2px"
    >
      <cngx-accordion-item class="first">
        <span cngxAccordionItemTitle>First</span>
        Body
      </cngx-accordion-item>
      <cngx-accordion-item class="middle">
        <span cngxAccordionItemTitle>Middle</span>
        Body
      </cngx-accordion-item>
      <cngx-accordion-item class="last">
        <span cngxAccordionItemTitle>Last</span>
        Body
      </cngx-accordion-item>
    </cngx-accordion-group>
  `,
})
class PlusMinusFrameHost {}

let mountedRoot: HTMLElement | null = null;
let settle: () => Promise<void> = async () => undefined;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PlusMinusFrameHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return mountedRoot;
}

function header(root: ParentNode, item: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(`.${item} .cngx-accordion-item__header`);
  if (!el) {
    throw new Error(`${item} header did not render`);
  }
  return el;
}

const radius = (el: Element, corner: string): string =>
  getComputedStyle(el).getPropertyValue(`border-${corner}-radius`).trim();

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('plus-minus frame', () => {
  it('rounds the first header top and the collapsed last header bottom to the inner frame radius', () => {
    const root = mount();
    const first = header(root, 'first');
    const middle = header(root, 'middle');
    const last = header(root, 'last');

    expect(radius(first, 'top-left')).toBe('18px');
    expect(radius(first, 'top-right')).toBe('18px');
    expect(radius(first, 'bottom-left')).toBe('0px');
    expect(radius(middle, 'top-left')).toBe('0px');
    expect(radius(middle, 'bottom-right')).toBe('0px');
    expect(radius(last, 'bottom-left')).toBe('18px');
    expect(radius(last, 'bottom-right')).toBe('18px');
    expect(radius(last, 'top-left')).toBe('0px');
  });

  it('squares the last header bottom once its region opens below it', async () => {
    const root = mount();
    const last = header(root, 'last');
    last.click();
    await settle();

    expect(radius(last, 'bottom-left')).toBe('0px');
  });
});
