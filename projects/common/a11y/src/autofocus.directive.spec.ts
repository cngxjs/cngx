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
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost, ConditionalHost] }));

  it('focuses element when inserted into DOM', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    fixture.componentInstance.showInput.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.debugElement.query(By.css('.target'));
    expect(input).toBeTruthy();
    // Focus is applied via afterNextRender — may need a microtask
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(input.nativeElement);
  });

  it('focuses when condition changes to true', async () => {
    const fixture = TestBed.createComponent(ConditionalHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.debugElement.query(By.css('.target'));
    expect(document.activeElement).not.toBe(input.nativeElement);

    fixture.componentInstance.shouldFocus.set(true);
    TestBed.flushEffects();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(input.nativeElement);
  });

  it('does not focus when condition is false', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ConditionalHost);
    fixture.detectChanges();
    vi.runAllTimers();
    await fixture.whenStable();

    const input = fixture.debugElement.query(By.css('.target'));
    expect(document.activeElement).not.toBe(input.nativeElement);
    vi.useRealTimers();
  });
});
