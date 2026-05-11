import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxChartLegend, type CngxChartLegendItem } from './legend.component';

@Component({
  standalone: true,
  imports: [CngxChartLegend],
  template: `
    <cngx-chart-legend
      [items]="items()"
      [orientation]="orientation()"
      [align]="align()"
      data-testid="legend"
    />
  `,
})
class TestHost {
  items = signal<readonly CngxChartLegendItem[]>([
    { label: 'Traffic', color: '#3b82f6' },
    { label: 'Errors', color: '#d2452f' },
  ]);
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  align = signal<'start' | 'center' | 'end'>('start');
}

describe('CngxChartLegend', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const legend = fixture.nativeElement.querySelector(
      '[data-testid="legend"]',
    ) as HTMLElement;
    return { fixture, legend };
  }

  it('renders one item per items entry with role="listitem" and the label text', () => {
    const { legend } = setup();
    const items = Array.from(legend.querySelectorAll('[role="listitem"]'));
    expect(items.length).toBe(2);
    expect(items[0].textContent?.trim()).toBe('Traffic');
    expect(items[1].textContent?.trim()).toBe('Errors');
  });

  it('paints the swatch with the entry color via inline background style', () => {
    const { legend } = setup();
    const swatches = Array.from(
      legend.querySelectorAll<HTMLElement>('.cngx-chart-legend__swatch'),
    );
    expect(swatches[0].style.background).toBe('rgb(59, 130, 246)');
    expect(swatches[1].style.background).toBe('rgb(210, 69, 47)');
  });

  it('flips to a vertical layout when [orientation]="vertical"', () => {
    const { fixture, legend } = setup();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    expect(legend.classList.contains('cngx-chart-legend--vertical')).toBe(true);
  });

  it('reflects the align input in the host justify-content style', () => {
    const { fixture, legend } = setup();
    fixture.componentInstance.align.set('center');
    fixture.detectChanges();
    expect(legend.style.justifyContent).toBe('center');
    fixture.componentInstance.align.set('end');
    fixture.detectChanges();
    expect(legend.style.justifyContent).toBe('flex-end');
  });

  it('omits the swatch background style when an entry has no color', () => {
    const { fixture, legend } = setup();
    fixture.componentInstance.items.set([{ label: 'Generic' }]);
    fixture.detectChanges();
    const swatch = legend.querySelector<HTMLElement>('.cngx-chart-legend__swatch');
    expect(swatch?.style.background).toBe('');
  });

  it('host carries role="list"', () => {
    const { legend } = setup();
    expect(legend.getAttribute('role')).toBe('list');
  });
});
