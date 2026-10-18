import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form, required, validate } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormField,
  provideFormField,
  withErrorStrategy,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

/**
 * Per-variant wiring for {@link describeFieldAriaHost}.
 *
 * @internal
 */
export interface FieldAriaHostOptions {
  /** Extra attributes on the variant element; they read members of `ctx`. */
  readonly inputs?: string;
  /** Host members the `inputs` bindings read, as `ctx.<name>`. */
  readonly ctx?: () => Record<string, unknown>;
  /** Value the model field starts with (`null` scalar, `[]` array). */
  readonly initial: PickValue;
  /** Writes one user change through the variant's own value model. */
  readonly userWrite: (cmp: unknown) => void;
}

type PickValue = string | string[] | null;

interface PickModel {
  pick: PickValue;
}

function isFilled(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== undefined && value !== null && value !== '';
}

/**
 * Shared spec for a select-family composite inside `cngx-form-field` on a
 * real Signal Forms `form()`. The schema is `required`, and a filled value
 * is rejected too, so the field is invalid before and after a user write
 * and every error-gated attribute has something to show.
 *
 * Built on a real form rather than `createMockField`: the mock does not
 * model dirty through `controlValue`, which is what these rows lock.
 *
 * @internal
 */
export function describeFieldAriaHost(
  variantName: string,
  component: Type<unknown>,
  elementSelector: string,
  opts: FieldAriaHostOptions,
): void {
  describe(`field ARIA host (${variantName})`, () => {
    @Component({
      template: '',
      imports: [CngxFormField],
    })
    class FieldAriaHost {
      readonly ctx: Record<string, unknown> = opts.ctx?.() ?? {};
      readonly model = signal<PickModel>({ pick: opts.initial });
      readonly f = form(this.model, (p) => {
        required(p.pick);
        validate(p.pick, ({ value }) => (isFilled(value()) ? { kind: 'rejected' } : undefined));
      });
    }

    interface Mounted {
      readonly fixture: ComponentFixture<FieldAriaHost>;
      readonly host: FieldAriaHost;
      readonly cmp: unknown;
      readonly control: CngxFormFieldControl;
    }

    // The variant is mounted through a dynamically built template so this
    // helper stays component-agnostic.
    function mount(): Mounted {
      TestBed.overrideComponent(FieldAriaHost, {
        set: {
          template: `
            <cngx-form-field [field]="f.pick">
              <${elementSelector} ${opts.inputs ?? ''} />
            </cngx-form-field>
          `,
          imports: [CngxFormField, component],
        },
      });
      const fixture = TestBed.createComponent(FieldAriaHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      const de = fixture.debugElement.query(By.directive(component));
      return {
        fixture,
        host: fixture.componentInstance,
        cmp: de.componentInstance,
        control: de.injector.get(CNGX_FORM_FIELD_CONTROL),
      };
    }

    function flush(fixture: ComponentFixture<FieldAriaHost>): void {
      TestBed.flushEffects();
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('leaves the field pristine on the mount seed', () => {
      const { host } = mount();
      expect(host.f.pick().dirty()).toBe(false);
    });

    it('marks the field dirty on a user write', () => {
      const { fixture, host, cmp } = mount();
      opts.userWrite(cmp);
      flush(fixture);
      expect(isFilled(host.model().pick)).toBe(true);
      expect(host.f.pick().dirty()).toBe(true);
    });

    it('reveals the error under an onDirty strategy after a user write', () => {
      TestBed.configureTestingModule({
        providers: [provideFormField(withErrorStrategy('onDirty'))],
      });
      const { fixture, cmp, control } = mount();
      expect(control.errorState()).toBe(false);
      opts.userWrite(cmp);
      flush(fixture);
      expect(control.errorState()).toBe(true);
    });
  });
}
