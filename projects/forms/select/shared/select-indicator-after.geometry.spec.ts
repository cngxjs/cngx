/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_SELECT_DEFAULTS } from './config';

// Runs in a real Chromium (the `test-geometry` target). The selection
// indicator defaults to 'after' and an 'after' indicator sits at the row end,
// not right behind the label, so a check mark lines up across rows of
// different label length.

@Component({
  selector: 'cngx-select-indicator-after-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './select-base.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="listbox" style="width: 16rem">
      <div class="cngx-select__option cngx-select__option--indicator-after row-short">
        Red <span class="cngx-select__check">✓</span>
      </div>
      <div class="cngx-select__option cngx-select__option--indicator-after row-long">
        A much longer label <span class="cngx-select__check">✓</span>
      </div>
      <div class="cngx-select__option row-before">
        <span class="cngx-select__check">✓</span> Red
      </div>
    </div>
  `,
})
class IndicatorHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(IndicatorHost);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  fixture.detectChanges();
  return root;
}

function rect(root: ParentNode, selector: string): DOMRect {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el.getBoundingClientRect();
}

describe('select selection indicator position', () => {
  it("defaults to 'after'", () => {
    expect(CNGX_SELECT_DEFAULTS.selectionIndicatorPosition).toBe('after');
  });

  it('pins an after indicator to the row end, aligned across labels', () => {
    const root = mount();
    const short = rect(root, '.row-short .cngx-select__check');
    const long = rect(root, '.row-long .cngx-select__check');
    const row = root.querySelector<HTMLElement>('.row-short');
    if (!row) {
      throw new Error('row did not render');
    }
    const padEnd = parseFloat(getComputedStyle(row).paddingInlineEnd);
    expect(Math.round(short.right)).toBe(Math.round(row.getBoundingClientRect().right - padEnd));
    expect(Math.round(short.right)).toBe(Math.round(long.right));
    root.remove();
  });

  it('leaves a before indicator ahead of the label', () => {
    const root = mount();
    const row = root.querySelector<HTMLElement>('.row-before');
    if (!row) {
      throw new Error('row did not render');
    }
    const padStart = parseFloat(getComputedStyle(row).paddingInlineStart);
    expect(Math.round(rect(root, '.row-before .cngx-select__check').left)).toBe(
      Math.round(row.getBoundingClientRect().left + padStart),
    );
    root.remove();
  });
});
