import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxError } from './error.directive';
import { CngxFieldErrors } from './field-errors.component';
import { CngxFormField } from './form-field.component';
import { CngxHint } from './hint.directive';
import { CngxLabel } from './label.component';
import type { CngxFieldAccessor } from './models';
import { CngxRequired } from './required.component';
import { createMockField } from './testing/mock-field';

@Component({
  template: `<label cngxLabel>Email</label>`,
  imports: [CngxLabel],
})
class OrphanLabel {}

@Component({
  template: `<span cngxHint>Help</span>`,
  imports: [CngxHint],
})
class OrphanHint {}

@Component({
  template: `<span cngxError>Invalid</span>`,
  imports: [CngxError],
})
class OrphanError {}

@Component({
  template: `<cngx-required />`,
  imports: [CngxRequired],
})
class OrphanRequired {}

@Component({
  template: `<cngx-field-errors />`,
  imports: [CngxFieldErrors],
})
class OrphanFieldErrors {}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Email <cngx-required /></label>
      <span cngxHint>Help</span>
      <span cngxError>Invalid</span>
      <cngx-field-errors />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxRequired, CngxHint, CngxError, CngxFieldErrors],
})
class PlacedParts {
  readonly field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

const ORPHANS: readonly { selector: string; host: Type<unknown> }[] = [
  { selector: 'cngxLabel', host: OrphanLabel },
  { selector: 'cngxHint', host: OrphanHint },
  { selector: 'cngxError', host: OrphanError },
  { selector: 'cngx-required', host: OrphanRequired },
  { selector: 'cngx-field-errors', host: OrphanFieldErrors },
];

describe('form-field part placement (CNGX2017)', () => {
  for (const { selector, host } of ORPHANS) {
    it(`throws CNGX2017 for [${selector}] outside a form field`, () => {
      expect(() => TestBed.createComponent(host).detectChanges()).toThrow(
        expect.objectContaining({
          name: 'CngxRuntimeError',
          code: 'CNGX2017',
          message: expect.stringMatching(
            new RegExp(
              `^CNGX2017: \\[${selector}\\] must be placed inside <cngx-form-field> or an element with \\[cngxFormFieldPresenter\\]\\.`,
            ),
          ),
        }),
      );
    });
  }

  it('does not throw for the parts inside <cngx-form-field>', () => {
    expect(() => {
      const fixture = TestBed.createComponent(PlacedParts);
      fixture.detectChanges();
      TestBed.flushEffects();
    }).not.toThrow();
  });
});
