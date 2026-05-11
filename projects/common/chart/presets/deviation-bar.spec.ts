import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxDeviationBar } from './deviation-bar.component';

@Component({
  standalone: true,
  imports: [CngxDeviationBar],
  template: `
    <cngx-deviation-bar
      [value]="value()"
      [baseline]="baseline()"
      [magnitude]="magnitude()"
      data-testid="bar"
    />
  `,
})
class TestHost {
  value = signal<number>(20);
  baseline = signal<number>(0);
  magnitude = signal<number>(100);
}

describe('CngxDeviationBar', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="bar"]') as HTMLElement;
    return { fixture, host };
  }

  it('renders a positive fill anchored at the baseline (50%)', () => {
    const { host } = setup();
    const fill = host.querySelector('.cngx-deviation-bar__fill') as HTMLElement;
    expect(fill.classList.contains('cngx-deviation-bar__fill--positive')).toBe(true);
    expect(fill.style.left).toBe('50%');
    expect(fill.style.width).toBe('10%'); // 20 / 100 * 50 = 10
  });

  it('renders a negative fill to the left of the baseline', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(-30);
    fixture.detectChanges();
    const fill = host.querySelector('.cngx-deviation-bar__fill') as HTMLElement;
    expect(fill.classList.contains('cngx-deviation-bar__fill--negative')).toBe(true);
    expect(fill.style.left).toBe('35%'); // 50 - 30/100 * 50 = 35
    expect(fill.style.width).toBe('15%');
  });

  it('renders no fill when the value equals the baseline', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(0);
    fixture.detectChanges();
    const fill = host.querySelector('.cngx-deviation-bar__fill');
    expect(fill).toBeNull();
  });

  it('clamps the fill width when the deviation exceeds the magnitude', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.value.set(500);
    fixture.detectChanges();
    const fill = host.querySelector('.cngx-deviation-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('exposes role="meter" with min=-magnitude and max=+magnitude', () => {
    const { host } = setup();
    expect(host.getAttribute('role')).toBe('meter');
    expect(host.getAttribute('aria-valuenow')).toBe('20');
    expect(host.getAttribute('aria-valuemin')).toBe('-100');
    expect(host.getAttribute('aria-valuemax')).toBe('100');
  });
});
