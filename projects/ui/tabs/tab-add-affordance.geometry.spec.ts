import { Component, input, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxTab, CngxTabAddIcon, CngxTabContent } from '@cngx/common/tabs';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTabGroup } from './tab-group.component';

// Runs in a real Chromium (the `test-geometry` target). The add-tab button
// (`.cngx-tabs__add`, tabs-base.css) is a round icon affordance by default,
// but `*cngxTabAddIcon` may project a text label such as "+ New": the button
// must grow to fit it instead of letting the label spill over a fixed
// 1.25rem circle.

@Component({
  selector: 'cngx-tab-add-affordance-host',
  standalone: true,
  imports: [CngxTabGroup, CngxTab, CngxTabContent, CngxTabAddIcon],
  template: `
    <cngx-tab-group aria-label="Drafts" [addable]="true">
      @if (label()) {
        <ng-template cngxTabAddIcon>
          <span aria-hidden="true" style="white-space: nowrap">{{ label() }}</span>
        </ng-template>
      }
      <div cngxTab [label]="'A'">
        <ng-template cngxTabContent>A content</ng-template>
      </div>
    </cngx-tab-group>
  `,
})
class AddAffordanceHost {
  readonly label = input<string>('');
}

let mountedRoot: HTMLElement | null = null;

function mountAddButton(label: string): HTMLButtonElement {
  const fixture = TestBed.createComponent(AddAffordanceHost);
  fixture.componentRef.setInput('label', label);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const button = mountedRoot.querySelector('.cngx-tabs__add');
  if (!button) {
    throw new Error('.cngx-tabs__add did not render');
  }
  return button as HTMLButtonElement;
}

describe('CngxTabGroup add-tab affordance geometry', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('keeps the built-in glyph button square and round', () => {
    const button = mountAddButton('');
    const rect = button.getBoundingClientRect();
    expect(Math.round(rect.width)).toBe(Math.round(rect.height));
    expect(Math.round(rect.height)).toBe(20);
    expect(getComputedStyle(button).borderTopLeftRadius).not.toBe('0px');
  });

  it('grows to fit a projected text label instead of overflowing', () => {
    const button = mountAddButton('+ New tab');
    const rect = button.getBoundingClientRect();
    const label = button.querySelector('span');
    if (!label) {
      throw new Error('projected label did not render');
    }
    const labelRect = label.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(rect.height);
    expect(labelRect.left).toBeGreaterThanOrEqual(rect.left);
    expect(labelRect.right).toBeLessThanOrEqual(rect.right);
  });
});

// Loads the global micro sheet next to the component sheets, as `cngx.css` does.
@Component({
  selector: 'cngx-tab-affordance-glyph-host',
  standalone: true,
  imports: [CngxTabGroup, CngxTab, CngxTabContent],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../common/theming/components/cngx-icon-glyph.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-tab-group aria-label="Drafts" [addable]="true" [closable]="true">
      <div cngxTab [label]="'A'">
        <ng-template cngxTabContent>A content</ng-template>
      </div>
    </cngx-tab-group>
  `,
})
class AffordanceGlyphHost {}

// Both glyph boxes round to 12px at the default tab font, where one micro
// unit is one pixel: the cross spans 8 units (2 to 10), the plus 9 (1 to 10).
// The plus sits 0.5px off the 6-unit centre, a 1-unit stroke cannot centre on
// 12, so the ink centre is checked to half a pixel and the box exactly.
describe('CngxTabGroup affordance glyphs', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  for (const [name, selector, reach] of [
    ['close', '.cngx-tabs__close', 8],
    ['add', '.cngx-tabs__add', 9],
  ] as const) {
    it(`draws the ${name} glyph as the micro drawing on a 12px box on the button centre`, () => {
      const fixture = TestBed.createComponent(AffordanceGlyphHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      const button = mountedRoot.querySelector<HTMLElement>(selector)!;
      const box = button.getBoundingClientRect();
      const svg = button.querySelector('svg')!;
      const svgBox = svg.getBoundingClientRect();
      const micro = svg.querySelector('.cngx-icon-svg__micro')!;
      const ink = micro.getBoundingClientRect();
      expect(svgBox.width).toBe(12);
      expect(svgBox.height).toBe(12);
      expect(getComputedStyle(svg.querySelector('.cngx-icon-svg__path')!).display).toBe('none');
      expect(getComputedStyle(micro).display).not.toBe('none');
      expect(ink.width).toBeCloseTo(reach, 1);
      expect(svgBox.left + svgBox.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
      expect(svgBox.top + svgBox.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
      expect(Math.abs(ink.left + ink.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(
        0.5,
      );
    });

    // A 14px font would round the 0.75em box to 11px, off the 12-unit grid;
    // the micro floor holds it on 12 until it is lifted.
    it(`floors the ${name} glyph box at 12px under a smaller font until the micro floor is lifted`, () => {
      const fixture = TestBed.createComponent(AffordanceGlyphHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      const button = mountedRoot.querySelector<HTMLElement>(selector)!;
      button.style.fontSize = '14px';
      const svg = button.querySelector('svg')!;
      expect(svg.getBoundingClientRect().width).toBe(12);
      mountedRoot.style.setProperty('--cngx-icon-svg-micro-floor', '0px');
      expect(svg.getBoundingClientRect().width).toBe(11);
    });
  }
});

// WCAG 2.5.8 on a mouse: `--cngx-target-min` is 0px on a fine pointer, so
// the close and add buttons reach 24px through their own hit-area token. The
// points sit 11px from the centre, 1px past the 20px box on each side.
describe('CngxTabGroup affordance hit area on a fine pointer', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  for (const [name, selector] of [
    ['close', '.cngx-tabs__close'],
    ['add', '.cngx-tabs__add'],
  ] as const) {
    it(`gives the ${name} button a 24px hit area around its 20px box`, () => {
      const fixture = TestBed.createComponent(AffordanceGlyphHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      // Keeps the trailing add button off the viewport edge.
      mountedRoot.style.cssText = 'display: block; padding: 40px';
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      const button = mountedRoot.querySelector<HTMLElement>(selector)!;
      const box = button.getBoundingClientRect();
      expect(Math.round(box.width)).toBe(20);
      expect(Math.round(box.height)).toBe(20);
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      for (const [x, y] of [
        [cx - 11, cy],
        [cx + 11, cy],
        [cx, cy - 11],
        [cx, cy + 11],
      ]) {
        expect(document.elementFromPoint(x, y)?.closest(selector)).toBe(button);
      }
      expect(document.elementFromPoint(cx + 13, cy)?.closest(selector) ?? null).toBeNull();
    });
  }
});
