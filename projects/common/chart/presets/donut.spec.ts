import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxDonut } from './donut.component';

@Component({
  standalone: true,
  imports: [CngxDonut],
  template: `
    <cngx-donut
      [value]="value()"
      [max]="max()"
      [size]="48"
      [thickness]="6"
      [aria-label]="ariaLabel()"
      [label]="centreLabel()"
      data-testid="donut"
    />
  `,
})
class TestHost {
  value = signal<number>(75);
  max = signal<number>(100);
  ariaLabel = signal<string | null>('Score');
  centreLabel = signal<string | null>(null);
}

describe('CngxDonut', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    host: HTMLElement;
    fill: SVGCircleElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('[data-testid="donut"]') as HTMLElement;
    const fill = host.querySelector('.cngx-donut__fill') as unknown as SVGCircleElement;
    return { fixture, host, fill };
  }

  it('exposes role="meter" with reactive ARIA value attributes', () => {
    const { host } = setup();
    expect(host.getAttribute('role')).toBe('meter');
    expect(host.getAttribute('aria-valuenow')).toBe('75');
    expect(host.getAttribute('aria-valuemin')).toBe('0');
    expect(host.getAttribute('aria-valuemax')).toBe('100');
    expect(host.getAttribute('aria-label')).toBe('Score');
  });

  it('computes a stroke-dashoffset proportional to (1 - value/max)', () => {
    const { fill } = setup();
    const dasharray = fill.getAttribute('stroke-dasharray') ?? '';
    const dashoffset = Number(fill.getAttribute('stroke-dashoffset') ?? '0');
    const [c] = dasharray.split(' ').map(Number);
    // 75/100 fill -> 25% offset of circumference
    expect(dashoffset / c).toBeCloseTo(0.25, 5);
  });

  it('clamps the offset when value exceeds max', () => {
    const { fixture, fill } = setup();
    fixture.componentInstance.value.set(200);
    fixture.detectChanges();
    expect(Number(fill.getAttribute('stroke-dashoffset') ?? '0')).toBe(0);
  });

  it('shows the full track (offset = circumference) when value is 0', () => {
    const { fixture, fill } = setup();
    fixture.componentInstance.value.set(0);
    fixture.detectChanges();
    const dasharray = fill.getAttribute('stroke-dasharray') ?? '';
    const dashoffset = Number(fill.getAttribute('stroke-dashoffset') ?? '0');
    const [c] = dasharray.split(' ').map(Number);
    expect(dashoffset).toBeCloseTo(c, 5);
  });

  it('renders the [label] inside the centre when set', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.centreLabel.set('99%');
    fixture.detectChanges();
    expect(host.querySelector('.cngx-donut__label')?.textContent?.trim()).toBe('99%');
  });
});
