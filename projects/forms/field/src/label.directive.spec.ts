import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField } from './form-field.component';
import { CngxLabel } from './label.directive';
import { CNGX_FORM_FIELD_CONFIG } from './form-field.token';
import { createMockField, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel #lbl="cngxLabel">Test Label</label>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel],
})
class TestHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel [showRequired]="false">Opt-out Label</label>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel],
})
class OptOutHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email', required: true }).accessor);
}

describe('CngxLabel', () => {
  // ── Basic (no global marker) ───────────────────────────────────

  describe('without withRequiredMarker()', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    let labelEl: HTMLLabelElement;
    let ref: MockFieldRef;
    let directive: CngxLabel;

    beforeEach(() => {
      const mock = createMockField({ name: 'email' });
      ref = mock.ref;

      TestBed.configureTestingModule({ imports: [TestHost] });
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const debugEl = fixture.debugElement.query(By.directive(CngxLabel));
      labelEl = debugEl.nativeElement;
      directive = debugEl.injector.get(CngxLabel);
    });

    it('sets for attribute to input ID', () => {
      expect(labelEl.getAttribute('for')).toBe('cngx-email-input');
    });

    it('sets id attribute to label ID', () => {
      expect(labelEl.id).toBe('cngx-email-label');
    });

    it('updates for when field name changes', () => {
      ref.name.set('username');
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(labelEl.getAttribute('for')).toBe('cngx-username-input');
    });

    it('exposes required signal', () => {
      expect(directive.required()).toBe(false);
      ref.required.set(true);
      TestBed.flushEffects();
      expect(directive.required()).toBe(true);
    });

    it('does not render required marker without global config', () => {
      ref.required.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(labelEl.querySelector('.cngx-label__required')).toBeNull();
    });

    it('sets cngx-label--required class when required', () => {
      ref.required.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(labelEl.classList.contains('cngx-label--required')).toBe(true);
    });

    it('sets cngx-label--error class when showError', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(labelEl.classList.contains('cngx-label--error')).toBe(true);
    });

    it('sets cngx-label--disabled class when disabled', () => {
      ref.disabled.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(labelEl.classList.contains('cngx-label--disabled')).toBe(true);
    });
  });

  // ── With withRequiredMarker() global config ────────────────────

  describe('with withRequiredMarker()', () => {
    it('auto-renders * when field is required', () => {
      const mock = createMockField({ name: 'email', required: true });
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { requiredMarker: '*' } }],
      });
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement as HTMLElement;
      const marker = labelEl.querySelector('.cngx-label__required');
      expect(marker).not.toBeNull();
      expect(marker!.textContent?.trim()).toBe('*');
      expect(marker!.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not render marker when field is not required', () => {
      const mock = createMockField({ name: 'email', required: false });
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { requiredMarker: '*' } }],
      });
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement as HTMLElement;
      expect(labelEl.querySelector('.cngx-label__required')).toBeNull();
    });

    it('uses custom marker text', () => {
      const mock = createMockField({ name: 'email', required: true });
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { requiredMarker: '(Pflichtfeld)' } }],
      });
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const marker = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement.querySelector('.cngx-label__required');
      expect(marker!.textContent?.trim()).toBe('(Pflichtfeld)');
    });

    it('reacts when required changes dynamically', () => {
      const mock = createMockField({ name: 'email', required: false });
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { requiredMarker: '*' } }],
      });
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement as HTMLElement;
      expect(labelEl.querySelector('.cngx-label__required')).toBeNull();

      mock.ref.required.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(labelEl.querySelector('.cngx-label__required')).not.toBeNull();
    });
  });

  // ── Per-label opt-out ──────────────────────────────────────────

  describe('per-label opt-out', () => {
    it('does not show marker when [showRequired]="false" even with global config', () => {
      const mock = createMockField({ name: 'email', required: true });
      TestBed.configureTestingModule({
        imports: [OptOutHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { requiredMarker: '*' } }],
      });
      const fixture = TestBed.createComponent(OptOutHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement as HTMLElement;
      expect(labelEl.querySelector('.cngx-label__required')).toBeNull();
    });
  });
});
