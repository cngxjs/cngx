import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
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

/**
 * Flush pending afterNextRender callbacks + microtasks.
 * detectChanges() triggers the render, setTimeout(0) lets afterNextRender fire.
 */
async function flushRender(fixture: { detectChanges(): void }): Promise<void> {
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('CngxAutofocus', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost, ConditionalHost] }));

  it('focuses element when inserted into DOM', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    fixture.componentInstance.showInput.set(true);
    await flushRender(fixture);

    const input = fixture.debugElement.query(By.css('.target'));
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input.nativeElement);
  });

  it('focuses when condition changes to true', async () => {
    const fixture = TestBed.createComponent(ConditionalHost);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const input = fixture.debugElement.query(By.css('.target'));
    expect(document.activeElement).not.toBe(input.nativeElement);

    fixture.componentInstance.shouldFocus.set(true);
    await flushRender(fixture);

    expect(document.activeElement).toBe(input.nativeElement);
  });

  it('does not focus when condition is false', async () => {
    const fixture = TestBed.createComponent(ConditionalHost);
    await flushRender(fixture);

    const input = fixture.debugElement.query(By.css('.target'));
    expect(document.activeElement).not.toBe(input.nativeElement);
  });
});
