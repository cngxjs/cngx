import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField, type CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField } from '../../field/src/testing/mock-field';
import { CngxInput } from './input.directive';
import { CngxCharCount } from './char-count.component';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput />
      <cngx-char-count [max]="64" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput, CngxCharCount],
})
class TestHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'bio', maxLength: 64 }).accessor);
}

describe('CngxCharCount', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
  let countEl: HTMLElement;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    const mock = createMockField({ name: 'bio', maxLength: 64 });

    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.field.set(mock.accessor);
    fixture.detectChanges();
    TestBed.flushEffects();
    // afterNextRender needs a tick
    await fixture.whenStable();
    fixture.detectChanges();

    countEl = fixture.debugElement.query(By.directive(CngxCharCount)).nativeElement;
    inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
  });

  it('renders 0/64 initially', () => {
    expect(countEl.textContent?.trim()).toBe('0/64');
  });

  it('has aria-hidden=true', () => {
    expect(countEl.getAttribute('aria-hidden')).toBe('true');
  });

  it('updates count on input event', () => {
    inputEl.value = 'Hello';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(countEl.textContent?.trim()).toBe('5/64');
  });

  it('adds cngx-char-count--over class when over limit', () => {
    inputEl.value = 'x'.repeat(65);
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(countEl.classList.contains('cngx-char-count--over')).toBe(true);
  });

  it('does not add over class when at limit', () => {
    inputEl.value = 'x'.repeat(64);
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(countEl.classList.contains('cngx-char-count--over')).toBe(false);
  });

  it('renders nothing when no max or min', async () => {
    const mock = createMockField({ name: 'plain' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [NoLimitHost] });
    const fix = TestBed.createComponent(NoLimitHost);
    fix.componentInstance.field.set(mock.accessor);
    fix.detectChanges();
    TestBed.flushEffects();
    await fix.whenStable();
    fix.detectChanges();

    const el = fix.debugElement.query(By.directive(CngxCharCount)).nativeElement as HTMLElement;
    expect(el.textContent?.trim()).toBe('');
  });

  it('uses explicit [max] input', async () => {
    const mock = createMockField({ name: 'bio' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ExplicitMaxHost] });
    const fix = TestBed.createComponent(ExplicitMaxHost);
    fix.componentInstance.field.set(mock.accessor);
    fix.detectChanges();
    TestBed.flushEffects();
    await fix.whenStable();
    fix.detectChanges();

    const el = fix.debugElement.query(By.directive(CngxCharCount)).nativeElement as HTMLElement;
    expect(el.textContent?.trim()).toBe('0/100');
  });
});

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput />
      <cngx-char-count />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput, CngxCharCount],
})
class NoLimitHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'plain' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput />
      <cngx-char-count [max]="100" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput, CngxCharCount],
})
class ExplicitMaxHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'bio' }).accessor);
}
