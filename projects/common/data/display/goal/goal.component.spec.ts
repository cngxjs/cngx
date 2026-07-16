import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxGoal } from './goal.component';

@Component({
  template: `<cngx-goal [value]="value()" [max]="max()" [valueTextFormat]="fmt()" />`,
  imports: [CngxGoal],
})
class TestHost {
  value = signal(73);
  max = signal(100);
  fmt = signal<((now: number, max: number) => string) | undefined>(undefined);
}

describe('CngxGoal', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('cngx-goal');
    return { fixture, el, host: fixture.componentInstance };
  }

  it('exposes the progressbar value set', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('73');
  });

  it('clamps aria-valuenow into [0, max]', () => {
    const { fixture, el, host } = setup();
    host.value.set(140);
    fixture.detectChanges();
    expect(el.getAttribute('aria-valuenow')).toBe('100');

    host.value.set(-20);
    fixture.detectChanges();
    expect(el.getAttribute('aria-valuenow')).toBe('0');
  });

  it('drives the fill width from the clamped percent', () => {
    const { el } = setup();
    expect(el.style.getPropertyValue('--cngx-goal-fill')).toBe('73%');
  });

  it('defaults aria-valuetext to "now of max"', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-valuetext')).toBe('73 of 100');
  });

  it('uses the valueTextFormat closure when supplied', () => {
    const { fixture, el, host } = setup();
    host.fmt.set((now, max) => `${now} of ${max}, ${Math.round((now / max) * 100)}% of quota`);
    fixture.detectChanges();
    expect(el.getAttribute('aria-valuetext')).toBe('73 of 100, 73% of quota');
  });

  it('reports 0% fill and clamps when max is 0', () => {
    const { fixture, el, host } = setup();
    host.max.set(0);
    fixture.detectChanges();
    expect(el.getAttribute('aria-valuemax')).toBe('0');
    expect(el.getAttribute('aria-valuenow')).toBe('0');
    expect(el.style.getPropertyValue('--cngx-goal-fill')).toBe('0%');
  });
});
