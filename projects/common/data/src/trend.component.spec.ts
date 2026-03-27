import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxTrend } from './trend.component';

@Component({
  template: `<cngx-trend [value]="value()" [label]="label()" />`,
  imports: [CngxTrend],
})
class TestHost {
  value = signal(5.3);
  label = signal<string | undefined>(undefined);
}

describe('CngxTrend', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('cngx-trend');
    return { fixture, el, host: fixture.componentInstance };
  }

  it('shows up arrow and positive class for positive value', () => {
    const { el } = setup();
    expect(el.textContent).toContain('\u2191');
    expect(el.textContent).toContain('+5.3');
    expect(el.classList.contains('cngx-trend--up')).toBe(true);
  });

  it('shows down arrow and negative class for negative value', () => {
    const { fixture, el, host } = setup();
    host.value.set(-2.1);
    fixture.detectChanges();
    expect(el.textContent).toContain('\u2193');
    expect(el.classList.contains('cngx-trend--down')).toBe(true);
  });

  it('shows right arrow for zero', () => {
    const { fixture, el, host } = setup();
    host.value.set(0);
    fixture.detectChanges();
    expect(el.textContent).toContain('\u2192');
    expect(el.classList.contains('cngx-trend--up')).toBe(false);
    expect(el.classList.contains('cngx-trend--down')).toBe(false);
  });

  it('uses consumer label override for aria-label', () => {
    const { fixture, el, host } = setup();
    host.label.set('+5.3% vs. last month');
    fixture.detectChanges();
    expect(el.getAttribute('aria-label')).toBe('+5.3% vs. last month');
  });

  it('generates default aria-label when no override', () => {
    const { el } = setup();
    const label = el.getAttribute('aria-label')!;
    expect(label).toContain('+5.3');
    expect(label).toContain('up');
  });
});
