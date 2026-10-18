import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form, required, validate } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';

import { createManualState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';
import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormField,
  CngxFormFieldPresenter,
  CngxLabel,
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
 * real Signal Forms `form()`. The schema is `required` plus a rule that
 * rejects every value, so the field is invalid before and after a user
 * write and every error-gated attribute has something to show. Rows: dirty on a
 * user write (never on the seed), the field ARIA on the `role="combobox"`
 * element (required, labelledby, a single-IDREF errormessage, invalid,
 * busy, the control id the label points at) and the `focus()` contract.
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
      readonly state = signal<CngxAsyncState<unknown> | null>(null);
      readonly model = signal<PickModel>({ pick: opts.initial });
      readonly f = form(this.model, (p) => {
        required(p.pick);
        // Signal Forms' `required` passes an empty array, so a reject-all
        // rule keeps the array variants invalid too.
        validate(p.pick, () => ({ kind: 'rejected' }));
      });
    }

    interface Mounted {
      readonly fixture: ComponentFixture<FieldAriaHost>;
      readonly host: FieldAriaHost;
      readonly cmp: unknown;
      readonly control: CngxFormFieldControl;
      readonly presenter: CngxFormFieldPresenter;
      readonly root: HTMLElement;
      readonly combobox: () => HTMLElement;
    }

    // The variant is mounted through a dynamically built template so this
    // helper stays component-agnostic.
    function mount(): Mounted {
      TestBed.overrideComponent(FieldAriaHost, {
        set: {
          template: `
            <cngx-form-field [field]="f.pick">
              <label cngxLabel>Pick</label>
              <${elementSelector} ${opts.inputs ?? ''} [state]="state()" />
            </cngx-form-field>
          `,
          imports: [CngxFormField, CngxLabel, component],
        },
      });
      const fixture = TestBed.createComponent(FieldAriaHost);
      const root = fixture.nativeElement as HTMLElement;
      document.body.appendChild(root);
      mountedRoots.push(root);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      const de = fixture.debugElement.query(By.directive(component));
      const host = de.nativeElement as HTMLElement;
      return {
        fixture,
        host: fixture.componentInstance,
        cmp: de.componentInstance,
        control: de.injector.get(CNGX_FORM_FIELD_CONTROL),
        presenter: fixture.debugElement
          .query(By.directive(CngxFormField))
          .injector.get(CngxFormFieldPresenter),
        root,
        combobox: () => {
          const el = host.querySelector<HTMLElement>('[role="combobox"]');
          expect(el, `${elementSelector} renders no role="combobox" element`).not.toBeNull();
          return el!;
        },
      };
    }

    const mountedRoots: HTMLElement[] = [];
    afterEach(() => {
      mountedRoots.splice(0).forEach((el) => el.remove());
    });

    // Required, touched and invalid: every field-gated attribute applies.
    function mountTouched(): Mounted {
      const mounted = mount();
      mounted.host.f.pick().markAsTouched();
      flush(mounted.fixture);
      return mounted;
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

    // A div combobox is named through aria-labelledby; an input combobox is
    // labelable and named by the label's `for`.
    it('projects aria-required and aria-invalid and is named by the field label', () => {
      const { combobox, presenter, root } = mountTouched();
      const el = combobox();
      expect(el.getAttribute('aria-required')).toBe('true');
      expect(el.getAttribute('aria-invalid')).toBe('true');
      const label = root.querySelector<HTMLLabelElement>('label[cngxLabel]')!;
      const byLabelledBy = el.getAttribute('aria-labelledby') === presenter.labelId();
      const byFor = el.id !== '' && label.htmlFor === el.id;
      expect(byLabelledBy || byFor).toBe(true);
    });

    it('points aria-errormessage at the field error id alone', () => {
      const { combobox, presenter } = mountTouched();
      const ref = combobox().getAttribute('aria-errormessage');
      expect(ref).toBe(presenter.errorId());
      expect(ref).not.toMatch(/\s/);
    });

    it('uses the field input id as the control id the label points at', () => {
      const { control, presenter, root } = mountTouched();
      expect(control.id()).toBe(presenter.inputId());
      const label = root.querySelector<HTMLLabelElement>('label[cngxLabel]')!;
      expect(label.htmlFor).not.toBe('');
      expect(document.getElementById(label.htmlFor)).not.toBeNull();
    });

    it('marks the trigger busy while the [state] loads', () => {
      const { fixture, host, combobox } = mount();
      const state = createManualState<unknown>();
      host.state.set(state);
      state.set('loading');
      flush(fixture);
      expect(combobox().getAttribute('aria-busy')).toBe('true');
    });

    it('moves focus to the role="combobox" element on control.focus()', () => {
      const { control, combobox } = mount();
      control.focus?.();
      expect(document.activeElement).toBe(combobox());
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
