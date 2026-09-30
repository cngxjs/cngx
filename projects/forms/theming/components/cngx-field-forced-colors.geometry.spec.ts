/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxSelect } from '../../select/single-select/select.component';
import { CngxTypeahead } from '../../select/typeahead/typeahead.component';

// Runs in a real Chromium (the `test-geometry` target) with forced colors
// emulated over CDP. Disabled fades by colour, and the forced palette paints
// every author colour as CanvasText, so without a forced-colors rule a
// disabled label, control or trigger reads exactly like an enabled one. The
// fill and bare blocks also redraw the border with a shorthand, which reset
// the disabled dashed / dotted baseline to solid. Each case asserts GrayText
// text and the restored baseline, in both colour schemes.

const OPTIONS = [{ value: 'red', label: 'Red' }];

@Component({
  selector: 'cngx-field-forced-colors-host',
  standalone: true,
  imports: [CngxSelect, CngxTypeahead],
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    './cngx-field-skin.css',
    './cngx-field-affix.css',
    './cngx-field-text.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <label class="cngx-label label-on">Name</label>
    <label class="cngx-label cngx-label--disabled label-off">Name</label>

    <input class="outline-on" type="text" value="Value" />
    <input class="outline-off" type="text" value="Value" disabled />
    <input class="fill-on" type="text" data-skin="fill" value="Value" />
    <input class="fill-off" type="text" data-skin="fill" value="Value" disabled />
    <input class="bare-on" type="text" data-skin="bare" value="Value" />
    <input class="bare-off" type="text" data-skin="bare" value="Value" disabled />

    <span class="cngx-field-box cngx-field-affix-row box-fill-off" data-skin="fill">
      <span class="cngx-field-prefix">$</span>
      <input type="text" data-skin="bare" value="Value" disabled />
    </span>
    <span class="cngx-field-box cngx-field-affix-row box-bare-off" data-skin="bare">
      <span class="cngx-field-prefix">$</span>
      <input type="text" data-skin="bare" value="Value" disabled />
    </span>
    <span class="cngx-field-box cngx-field-affix-row box-outline-off" data-skin="outline">
      <span class="cngx-field-prefix">$</span>
      <input type="text" data-skin="bare" value="Value" disabled />
    </span>

    <cngx-select class="sel-outline-off" [disabled]="true" [label]="'C'" [options]="options" />
    <cngx-select class="sel-fill-on" skin="fill" [label]="'C'" [options]="options" />
    <cngx-select class="sel-fill-off" skin="fill" [disabled]="true" [label]="'C'" [options]="options" />
    <cngx-select class="sel-bare-off" skin="bare" [disabled]="true" [label]="'C'" [options]="options" />
    <cngx-typeahead class="ta-fill-off" skin="fill" [disabled]="true" [label]="'C'" [options]="options" />

    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class ForcedHost {
  readonly options = OPTIONS;
}

let mountedRoot: HTMLElement | null = null;

async function mount(scheme: 'light' | 'dark'): Promise<HTMLElement> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: scheme },
    ],
  });
  const fixture = TestBed.createComponent(ForcedHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
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

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(['light', 'dark'] as const)('disabled fields under forced colors, %s', (scheme) => {
  it('emulates forced colors', async () => {
    await mount(scheme);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
  });

  it('paints a disabled label in GrayText, apart from an enabled one', async () => {
    const root = await mount(scheme);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const off = computedValue(one(root, '.label-off'), 'color');
    expect(off).toBe(gray);
    expect(off).not.toBe(computedValue(one(root, '.label-on'), 'color'));
  });

  it.each([
    ['outline', '.outline-off', '.outline-on', 'dashed'],
    ['fill', '.fill-off', '.fill-on', 'dashed'],
    ['bare', '.bare-off', '.bare-on', 'dotted'],
  ])('keeps a disabled %s control apart: GrayText and its baseline', async (_skin, off, on, style) => {
    const root = await mount(scheme);
    const control = one(root, off);
    expect(computedValue(control, 'color')).toBe(computedValue(one(root, '.probe-gray'), 'color'));
    expect(computedValue(control, 'border-bottom-style')).toBe(style);
    expect(computedValue(one(root, on), 'border-bottom-style')).toBe('solid');
  });

  it.each([
    ['fill', '.box-fill-off', 'dashed'],
    ['bare', '.box-bare-off', 'dotted'],
    ['outline', '.box-outline-off', 'dashed'],
  ])('keeps a disabled %s box apart: GrayText and its baseline', async (_skin, box, style) => {
    const root = await mount(scheme);
    const el = one(root, box);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    expect(computedValue(el, 'color')).toBe(gray);
    expect(computedValue(one(el, 'input'), 'color')).toBe(gray);
    expect(computedValue(el, 'border-bottom-style')).toBe(style);
  });

  it.each([
    ['outline select', '.sel-outline-off', 'dashed'],
    ['fill select', '.sel-fill-off', 'dashed'],
    ['bare select', '.sel-bare-off', 'dotted'],
    ['fill typeahead', '.ta-fill-off', 'dashed'],
  ])('keeps a disabled %s trigger apart: GrayText and its baseline', async (_name, host, style) => {
    const root = await mount(scheme);
    const trigger = one(root, `${host} .cngx-field-trigger`);
    expect(computedValue(trigger, 'color')).toBe(computedValue(one(root, '.probe-gray'), 'color'));
    expect(computedValue(trigger, 'border-bottom-style')).toBe(style);
    expect(computedValue(one(root, '.sel-fill-on .cngx-field-trigger'), 'border-bottom-style')).toBe(
      'solid',
    );
  });
});
