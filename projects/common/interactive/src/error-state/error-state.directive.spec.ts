import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
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

  it('aria-errormessage stays in the DOM whenever a non-empty id is bound', () => {
    const { fixture, el, host } = setup();
    expect(el.getAttribute('aria-errormessage')).toBeNull();

    host.messageId.set('email-error');
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBe('email-error');

    host.invalid.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBe('email-error');

    host.invalid.set(false);
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBe('email-error');

    host.messageId.set('');
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBeNull();

    host.messageId.set(null);
    fixture.detectChanges();
    expect(el.getAttribute('aria-errormessage')).toBeNull();
  });
});
