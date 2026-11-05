/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxSelectReorderList } from './reorder-list.component';
import type { CngxSelectOptionDef } from '../../option.model';

// Runs in a real Chromium (the `test-geometry` target) against the shipped
// stylesheet. Mounts the reorder list directly - the keyboard move buttons it
// renders only appear under the touch floor in a running app, so a direct mount
// is the stable home for the further-C finding: a disabled move button
// (`<button>`) must fade to GrayText under forced colors, not the ButtonText
// the UA would force it to, so it does not read as enabled.

const ITEMS: CngxSelectOptionDef<string>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

@Component({
  selector: 'cngx-reorder-forced-host',
  standalone: true,
  imports: [CngxSelectReorderList],
  encapsulation: ViewEncapsulation.None,
  template: `<cngx-select-reorder-list [items]="items" [label]="'Order'" />`,
})
class Host {
  readonly items = ITEMS;
}

let mountedRoot: HTMLElement | null = null;

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('reorder-list disabled move button in forced colors', () => {
  it('fades a disabled move button to GrayText', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const fixture = TestBed.createComponent(Host);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();

    const disabled = mountedRoot.querySelector<HTMLElement>(
      '.cngx-select-reorder-list__move[aria-disabled="true"]',
    );
    expect(disabled, 'the first row move-up button is disabled').toBeTruthy();

    const probe = document.createElement('span');
    probe.style.color = 'GrayText';
    document.body.appendChild(probe);
    const grayText = computedValue(probe, 'color');
    probe.remove();

    expect(computedValue(disabled!, 'color')).toBe(grayText);
  });
});
