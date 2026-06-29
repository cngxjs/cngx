import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxSuffix } from './suffix.directive';

@Component({
  template: `<button cngxSuffix [cngxSuffixInteractive]="interactive()">x</button>`,
  imports: [CngxSuffix],
})
class Host {
  readonly interactive = signal(false);
}

function setup(interactive = false) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.interactive.set(interactive);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('[cngxSuffix]') as HTMLElement;
  return { fixture, el };
}

describe('CngxSuffix', () => {
  it('carries the styling-hook class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-field-suffix')).toBe(true);
  });

  it('is aria-hidden by default (decorative)', () => {
    const { el } = setup(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('drops aria-hidden and marks interactive for a real control', () => {
    const { el } = setup(true);
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.classList.contains('cngx-field-affix--interactive')).toBe(true);
  });
});
