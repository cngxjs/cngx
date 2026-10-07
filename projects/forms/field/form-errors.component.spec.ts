import { Component, computed, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxFormErrors } from './form-errors.component';
import { provideErrorMessages } from './form-field.token';
import { provideFormFieldI18n, withFormFieldI18nLabels } from './i18n/form-field-i18n';
import { createMockField, mockValidationError } from './testing/mock-field';
import type { CngxFieldAccessor, ErrorMessageMap } from './models';

const MESSAGES: ErrorMessageMap = {
  required: () => 'This field is required.',
  email: () => 'Invalid email.',
};

@Component({
  template: `
    <label id="cngx-email-label">E-mail address <span aria-hidden="true">*</span></label>
    <label id="cngx-password-label">Password</label>
    <cngx-form-errors [fields]="fields()" [show]="show()" />
  `,
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

@Component({
  template: `<cngx-form-errors [fields]="fields()" [show]="show()" />`,
  imports: [CngxFormErrors],
})
class UnlabelledHost {
  fields = signal<CngxFieldAccessor[]>([]);
  show = signal(false);
}

describe('CngxFormErrors', () => {
  function setup(
    HostClass: typeof TestHost | typeof CustomTplHost | typeof UnlabelledHost = TestHost,
    messages: ErrorMessageMap | Signal<ErrorMessageMap> = MESSAGES,
    providers: unknown[] = [],
  ) {
    const emailMock = createMockField({ name: 'email' });
    const pwMock = createMockField({ name: 'password' });

    TestBed.configureTestingModule({
      imports: [HostClass],
      providers: [provideErrorMessages(messages), ...(providers as never[])],
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

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    expect(el.querySelector('ul')).toBeNull();
  });

  it('renders nothing when no errors', () => {
    const { fixture } = setup();
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
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

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    const items = Array.from(el.querySelectorAll('li')).map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(items).toEqual([
      'E-mail address: This field is required.',
      'E-mail address: Invalid email.',
      'Password: This field is required.',
    ]);
    expect(el.querySelector('li strong')?.textContent).toBe('E-mail address');
  });

  it('names a field by its visible label, never by its model key', () => {
    const { fixture, emailMock } = setup();
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    expect(el.querySelector('li')?.textContent).not.toContain('email');
  });

  it('shows the message alone for a field without a label', () => {
    TestBed.resetTestingModule();
    const { fixture, emailMock } = setup(UnlabelledHost);
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    expect(el.querySelector('li')?.textContent?.trim()).toBe('This field is required.');
    expect(el.querySelector('li strong')).toBeNull();
  });

  it('places label and message in the order of the errorSummaryItem message', () => {
    TestBed.resetTestingModule();
    const { fixture, emailMock } = setup(TestHost, MESSAGES, [
      provideFormFieldI18n(withFormFieldI18nLabels({ errorSummaryItem: '{message} ({label})' })),
    ]);
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    expect(el.querySelector('li')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'This field is required. (E-mail address)',
    );
  });

  it('never shows the raw kind of an unmapped error without a message', () => {
    TestBed.resetTestingModule();
    const { fixture, emailMock } = setup(TestHost, {});
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('serverRejected')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    const text = el.querySelector('li')?.textContent ?? '';
    expect(text).toContain('This value is invalid.');
    expect(text).not.toContain('serverRejected');
  });

  it('sets role=alert when visible', () => {
    const { fixture, emailMock } = setup();
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('error links are focusable', () => {
    const { fixture, emailMock } = setup();
    emailMock.ref.invalid.set(true);
    emailMock.ref.errors.set([mockValidationError('required')]);
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
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

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
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

    const el = fixture.debugElement.query(By.directive(CngxFormErrors))
      .nativeElement as HTMLElement;
    expect(el.querySelector('.custom-summary')?.textContent).toContain('1 errors');
    expect(el.querySelector('.custom-item')?.textContent).toContain(
      'email: This field is required.',
    );
  });

  describe('language switch', () => {
    it('keeps the label / message order until the errors change', () => {
      TestBed.resetTestingModule();
      const order = signal('{label}: {message}');
      const { fixture, emailMock } = setup(TestHost, MESSAGES, [
        provideFormFieldI18n(
          withFormFieldI18nLabels(computed(() => ({ errorSummaryItem: order() }))),
        ),
      ]);
      fixture.componentInstance.show.set(true);
      emailMock.ref.invalid.set(true);
      emailMock.ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(CngxFormErrors))
        .nativeElement as HTMLElement;
      const text = () => el.querySelector('li')?.textContent?.replace(/\s+/g, ' ').trim();
      expect(text()).toBe('E-mail address: This field is required.');

      order.set('{message} ({label})');
      fixture.detectChanges();
      expect(text()).toBe('E-mail address: This field is required.');

      emailMock.ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      expect(text()).toBe('This field is required. (E-mail address)');
    });

    it('does not re-announce on a language flip', () => {
      const lang = signal<'en' | 'de'>('en');
      const { fixture, emailMock } = setup(
        TestHost,
        computed<ErrorMessageMap>(() => ({
          required: () => (lang() === 'de' ? 'Pflichtfeld.' : 'This field is required.'),
        })),
      );
      fixture.componentInstance.show.set(true);
      emailMock.ref.invalid.set(true);
      emailMock.ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(CngxFormErrors))
        .nativeElement as HTMLElement;
      expect(el.querySelector('li')?.textContent).toContain('This field is required.');

      lang.set('de');
      fixture.detectChanges();
      expect(el.querySelector('li')?.textContent).toContain('This field is required.');

      emailMock.ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      expect(el.querySelector('li')?.textContent).toContain('Pflichtfeld.');
    });
  });
});
