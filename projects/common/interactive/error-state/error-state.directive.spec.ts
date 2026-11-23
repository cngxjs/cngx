import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxErrorScope } from '../error-scope/error-scope.directive';
import { CngxErrorState } from './error-state.directive';

@Component({
  template: `
    <span
      [cngxErrorState]="invalid()"
      [cngxErrorMessageId]="messageId()"
    ></span>
  `,
  imports: [CngxErrorState],
})
class TestHost {
  invalid = signal(false);
  messageId = signal<string | null>(null);
}

@Component({
  template: `
    <form cngxErrorScope #scope="cngxErrorScope">
      <input [cngxErrorState]="invalid()" cngxErrorMessageId="email-error" />
    </form>
  `,
  imports: [CngxErrorScope, CngxErrorState],
})
class ScopedHost {
  invalid = signal(true);
  scope = viewChild.required(CngxErrorScope);
}

function setup() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxErrorState));
  const el = de.nativeElement as HTMLElement;
  return { fixture, el, host: fixture.componentInstance };
}

describe('CngxErrorState', () => {
  it('aria-invalid stays in the DOM with explicit "true"/"false"', () => {
    const { fixture, el, host } = setup();
    expect(el.classList.contains('cngx-error')).toBe(false);
    expect(el.getAttribute('aria-invalid')).toBe('false');

    host.invalid.set(true);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-error')).toBe(true);
    expect(el.getAttribute('aria-invalid')).toBe('true');

    host.invalid.set(false);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-error')).toBe(false);
    expect(el.getAttribute('aria-invalid')).toBe('false');
  });

  it('aria-errormessage carries the id only while the error is shown', () => {
    const { fixture, el, host } = setup();
    expect(el.getAttribute('aria-errormessage')).toBeNull();

    host.messageId.set('email-error');
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBeNull();

    host.invalid.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBe('email-error');

    host.messageId.set('');
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBeNull();

    host.messageId.set(null);
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBeNull();

    host.messageId.set('email-error');
    host.invalid.set(false);
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBeNull();
  });

  describe('inside a CngxErrorScope', () => {
    function setupScoped() {
      const fixture = TestBed.createComponent(ScopedHost);
      fixture.detectChanges();
      const el = (fixture.nativeElement as HTMLElement).querySelector('input')!;
      return { fixture, el, host: fixture.componentInstance };
    }

    it('hides the error until the scope reveals and again after reset', () => {
      const { fixture, el, host } = setupScoped();
      expect(el.classList.contains('cngx-error')).toBe(false);
      expect(el.getAttribute('aria-invalid')).toBe('false');
      expect(el.getAttribute('aria-errormessage')).toBeNull();

      host.scope().reveal();
      fixture.detectChanges();
      expect(el.classList.contains('cngx-error')).toBe(true);
      expect(el.getAttribute('aria-invalid')).toBe('true');
      expect(el.getAttribute('aria-errormessage')).toBe('email-error');

      host.scope().reset();
      fixture.detectChanges();
      expect(el.classList.contains('cngx-error')).toBe(false);
      expect(el.getAttribute('aria-invalid')).toBe('false');
      expect(el.getAttribute('aria-errormessage')).toBeNull();
    });

    it('shows nothing after reveal while the flag is false', () => {
      const { fixture, el, host } = setupScoped();
      host.invalid.set(false);
      host.scope().reveal();
      fixture.detectChanges();
      expect(el.classList.contains('cngx-error')).toBe(false);
      expect(el.getAttribute('aria-invalid')).toBe('false');
      expect(el.getAttribute('aria-errormessage')).toBeNull();
    });
  });
});
