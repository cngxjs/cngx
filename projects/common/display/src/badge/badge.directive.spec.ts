import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBadge } from './badge.directive';

@Component({
  template: `
    <button
      type="button"
      [cngxBadge]="value()"
      [color]="color()"
      [position]="position()"
      [hidden]="hidden()"
      [max]="max()"
    >
      Inbox
    </button>
  `,
  imports: [CngxBadge],
})
class BadgeHost {
  readonly value = signal<number | string | boolean>(3);
  readonly color = signal<'primary' | 'error' | 'warning' | 'neutral'>('primary');
  readonly position = signal<
    'inline' | 'above-start' | 'above-end' | 'below-start' | 'below-end'
  >('above-end');
  readonly hidden = signal(false);
  readonly max = signal(99);
}

describe('CngxBadge', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [BadgeHost] }));

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<BadgeHost>>;
    hostEl: HTMLElement;
    dir: CngxBadge;
  } {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(CngxBadge));
    return {
      fixture,
      hostEl: debugEl.nativeElement as HTMLElement,
      dir: debugEl.injector.get(CngxBadge),
    };
  }

  it('renders displayValue for numeric value', () => {
    const { dir } = setup();
    expect(dir.displayValue()).toBe('3');
    expect(dir.isDotMode()).toBe(false);
  });

  it('renders "99+" when value exceeds max', () => {
    const { fixture, dir } = setup();
    fixture.componentInstance.value.set(250);
    fixture.componentInstance.max.set(99);
    fixture.detectChanges();
    expect(dir.displayValue()).toBe('99+');
  });

  it('renders string value verbatim', () => {
    const { fixture, dir } = setup();
    fixture.componentInstance.value.set('NEW');
    fixture.detectChanges();
    expect(dir.displayValue()).toBe('NEW');
  });

  it('renders dot mode when value is boolean true', () => {
    const { fixture, dir } = setup();
    fixture.componentInstance.value.set(true);
    fixture.detectChanges();
    expect(dir.displayValue()).toBeNull();
    expect(dir.isDotMode()).toBe(true);
  });

  it('hides the badge when value is 0', () => {
    const { fixture, dir } = setup();
    fixture.componentInstance.value.set(0);
    fixture.detectChanges();
    expect(dir.isEmpty()).toBe(true);
  });

  it('hides the badge when hidden() is true', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    const badgeEl = hostEl.querySelector('.cngx-badge-indicator');
    expect(badgeEl).toBeNull();
  });

  it('renders a badge element as a DOM child with aria-hidden', () => {
    const { hostEl } = setup();
    const badgeEl = hostEl.querySelector('.cngx-badge-indicator');
    expect(badgeEl).not.toBeNull();
    expect(badgeEl?.getAttribute('aria-hidden')).toBe('true');
    expect(badgeEl?.textContent).toBe('3');
  });

  it('applies color modifier class', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.color.set('error');
    fixture.detectChanges();
    TestBed.flushEffects();
    const badgeEl = hostEl.querySelector('.cngx-badge-indicator');
    expect(badgeEl?.classList.contains('cngx-badge-indicator--error')).toBe(true);
  });

  it('applies position modifier class', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.position.set('below-start');
    fixture.detectChanges();
    TestBed.flushEffects();
    const badgeEl = hostEl.querySelector('.cngx-badge-indicator');
    expect(badgeEl?.classList.contains('cngx-badge-indicator--below-start')).toBe(true);
  });
});
