import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxPrefix } from './prefix.directive';

@Component({
  template: `<span cngxPrefix [cngxPrefixInteractive]="interactive()">$</span>`,
  imports: [CngxPrefix],
})
class Host {
  readonly interactive = signal(false);
}

function setup(interactive = false) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.interactive.set(interactive);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('[cngxPrefix]') as HTMLElement;
  return { fixture, el };
}

describe('CngxPrefix', () => {
  it('carries the styling-hook class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-field-prefix')).toBe(true);
  });

  it('is aria-hidden by default (decorative)', () => {
    const { el } = setup(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.classList.contains('cngx-field-affix--interactive')).toBe(false);
  });

  it('drops aria-hidden and marks interactive when interactive', () => {
    const { el } = setup(true);
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.classList.contains('cngx-field-affix--interactive')).toBe(true);
  });

  it('reacts to the interactive flag changing', () => {
    const { fixture, el } = setup(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    fixture.componentInstance.interactive.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });
});
