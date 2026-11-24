import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { CngxCopyText } from './copy-text.directive';

// Runs in a real Chromium (the `test-geometry` target): the execCommand
// fallback selects an offscreen textarea, which moves focus in a real engine.
// `supported` is read once at construction, so the Clipboard API is hidden
// before the fixture is created.

@Component({
  standalone: true,
  imports: [CngxCopyText],
  template: `
    <input type="text" aria-label="Other field" />
    <button type="button" [cngxCopyText]="'npm i @cngx/common'">Copy</button>
  `,
})
class FallbackHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): { button: HTMLButtonElement; other: HTMLInputElement; dir: CngxCopyText } {
  const fixture = TestBed.createComponent(FallbackHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const debugButton = fixture.debugElement.query(By.directive(CngxCopyText));
  return {
    button: debugButton.nativeElement as HTMLButtonElement,
    other: mountedRoot.querySelector('input') as HTMLInputElement,
    dir: debugButton.injector.get(CngxCopyText),
  };
}

describe('CngxCopyText execCommand fallback focus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
    // The own property shadows Navigator.prototype.clipboard; removing it
    // brings the engine's Clipboard API back for the next spec.
    delete (navigator as unknown as Record<string, unknown>)['clipboard'];
  });

  it('returns focus to the button after a click copy', async () => {
    const { button, dir } = mount();
    expect(dir.supported).toBe(false);
    button.focus();

    await userEvent.click(button);

    expect(document.activeElement).toBe(button);
    expect(document.body.querySelector('textarea')).toBeNull();
  });

  it('keeps focus on the element that had it for a programmatic copy', async () => {
    const { other, dir } = mount();
    other.focus();

    await dir.copy();

    expect(document.activeElement).toBe(other);
  });
});
