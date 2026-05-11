import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField } from './form-field.component';
import { CngxHint } from './hint.directive';
import { createMockField, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <span cngxHint>Help text</span>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxHint],
})
class TestHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

describe('CngxHint', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
  let hintEl: HTMLSpanElement;
  let ref: MockFieldRef;

  beforeEach(() => {
    const mock = createMockField({ name: 'email' });
    ref = mock.ref;

    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.field.set(mock.accessor);
    fixture.detectChanges();
    TestBed.flushEffects();

    hintEl = fixture.debugElement.query(By.directive(CngxHint)).nativeElement;
  });

  it('sets id to hint ID', () => {
    expect(hintEl.id).toBe('cngx-email-hint');
  });

  it('updates id when field name changes', () => {
    ref.name.set('password');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(hintEl.id).toBe('cngx-password-hint');
  });

  it('renders projected content', () => {
    expect(hintEl.textContent?.trim()).toBe('Help text');
  });
});
