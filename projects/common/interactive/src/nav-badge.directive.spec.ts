import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxNavBadge } from './nav-badge.directive';

@Component({
  template: `<span cngxNavBadge [value]="value()" [variant]="variant()" [ariaLabel]="ariaLabel()">
    {{ value() }}
  </span>`,
  imports: [CngxNavBadge],
})
class TestHost {
  value = signal<string | number | null | undefined>(5);
  variant = signal<'count' | 'dot' | 'status'>('count');
  ariaLabel = signal<string | undefined>(undefined);
}

describe('CngxNavBadge', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxNavBadge)).nativeElement as HTMLElement;
    const dir = fixture.debugElement.query(By.directive(CngxNavBadge)).injector.get(CngxNavBadge);
    return { fixture, el, dir, host: fixture.componentInstance };
  }

  it('has cngx-nav-badge class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-nav-badge')).toBe(true);
  });

  it('applies variant class', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-nav-badge--count')).toBe(true);
  });

  it('switches variant class', () => {
    const { fixture, el, host } = setup();
    host.variant.set('dot');
    fixture.detectChanges();
    expect(el.classList.contains('cngx-nav-badge--dot')).toBe(true);
    expect(el.classList.contains('cngx-nav-badge--count')).toBe(false);
  });

  it('is aria-hidden by default (decorative)', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('removes aria-hidden when ariaLabel is provided', () => {
    const { fixture, el, host } = setup();
    host.ariaLabel.set('5 unread');
    fixture.detectChanges();
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.getAttribute('aria-label')).toBe('5 unread');
  });

  it('adds hidden class when value is 0', () => {
    const { fixture, el, host } = setup();
    host.value.set(0);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-nav-badge--hidden')).toBe(true);
  });

  it('adds hidden class when value is null', () => {
    const { fixture, el, host } = setup();
    host.value.set(null);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-nav-badge--hidden')).toBe(true);
  });

  it('is not hidden when value is non-zero', () => {
    const { el } = setup();
    expect(el.classList.contains('cngx-nav-badge--hidden')).toBe(false);
  });

  it('isEmpty is true for empty string', () => {
    const { fixture, dir, host } = setup();
    host.value.set('');
    fixture.detectChanges();
    expect(dir.isEmpty()).toBe(true);
  });
});
