/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled chip fades
// by colour, never opacity: 38% text on a faint text tint, a stronger tint when
// selected, also for a colour variant. The remove button is quieter at rest by
// colour, not opacity. Under forced colors a disabled chip reads GrayText and a
// selected chip keeps its HighlightText label visible over the text backplate.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-chip-disabled-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './chip.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <span class="cngx-chip chip-off" role="option" aria-disabled="true">
          <span class="cngx-chip__label">Plain</span>
        </span>
        <span class="cngx-chip chip-off-selected" role="option" aria-disabled="true" aria-selected="true">
          <span class="cngx-chip__label">Selected</span>
        </span>
        <span class="cngx-chip chip-off-danger" data-color="danger" aria-disabled="true">
          <span class="cngx-chip__label">Danger</span>
        </span>
        <span class="cngx-chip chip-on-selected" role="option" aria-selected="true">
          <span class="cngx-chip__label">Selected</span>
        </span>
        <span class="cngx-chip chip-removable">
          <span class="cngx-chip__label">Removable</span>
          <button type="button" class="cngx-chip__remove" aria-label="Remove">x</button>
          <span class="probe-remove" style="color: color-mix(in oklab, currentColor 70%, transparent)"></span>
        </span>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span
          class="probe-tint"
          style="background: color-mix(in oklab, var(--cngx-color-text) 6%, transparent)"
        ></span>
        <span
          class="probe-tint-selected"
          style="background: color-mix(in oklab, var(--cngx-color-text) 16%, transparent)"
        ></span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class ChipHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ChipHost);
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

function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled chip, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints a disabled chip by the field recipe on a faint tint, not opacity', () => {
    const root = mount();
    const chip = at(root, '.chip-off');
    expect(effectiveOpacity(chip)).toBe(1);
    expect(computedValue(chip, 'color')).toBe(computedValue(at(root, '.probe-disabled'), 'color'));
    expect(computedValue(chip, 'background-color')).toBe(
      computedValue(at(root, '.probe-tint'), 'background-color'),
    );
  });

  it('keeps a disabled selection readable with a stronger tint', () => {
    const root = mount();
    const chip = at(root, '.chip-off-selected');
    expect(effectiveOpacity(chip)).toBe(1);
    expect(computedValue(chip, 'color')).toBe(computedValue(at(root, '.probe-disabled'), 'color'));
    expect(computedValue(chip, 'background-color')).toBe(
      computedValue(at(root, '.probe-tint-selected'), 'background-color'),
    );
  });

  it('fades a disabled colour variant too', () => {
    const root = mount();
    expect(computedValue(at(root, '.chip-off-danger'), 'color')).toBe(
      computedValue(at(root, '.probe-disabled'), 'color'),
    );
  });

  it('quiets the remove button by colour at rest and lifts it on hover', async () => {
    const root = mount();
    const remove = at(root, '.chip-removable .cngx-chip__remove');
    expect(effectiveOpacity(remove)).toBe(1);
    expect(computedValue(remove, 'color')).toBe(
      computedValue(at(root, '.chip-removable .probe-remove'), 'color'),
    );
    await userEvent.hover(remove);
    expect(effectiveOpacity(remove)).toBe(1);
    expect(computedValue(remove, 'color')).toBe(computedValue(at(root, '.chip-removable'), 'color'));
  });

  it('reads GrayText under forced colors and keeps the selected label visible', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    expect(computedValue(at(root, '.chip-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.chip-off-selected'), 'background-color')).toBe(gray);
    expect(computedValue(at(root, '.chip-on-selected'), 'forced-color-adjust')).toBe('none');
    expect(computedValue(at(root, '.chip-on-selected'), 'color')).not.toBe(gray);
  });
});
