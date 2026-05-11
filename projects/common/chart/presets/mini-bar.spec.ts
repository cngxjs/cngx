import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxMiniBar } from './mini-bar.component';

@Component({
  standalone: true,
  imports: [CngxMiniBar],
  template: `
    <cngx-mini-bar
      [value]="value()"
      [max]="max()"
      [min]="min()"
      [aria-label]="label()"
      data-testid="bar"
    />
  `,
})
class TestHost {
  value = signal<number>(50);
  max = signal<number>(100);
  min = signal<number>(0);
  label = signal<string | null>('Test bar');
}

describe('CngxMiniBar', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
    fill: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    const fill = host.querySelector('.cngx-mini-bar__fill') as HTMLElement;
    return { fixture, host, fill };
  }

  it('carries role="meter" with reactive ARIA value attributes', () => {
    const { host } = setup();
    expect(host.getAttribute('role')).toBe('meter');
    expect(host.getAttribute('aria-valuenow')).toBe('50');
    expect(host.getAttribute('aria-valuemin')).toBe('0');
    expect(host.getAttribute('aria-valuemax')).toBe('100');
    expect(host.getAttribute('aria-label')).toBe('Test bar');
  });

  it('sets the fill width to the value-as-percent of the range', () => {
    const { fill } = setup();
    expect(fill.style.width).toBe('50%');
  });

  it('clamps fills to [0, 100] when the value is outside [min, max]', () => {
    const { fixture, fill } = setup();
    fixture.componentInstance.value.set(150);
    fixture.detectChanges();
    expect(fill.style.width).toBe('100%');
    fixture.componentInstance.value.set(-50);
    fixture.detectChanges();
    expect(fill.style.width).toBe('0%');
  });

  it('updates ARIA attributes reactively as inputs change', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(75);
    fixture.componentInstance.max.set(200);
    fixture.detectChanges();
    expect(host.getAttribute('aria-valuenow')).toBe('75');
    expect(host.getAttribute('aria-valuemax')).toBe('200');
  });
});
