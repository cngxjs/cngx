import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxAutofocus } from './autofocus.directive';

@Component({
  template: `
    @if (showInput()) {
      <input [cngxAutofocus]="true" class="target" />
    }
  `,
  imports: [CngxAutofocus],
})
class TestHost {
  readonly showInput = signal(false);
}

@Component({
  template: ` <input [cngxAutofocus]="shouldFocus()" class="target" /> `,
  imports: [CngxAutofocus],
})
class ConditionalHost {
  readonly shouldFocus = signal(false);
}

describe('CngxAutofocus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [TestHost, ConditionalHost] });
  });

  afterEach(() => vi.useRealTimers());

  it('focuses element when inserted into DOM', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    fixture.componentInstance.showInput.set(true);
    fixture.detectChanges();
    vi.runAllTimers();
    fixture.detectChanges();
    vi.runAllTimers();

    const input = fixture.debugElement.query(By.css('.target'));
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input.nativeElement);
  });

  it('focuses when condition changes to true', () => {
    const fixture = TestBed.createComponent(ConditionalHost);
    fixture.detectChanges();
    vi.runAllTimers();

    const input = fixture.debugElement.query(By.css('.target'));
    expect(document.activeElement).not.toBe(input.nativeElement);

    fixture.componentInstance.shouldFocus.set(true);
    fixture.detectChanges();
    vi.runAllTimers();
    fixture.detectChanges();
    vi.runAllTimers();

    expect(document.activeElement).toBe(input.nativeElement);
  });

  it('does not focus when condition is false', () => {
    const fixture = TestBed.createComponent(ConditionalHost);
    fixture.detectChanges();
    vi.runAllTimers();

    const input = fixture.debugElement.query(By.css('.target'));
    expect(document.activeElement).not.toBe(input.nativeElement);
  });
});
