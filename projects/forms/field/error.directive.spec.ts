import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField } from './form-field.component';
import { CngxError } from './error.directive';
import { createMockField, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <div cngxError>Error content</div>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxError],
})
class TestHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

describe('CngxError', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
  let errorEl: HTMLDivElement;
  let ref: MockFieldRef;

  beforeEach(() => {
    const mock = createMockField({ name: 'email' });
    ref = mock.ref;

    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.field.set(mock.accessor);
    fixture.detectChanges();
    TestBed.flushEffects();

    errorEl = fixture.debugElement.query(By.directive(CngxError)).nativeElement;
  });

  it('sets id to error ID', () => {
    expect(errorEl.id).toBe('cngx-email-error');
  });

  it('has aria-live=polite always', () => {
    expect(errorEl.getAttribute('aria-live')).toBe('polite');
  });

  it('is aria-hidden when no error (untouched)', () => {
    expect(errorEl.getAttribute('aria-hidden')).toBe('true');
  });

  it('is aria-hidden when invalid but untouched', () => {
    ref.invalid.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(errorEl.getAttribute('aria-hidden')).toBe('true');
  });

  it('removes aria-hidden when touched and invalid', () => {
    ref.touched.set(true);
    ref.invalid.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(errorEl.getAttribute('aria-hidden')).toBeNull();
  });

  it('has no role when errors are hidden', () => {
    expect(errorEl.getAttribute('role')).toBeNull();
  });

  it('sets role=alert when errors are visible', () => {
    ref.touched.set(true);
    ref.invalid.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(errorEl.getAttribute('role')).toBe('alert');
  });

  it('removes role=alert when error clears', () => {
    ref.touched.set(true);
    ref.invalid.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(errorEl.getAttribute('role')).toBe('alert');

    ref.invalid.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(errorEl.getAttribute('role')).toBeNull();
  });

  it('renders projected content', () => {
    expect(errorEl.textContent?.trim()).toBe('Error content');
  });

  it('updates id when field name changes', () => {
    ref.name.set('password');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(errorEl.id).toBe('cngx-password-error');
  });
});
