import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
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

@Component({
  template: `
    <span class="unlabelled-dot" cngxNavBadge variant="dot" [value]="1"></span>
    <span class="labelled-dot" cngxNavBadge variant="dot" [value]="1" ariaLabel="New"></span>
    <span class="empty-dot" cngxNavBadge variant="dot" [value]="0"></span>
    <span class="count" cngxNavBadge [value]="3">3</span>
  `,
  imports: [CngxNavBadge],
})
class WarnHost {}

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

  it('is aria-hidden without a label', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('stays aria-hidden and never carries aria-label when ariaLabel is set', () => {
    const { fixture, el, host } = setup();
    host.ariaLabel.set('5 unread');
    fixture.detectChanges();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('renders the label as a visually hidden next sibling', () => {
    const { fixture, el, host } = setup();
    host.ariaLabel.set('5 unread');
    fixture.detectChanges();
    const label = el.nextElementSibling as HTMLElement;
    expect(label.classList.contains('cngx-sr-only')).toBe(true);
    expect(label.textContent).toBe('5 unread');
  });

  it('updates the hidden label when ariaLabel changes', () => {
    const { fixture, el, host } = setup();
    host.ariaLabel.set('5 unread');
    fixture.detectChanges();
    host.ariaLabel.set('6 unread');
    fixture.detectChanges();
    expect(el.nextElementSibling?.textContent).toBe('6 unread');
  });

  it('empties the hidden label while the badge is empty', () => {
    const { fixture, el, host } = setup();
    host.ariaLabel.set('5 unread');
    fixture.detectChanges();
    host.value.set(0);
    fixture.detectChanges();
    expect(el.nextElementSibling?.textContent).toBe('');
  });

  it('removes the hidden label when the badge is destroyed', () => {
    const { fixture, el } = setup();
    const parent = el.parentElement as HTMLElement;
    expect(parent.querySelectorAll('.cngx-sr-only').length).toBe(1);
    fixture.destroy();
    expect(parent.querySelectorAll('.cngx-sr-only').length).toBe(0);
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

  it('warns once, for the visible dot without a label only', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(WarnHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const warnings = warnSpy.mock.calls.filter((call) => /^CNGX1083: /.test(String(call[0])));
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain(fixture.nativeElement.querySelector('.unlabelled-dot'));
    warnSpy.mockRestore();
  });
});
