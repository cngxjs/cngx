import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxTrim } from './trim.directive';

@Component({
  template: `<input cngxTrim [cngxTrimCollapse]="collapse()" />`,
  imports: [CngxTrim],
})
class Host {
  readonly collapse = signal(false);
}

function setup(collapse = false) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.collapse.set(collapse);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, input };
}

function blur(input: HTMLInputElement): void {
  input.dispatchEvent(new FocusEvent('blur'));
}

describe('CngxTrim', () => {
  it('trims leading and trailing whitespace on blur and re-emits input', () => {
    const { input } = setup();
    const onInput = vi.fn();
    input.addEventListener('input', onInput);
    input.value = '  hello  ';
    blur(input);
    expect(input.value).toBe('hello');
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it('NFC-normalizes a decomposed sequence', () => {
    const { input } = setup();
    input.value = 'café'; // 'e' + combining acute accent (decomposed, length 5)
    expect(input.value.length).toBe(5);
    blur(input);
    expect(input.value).toBe('café'); // precomposed e-acute (length 4)
    expect(input.value.length).toBe(4);
  });

  it('does not collapse internal whitespace by default', () => {
    const { input } = setup(false);
    input.value = 'a   b';
    blur(input);
    expect(input.value).toBe('a   b');
  });

  it('collapses internal whitespace runs when enabled', () => {
    const { input } = setup(true);
    input.value = '  a   b\t\tc  ';
    blur(input);
    expect(input.value).toBe('a b c');
  });

  it('does not re-emit input when the value is already normalized', () => {
    const { input } = setup();
    const onInput = vi.fn();
    input.value = 'clean';
    input.addEventListener('input', onInput);
    blur(input);
    expect(onInput).not.toHaveBeenCalled();
  });
});
