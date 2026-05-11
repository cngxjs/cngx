import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxStackedBar, type CngxStackedSegment } from './stacked-bar.component';

@Component({
  standalone: true,
  imports: [CngxStackedBar],
  template: `
    <cngx-stacked-bar
      [segments]="segments()"
      [total]="total()"
      data-testid="bar"
    />
  `,
})
class TestHost {
  segments = signal<readonly CngxStackedSegment[]>([
    { value: 25, label: 'A', color: '#a' },
    { value: 50, label: 'B', color: '#b' },
    { value: 25, label: 'C', color: '#c' },
  ]);
  total = signal<number | null>(null);
}

describe('CngxStackedBar', () => {
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

  it('renders one segment per [segments] entry', () => {
    const { host } = setup();
    const segs = host.querySelectorAll('.cngx-stacked-bar__segment');
    expect(segs.length).toBe(3);
  });

  it('lays out segments in proportional widths summing to 100% of the track', () => {
    const { host } = setup();
    const segs = Array.from(
      host.querySelectorAll<HTMLElement>('.cngx-stacked-bar__segment'),
    );
    const widths = segs.map((s) => parseFloat(s.style.width));
    expect(widths).toEqual([25, 50, 25]);
  });

  it('honours an explicit [total] over the segment-sum default', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.total.set(200);
    fixture.detectChanges();
    const segs = Array.from(
      host.querySelectorAll<HTMLElement>('.cngx-stacked-bar__segment'),
    );
    const widths = segs.map((s) => parseFloat(s.style.width));
    expect(widths).toEqual([12.5, 25, 12.5]);
  });

  it('builds an aria-label that enumerates segments and total', () => {
    const { host } = setup();
    const label = host.getAttribute('aria-label') ?? '';
    expect(label).toContain('Total 100');
    expect(label).toContain('A: 25');
    expect(label).toContain('B: 50');
    expect(label).toContain('C: 25');
  });
});
