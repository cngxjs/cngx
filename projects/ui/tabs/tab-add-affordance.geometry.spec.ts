import { Component, input } from '@angular/core';
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

@Component({
  selector: 'cngx-tab-affordance-glyph-host',
  standalone: true,
  imports: [CngxTabGroup, CngxTab, CngxTabContent],
  template: `
    <cngx-tab-group aria-label="Drafts" [addable]="true" [closable]="true">
      <div cngxTab [label]="'A'">
        <ng-template cngxTabContent>A content</ng-template>
      </div>
    </cngx-tab-group>
  `,
})
class AffordanceGlyphHost {}

// The cross and the plus replaced the text glyphs; drawn with their stroke
// they keep the text glyphs' width and sit on the button centre (the inline
// text glyphs sat about 1px low).
describe('CngxTabGroup affordance glyphs', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  for (const [name, selector, width] of [
    ['close', '.cngx-tabs__close', 0.48],
    ['add', '.cngx-tabs__add', 0.5],
  ] as const) {
    it(`draws the ${name} glyph ${width}em wide on the button centre`, () => {
      const fixture = TestBed.createComponent(AffordanceGlyphHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      const button = mountedRoot.querySelector<HTMLElement>(selector)!;
      const box = button.getBoundingClientRect();
      const svg = button.querySelector('svg')!;
      const path = svg.querySelector('path')!.getBoundingClientRect();
      const stroke =
        (parseFloat(getComputedStyle(svg).strokeWidth) * svg.getBoundingClientRect().width) / 24;
      const em = parseFloat(getComputedStyle(button).fontSize);
      expect(path.width + stroke).toBeCloseTo(width * em, 0);
      expect(path.left + path.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
      expect(path.top + path.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
    });
  }
});
