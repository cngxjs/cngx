import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxPasteTransform } from './paste-transform.directive';

const STRIP_NON_DIGITS = (s: string) => s.replace(/\D/g, '');

@Component({
  template: `<input [cngxPasteTransform]="transform" />`,
  imports: [CngxPasteTransform],
})
class Host {
  readonly transform = STRIP_NON_DIGITS;
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, input };
}

function paste(input: HTMLInputElement, text: string): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
  input.dispatchEvent(event);
  return event;
}

describe('CngxPasteTransform', () => {
  it('transforms the pasted text, cancels the native paste, and re-emits input', () => {
    const { input } = setup();
    const onInput = vi.fn();
    input.addEventListener('input', onInput);
    const event = paste(input, ' 12-34 ab56 ');
    expect(event.defaultPrevented).toBe(true);
    expect(input.value).toBe('123456');
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it('inserts at the caret, replacing the current selection', () => {
    const { input } = setup();
    input.value = 'AB';
    input.setSelectionRange(1, 1); // caret between A and B
    paste(input, '9x9');
    expect(input.value).toBe('A99B');
  });

  it('does nothing when the event carries no clipboardData', () => {
    const { input } = setup();
    const event = new Event('paste', { bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
