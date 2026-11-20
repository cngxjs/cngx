import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxDivider } from './divider.directive';

// Runs in a real Chromium (the `test-geometry` target). The vertical inset
// variant sits in a centred flex row next to 30px buttons, the popover footer
// shape. A block margin would count toward the divider's outer size and grow
// the row; the inset has to shorten the line inside the row height instead.

@Component({
  selector: 'cngx-divider-geometry-host',
  standalone: true,
  imports: [CngxDivider],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../theming/components/cngx-divider.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="row" style="display: flex; align-items: center">
      <button type="button" style="block-size: 30px; margin: 0">Cancel</button>
      <cngx-divider orientation="vertical" [inset]="true" />
      <button type="button" style="block-size: 30px; margin: 0">Apply</button>
    </div>
  `,
})
class DividerRowHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): { row: HTMLElement; button: HTMLElement; divider: HTMLElement } {
  const fixture = TestBed.createComponent(DividerRowHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const row = mountedRoot.querySelector<HTMLElement>('.row');
  const button = mountedRoot.querySelector<HTMLElement>('button');
  const divider = mountedRoot.querySelector<HTMLElement>('.cngx-divider');
  if (!row || !button || !divider) {
    throw new Error('divider row did not render');
  }
  return { row, button, divider };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxDivider geometry (vertical inset in a flex row)', () => {
  it('keeps the row as tall as its buttons', () => {
    const { row, button } = mount();
    expect(button.getBoundingClientRect().height).toBe(30);
    expect(row.getBoundingClientRect().height).toBe(30);
  });

  it('stretches to the row and shortens the line by clipping', () => {
    const { row, divider } = mount();
    expect(divider.getBoundingClientRect().height).toBe(row.getBoundingClientRect().height);
    expect(computedValue(divider, 'margin-block-start')).toBe('0px');
    expect(computedValue(divider, 'margin-block-end')).toBe('0px');
    expect(computedValue(divider, 'clip-path')).toMatch(/^inset\(/);
  });
});
