import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

@Component({
  template: `<input [cngxAutofocus]="shouldFocus()" [autofocusDelay]="150" class="target" />`,
  imports: [CngxAutofocus],
})
class DelayedHost {
  readonly shouldFocus = signal(false);
}

describe('CngxAutofocus stale schedules', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [DelayedHost] });
  });

  it('a delayed timer re-checks when() and does not steal focus after it flips off', () => {
    const fixture = TestBed.createComponent(DelayedHost);
    fixture.detectChanges();
    vi.runAllTimers();

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      fixture.componentInstance.shouldFocus.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      // Condition flips off while the 150ms schedule is pending; the user
      // has moved on - the stale timer must not steal focus.
      fixture.componentInstance.shouldFocus.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      outside.focus();

      vi.runAllTimers();
      expect(document.activeElement).toBe(outside);
    } finally {
      outside.remove();
    }
  });
});
