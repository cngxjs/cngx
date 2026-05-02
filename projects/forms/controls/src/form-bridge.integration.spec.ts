import { Component, signal, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  CngxCheckboxGroup,
  CngxRadioGroup,
  CngxToggle,
} from '@cngx/common/interactive';
import { CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';
import type { CngxFieldAccessor } from '@cngx/forms/field';
import { CngxFormBridge } from './form-bridge.directive';

/**
 * Per-atom-shape RF integration coverage for `CngxFormBridge`. Asserts the
 * four contractual behaviours the plan requires (value round-trip,
 * disabled propagation, touched on focusout, aria-invalid reflection on
 * invalid + touched). One spec per atom shape — boolean / scalar /
 * array — since the bridge is generic over `T` and the per-shape
 * variations are mechanical.
 *
 * Companion to `form-bridge.directive.spec.ts` which covers the bridge
 * mechanics in isolation. This file proves the bridge wires correctly
 * to each shape of value-bearing atom.
 */

// ── Boolean shape (CngxToggle) ────────────────────────────────────────

@Component({
  template: `<cngx-toggle [formControl]="ctrl" #host>label</cngx-toggle>`,
  imports: [CngxToggle, ReactiveFormsModule, CngxFormBridge],
})
class BooleanRfHost {
  readonly ctrl = new FormControl<boolean>(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });
  @ViewChild('host', { read: CngxToggle }) atom!: CngxToggle;
  @ViewChild('host', { read: CngxFormBridge }) bridge!: CngxFormBridge<boolean>;
}

// ── Scalar shape (CngxRadioGroup) ─────────────────────────────────────

@Component({
  template: `
    <cngx-radio-group [formControl]="ctrl" #host>
      <span></span>
    </cngx-radio-group>
  `,
  imports: [CngxRadioGroup, ReactiveFormsModule, CngxFormBridge],
})
class ScalarRfHost {
  readonly ctrl = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('host', { read: CngxRadioGroup }) atom!: CngxRadioGroup<string>;
  @ViewChild('host', { read: CngxFormBridge })
  bridge!: CngxFormBridge<string | null>;
}

// ── Array shape (CngxCheckboxGroup) ───────────────────────────────────

@Component({
  template: `<cngx-checkbox-group [formControl]="ctrl" #host></cngx-checkbox-group>`,
  imports: [CngxCheckboxGroup, ReactiveFormsModule, CngxFormBridge],
})
class ArrayRfHost {
  readonly ctrl = new FormControl<string[]>([], {
    nonNullable: true,
    validators: [Validators.required, (c) => (c.value.length > 0 ? null : { empty: true })],
  });
  @ViewChild('host', { read: CngxCheckboxGroup })
  atom!: CngxCheckboxGroup<string>;
  @ViewChild('host', { read: CngxFormBridge })
  bridge!: CngxFormBridge<string[]>;
}

// ── Signal Forms host (CngxToggle inside <cngx-form-field>) ───────────

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <cngx-toggle #host>label</cngx-toggle>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxToggle],
})
class SignalFormsHost {
  readonly mock = createMockField<boolean>({ name: 'notifications', value: false });
  readonly field = signal<CngxFieldAccessor<boolean>>(this.mock.accessor);
  @ViewChild('host', { read: CngxToggle }) atom!: CngxToggle;
}

// ────────────────────────────────────────────────────────────────────────

function getHostEl(fixture: ReturnType<typeof TestBed.createComponent<unknown>>, selector: string): HTMLElement {
  const el = fixture.nativeElement.querySelector(selector);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`expected host element ${selector} on fixture`);
  }
  return el;
}

describe('CngxFormBridge — RF integration per atom shape', () => {
  // ── Boolean shape ──────────────────────────────────────────────────

  describe('boolean shape (CngxToggle)', () => {
    function setup(): {
      fixture: ReturnType<typeof TestBed.createComponent<BooleanRfHost>>;
      host: BooleanRfHost;
      el: HTMLElement;
    } {
      TestBed.configureTestingModule({ imports: [BooleanRfHost] });
      const fixture = TestBed.createComponent(BooleanRfHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      return {
        fixture,
        host: fixture.componentInstance,
        el: getHostEl(fixture, 'cngx-toggle'),
      };
    }

    it('value round-trip — RF setValue sinks into atom; atom mutate emerges in ctrl', () => {
      const { fixture, host } = setup();

      host.ctrl.setValue(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.atom.value()).toBe(true);

      host.atom.value.set(false);
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(host.ctrl.value).toBe(false);
    });

    it('disabled propagation — ctrl.disable() flips host aria-disabled', () => {
      const { fixture, host, el } = setup();
      expect(el.getAttribute('aria-disabled')).toBeNull();

      host.ctrl.disable();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.getAttribute('aria-disabled')).toBe('true');

      host.ctrl.enable();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.getAttribute('aria-disabled')).toBeNull();
    });

    it('touched on focusout — focusout dispatch flips ctrl.touched', () => {
      const { fixture, host, el } = setup();
      expect(host.ctrl.touched).toBe(false);

      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      fixture.detectChanges();
      expect(host.ctrl.touched).toBe(true);
    });
  });

  // ── Scalar shape ───────────────────────────────────────────────────

  describe('scalar shape (CngxRadioGroup)', () => {
    function setup(): {
      fixture: ReturnType<typeof TestBed.createComponent<ScalarRfHost>>;
      host: ScalarRfHost;
      el: HTMLElement;
    } {
      TestBed.configureTestingModule({ imports: [ScalarRfHost] });
      const fixture = TestBed.createComponent(ScalarRfHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      return {
        fixture,
        host: fixture.componentInstance,
        el: getHostEl(fixture, 'cngx-radio-group'),
      };
    }

    it('value round-trip — string|null', () => {
      const { fixture, host } = setup();

      host.ctrl.setValue('cash');
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.atom.value()).toBe('cash');

      host.atom.value.set('card');
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(host.ctrl.value).toBe('card');
    });

    it('disabled propagation', () => {
      const { fixture, host, el } = setup();
      host.ctrl.disable();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });

    it('touched on focusout', () => {
      const { fixture, host, el } = setup();
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      fixture.detectChanges();
      expect(host.ctrl.touched).toBe(true);
    });
  });

  // ── Array shape ────────────────────────────────────────────────────

  describe('array shape (CngxCheckboxGroup)', () => {
    function setup(): {
      fixture: ReturnType<typeof TestBed.createComponent<ArrayRfHost>>;
      host: ArrayRfHost;
      el: HTMLElement;
    } {
      TestBed.configureTestingModule({ imports: [ArrayRfHost] });
      const fixture = TestBed.createComponent(ArrayRfHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      return {
        fixture,
        host: fixture.componentInstance,
        el: getHostEl(fixture, 'cngx-checkbox-group'),
      };
    }

    it('value round-trip — array shape', () => {
      const { fixture, host } = setup();

      host.ctrl.setValue(['a', 'b']);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(host.atom.selectedValues()).toEqual(['a', 'b']);

      host.atom.selectedValues.set(['a', 'b', 'c']);
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(host.ctrl.value).toEqual(['a', 'b', 'c']);
    });

    it('disabled propagation', () => {
      const { fixture, host, el } = setup();
      host.ctrl.disable();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.getAttribute('aria-disabled')).toBe('true');
    });

    it('touched on focusout', () => {
      const { fixture, host, el } = setup();
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      fixture.detectChanges();
      expect(host.ctrl.touched).toBe(true);
    });
  });

  // ── aria-invalid reflection inside <cngx-form-field> ───────────────

  describe('aria-invalid reflection (Signal Forms via cngx-form-field)', () => {
    function setup(): {
      fixture: ReturnType<typeof TestBed.createComponent<SignalFormsHost>>;
      host: SignalFormsHost;
      ref: MockFieldRef<boolean>;
      el: HTMLElement;
    } {
      TestBed.configureTestingModule({ imports: [SignalFormsHost] });
      const fixture = TestBed.createComponent(SignalFormsHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;
      return {
        fixture,
        host,
        ref: host.mock.ref,
        el: getHostEl(fixture, 'cngx-toggle'),
      };
    }

    it('starts without aria-invalid', () => {
      const { el } = setup();
      expect(el.getAttribute('aria-invalid')).toBeNull();
    });

    it('flips to aria-invalid="true" when field is invalid AND touched', () => {
      const { fixture, ref, el } = setup();

      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      // touched still false → presenter.showError() === false → no aria-invalid
      expect(el.getAttribute('aria-invalid')).toBeNull();

      ref.touched.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.getAttribute('aria-invalid')).toBe('true');
    });

    it('drops aria-invalid synchronously when field flips back to valid', () => {
      const { fixture, ref, el } = setup();

      ref.invalid.set(true);
      ref.touched.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.getAttribute('aria-invalid')).toBe('true');

      ref.invalid.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      // No stale-ARIA: dropping invalid clears the attribute on the same flush.
      expect(el.getAttribute('aria-invalid')).toBeNull();
    });

    it('atom is discovered as the field-control via CNGX_FORM_FIELD_CONTROL', () => {
      const { host } = setup();
      // Smoke test: the atom's id signal exposes a stable per-instance value.
      expect(host.atom.id()).toMatch(/^cngx-toggle-/);
      expect(host.atom.empty()).toBe(true);
      expect(host.atom.disabled()).toBe(false);
      expect(host.atom.errorState()).toBe(false);
    });
  });
});
