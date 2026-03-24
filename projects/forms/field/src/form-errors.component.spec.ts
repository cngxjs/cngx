import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxFormErrors } from './form-errors.component';
import { CNGX_ERROR_MESSAGES } from './form-field.token';
import { createMockField, mockValidationError } from './testing/mock-field';
import type { CngxFieldAccessor, ErrorMessageMap } from './models';

const MESSAGES: ErrorMessageMap = {
  required: () => 'This field is required.',
  email: () => 'Invalid email.',
};

@Component({
  template: `<cngx-form-errors [fields]="fields()" [show]="show()" />`,
  imports: [CngxFormErrors],
})
class TestHost {
  fields = signal<CngxFieldAccessor[]>([]);
  show = signal(false);
}

@Component({
  template: `
    <cngx-form-errors [fields]="fields()" [show]="show()">
      <ng-template let-errors="errors" let-count="count">
        <div class="custom-summary">{{ count }} errors</div>
        @for (err of errors; track err.fieldName) {
          <span class="custom-item">{{ err.fieldName }}: {{ err.message }}</span>
        }
      </ng-template>
    </cngx-form-errors>
  `,
  imports: [CngxFormErrors],
})
class CustomTplHost {
  fields = signal<CngxFieldAccessor[]>([]);
  show = signal(false);
}

describe('CngxFormErrors', () => {
  function setup(HostClass: typeof TestHost | typeof CustomTplHost = TestHost) {
    const emailMock = createMockField({ name: 'email' });
    const pwMock = createMockField({ name: 'password' });

    TestBed.configureTestingModule({
      imports: [HostClass],
      providers: [{ provide: CNGX_ERROR_MESSAGES, useValue: MESSAGES }],
    });
    const fixture = TestBed.createComponent(HostClass);
    fixture.componentInstance.fields.set([emailMock.accessor, pwMock.accessor]);
    fixture.detectChanges();
    TestBed.flushEffects();

    return { fixture, emailMock, pwMock };
  }

  it('renders nothing when show is false', () => {
    const { fixture, emailMock } = setup();
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors)).nativeElement as HTMLElement;
    expect(el.querySelector('ul')).toBeNull();
  });

  it('renders nothing when no errors', () => {
    const { fixture } = setup();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors)).nativeElement as HTMLElement;
    expect(el.querySelector('ul')).toBeNull();
  });

  it('renders error list when show=true and fields have errors', () => {
    const { fixture, emailMock, pwMock } = setup();
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required'), mockValidationError('email')]);
    pwMock.ref.invalid.set(true);
    pwMock.ref.errors.set([mockValidationError('required')]);

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors)).nativeElement as HTMLElement;
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('email');
    expect(items[0].textContent).toContain('This field is required.');
    expect(items[1].textContent).toContain('email');
    expect(items[1].textContent).toContain('Invalid email.');
    expect(items[2].textContent).toContain('password');
  });

  it('sets role=alert when visible', () => {
    const { fixture, emailMock } = setup();
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors)).nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('error links are focusable', () => {
    const { fixture, emailMock } = setup();
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors)).nativeElement as HTMLElement;
    const link = el.querySelector('a');
    expect(link?.getAttribute('tabindex')).toBe('0');
    expect(link?.getAttribute('role')).toBe('link');
  });

  it('skips valid fields', () => {
    const { fixture } = setup();
    // emailMock is valid, no errors set
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors)).nativeElement as HTMLElement;
    expect(el.querySelector('li')).toBeNull();
  });

  // ── Custom template ────────────────────────────────────────────

  it('renders custom template with error context', () => {
    TestBed.resetTestingModule();
    const { fixture, emailMock } = setup(CustomTplHost);
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors)).nativeElement as HTMLElement;
    expect(el.querySelector('.custom-summary')?.textContent).toContain('1 errors');
    expect(el.querySelector('.custom-item')?.textContent).toContain('email: This field is required.');
  });
});
