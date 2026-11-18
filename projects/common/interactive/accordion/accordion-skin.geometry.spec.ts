import { Component, ViewEncapsulation, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAccordionPanel } from './accordion-panel.directive';
import { CngxAccordion } from './accordion.directive';

// Runs in a real Chromium (the `test-geometry` target). The host clips its
// children with `overflow: hidden` and a rounded border; a header on that edge
// must carry the inner radius, or its inset focus outline is cut at the corners.

@Component({
  selector: 'cngx-accordion-skin-radius-host',
  standalone: true,
  imports: [CngxAccordion, CngxAccordionPanel],
  styleUrls: ['../../theming/components/cngx-accordion.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div cngxAccordion class="cngx-accordion" [(openIds)]="open">
      <button cngxAccordionPanel class="cngx-accordion__header" panelId="a" controls="r-a">
        A
      </button>
      <div id="r-a" role="region" class="cngx-accordion__region" [hidden]="!open().has('a')">A</div>
      <button cngxAccordionPanel class="cngx-accordion__header" panelId="b" controls="r-b">
        B
      </button>
      <div id="r-b" role="region" class="cngx-accordion__region" [hidden]="!open().has('b')">B</div>
      <button cngxAccordionPanel class="cngx-accordion__header" panelId="c" controls="r-c">
        C
      </button>
      <div id="r-c" role="region" class="cngx-accordion__region" [hidden]="!open().has('c')">C</div>
    </div>
  `,
})
class AccordionSkinRadiusHost {
  readonly open = signal<ReadonlySet<string>>(new Set());
}

let mountedRoot: HTMLElement | null = null;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

function mount(): {
  fixture: ReturnType<typeof TestBed.createComponent<AccordionSkinRadiusHost>>;
  heads: HTMLElement[];
} {
  const fixture = TestBed.createComponent(AccordionSkinRadiusHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const heads = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-accordion__header'));
  return { fixture, heads };
}

describe('accordion skin header radius', () => {
  it('rounds the first header top and the closed last header bottom, nothing in between', () => {
    const { heads } = mount();
    const [first, middle, last] = heads;
    expect(computedValue(first, 'border-start-start-radius')).not.toBe('0px');
    expect(computedValue(first, 'border-end-start-radius')).toBe('0px');
    expect(computedValue(middle, 'border-start-start-radius')).toBe('0px');
    expect(computedValue(middle, 'border-end-end-radius')).toBe('0px');
    expect(computedValue(last, 'border-end-end-radius')).not.toBe('0px');
  });

  it('drops the bottom radius of the last header while its region is open', () => {
    const { fixture, heads } = mount();
    fixture.componentInstance.open.set(new Set(['c']));
    fixture.detectChanges();
    expect(heads[2].getAttribute('aria-expanded')).toBe('true');
    expect(computedValue(heads[2], 'border-end-end-radius')).toBe('0px');
  });
});
