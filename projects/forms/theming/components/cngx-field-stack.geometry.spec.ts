import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxError, CngxFieldErrors, CngxFormField, CngxHint, CngxLabel } from '@cngx/forms/field';
import { createMockField, mockValidationError } from '@cngx/forms/field/testing';
import { CngxInput } from '@cngx/forms/input';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxFieldBox } from '../../field/field-box.directive';

// Runs in a real Chromium (the `test-geometry` target). A cngx-form-field that
// holds its label is the field's own stack: the label sits one label gap above
// the control or box, hint and error lines follow one hint gap apart, and the
// consumer's container (here a 16px grid gap, like the anatomy stories) only
// spaces one field from the next. A label inside the box is the inner label;
// that field stays `display: contents` and the box keeps its own line.

const HARNESS_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../../core/theming/density-tokens.css',
  './cngx-field-affix.css',
  './cngx-field-skin.css',
  './cngx-field-text.css',
];

type Skin = 'outline' | 'fill' | 'bare';
type Density = 'compact' | 'comfortable' | 'spacious';

@Component({
  selector: 'cngx-field-stack-geometry-host',
  standalone: true,
  imports: [CngxFormField, CngxLabel, CngxHint, CngxFieldErrors, CngxError, CngxInput, CngxFieldBox],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-density]="density()" style="display: grid; gap: 16px; inline-size: 24rem">
      <cngx-form-field class="f-lone" [field]="invalid" [skin]="skin()">
        <label cngxLabel>Name</label>
        <input cngxInput />
        <span cngxHint>Shown on your profile</span>
        <cngx-field-errors />
      </cngx-form-field>
      <cngx-form-field class="f-box" [field]="plain" [skin]="skin()">
        <label cngxLabel>Amount</label>
        <span cngxFieldBox><input cngxInput /></span>
        <span cngxHint>Per month</span>
      </cngx-form-field>
      <cngx-form-field class="f-inner" [field]="inner" [skin]="skin()">
        <span cngxFieldBox>
          <label cngxLabel>Reference</label>
          <input cngxInput />
        </span>
      </cngx-form-field>
      <cngx-form-field class="f-manual-empty" [field]="plain" [skin]="skin()">
        <label cngxLabel>Nickname</label>
        <input cngxInput />
        <span cngxHint>Optional</span>
        <div cngxError>
          @if (manualEmptyShown()) {
            <p>Never rendered</p>
          }
        </div>
      </cngx-form-field>
      <cngx-form-field class="f-manual-shown" [field]="invalid" [skin]="skin()">
        <label cngxLabel>Handle</label>
        <input cngxInput />
        <div cngxError><p style="margin: 0">Enter a handle.</p></div>
      </cngx-form-field>
    </div>
  `,
})
class StackHost {
  readonly skin = signal<Skin>('outline');
  readonly density = signal<Density>('comfortable');
  readonly manualEmptyShown = signal(false);
  readonly invalid = createMockField({
    name: 'name',
    invalid: true,
    touched: true,
    errors: [
      mockValidationError('required', 'Enter a name.'),
      mockValidationError('minLength', 'Use at least 3 characters.'),
    ],
  }).accessor;
  readonly plain = createMockField({ name: 'amount' }).accessor;
  readonly inner = createMockField({ name: 'reference' }).accessor;
}

const GAP: Record<Density, number> = { compact: 2, comfortable: 4, spacious: 6 };

let mountedRoot: HTMLElement | null = null;

function mount(skin: Skin, density: Density): HTMLElement {
  const fixture = TestBed.createComponent(StackHost);
  fixture.componentInstance.skin.set(skin);
  fixture.componentInstance.density.set(density);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: Element, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function rect(el: Element): DOMRect {
  return el.getBoundingClientRect();
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

const MATRIX: [Skin, Density][] = (['outline', 'fill', 'bare'] as const).flatMap((skin) =>
  (['compact', 'comfortable', 'spacious'] as const).map((density): [Skin, Density] => [skin, density]),
);

describe.each(MATRIX)('field stack: %s skin, %s', (skin, density) => {
  it('makes a field that holds its label a flex column', () => {
    const field = query(mount(skin, density), '.f-lone');
    expect(computedValue(field, 'display')).toBe('flex');
    expect(computedValue(field, 'flex-direction')).toBe('column');
  });

  it('puts one label gap between the label and a lone control', () => {
    const field = query(mount(skin, density), '.f-lone');
    const label = query(field, ':scope > .cngx-label');
    const input = query(field, ':scope > input');
    expect(rect(input).top - rect(label).bottom).toBeCloseTo(GAP[density], 0);
  });

  it('puts one label gap between the label and a field box', () => {
    const field = query(mount(skin, density), '.f-box');
    const label = query(field, ':scope > .cngx-label');
    const box = query(field, ':scope > .cngx-field-box');
    expect(rect(box).top - rect(label).bottom).toBeCloseTo(GAP[density], 0);
  });

  it('puts one hint gap below the control and between hint and error lines', () => {
    const field = query(mount(skin, density), '.f-lone');
    const input = query(field, ':scope > input');
    const hint = query(field, ':scope > .cngx-hint');
    const lines = Array.from(field.querySelectorAll('cngx-field-errors > p'));
    expect(lines.length).toBe(2);
    expect(rect(hint).top - rect(input).bottom).toBeCloseTo(GAP[density], 0);
    expect(rect(lines[0]).top - rect(hint).bottom).toBeCloseTo(GAP[density], 0);
    expect(rect(lines[1]).top - rect(lines[0]).bottom).toBeCloseTo(GAP[density], 0);
  });

  it('leaves field-to-field spacing to the container', () => {
    const root = mount(skin, density);
    const first = query(root, '.f-lone');
    const next = query(root, '.f-box > .cngx-label');
    expect(rect(next).top - rect(first).bottom).toBeCloseTo(16, 0);
  });

  // The empty manual error container is the live region waiting for content;
  // it must not add a hint gap below the last visible line.
  it('ends the field at the hint when the manual error container is empty', () => {
    const field = query(mount(skin, density), '.f-manual-empty');
    const hint = query(field, ':scope > .cngx-hint');
    expect(query(field, ':scope > .cngx-error').matches(':empty')).toBe(true);
    expect(rect(field).bottom - rect(hint).bottom).toBeCloseTo(0, 0);
  });

  it('puts one hint gap above a manual error container that holds content', () => {
    const field = query(mount(skin, density), '.f-manual-shown');
    const input = query(field, ':scope > input');
    const error = query(field, ':scope > .cngx-error');
    expect(computedValue(error, 'position')).toBe('static');
    expect(rect(error).top - rect(input).bottom).toBeCloseTo(GAP[density], 0);
    expect(rect(field).bottom - rect(error).bottom).toBeCloseTo(0, 0);
  });

  it('keeps a field with an inner label as display: contents', () => {
    const field = query(mount(skin, density), '.f-inner');
    expect(computedValue(field, 'display')).toBe('contents');
    const label = query(field, '.cngx-field-box > .cngx-label');
    expect(computedValue(label, 'margin-block-end')).toBe('0px');
  });
});
