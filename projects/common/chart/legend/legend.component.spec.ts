import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxChartLegend, type CngxChartLegendItem } from './legend.component';

@Component({
  standalone: true,
  imports: [CngxChartLegend],
  template: `<cngx-chart-legend [items]="items()" data-testid="legend" />`,
})
class TestHost {
  items = signal<readonly CngxChartLegendItem[]>([]);
}

describe('CngxChartLegend', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    legend: HTMLElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const legend = fixture.nativeElement.querySelector('[data-testid="legend"]') as HTMLElement;
    return { fixture, legend };
  }

  it('renders the value node with its text when value is present', () => {
    const { fixture, legend } = setup();
    fixture.componentInstance.items.set([{ label: 'Traffic', value: 100 }]);
    fixture.detectChanges();
    const value = legend.querySelector('.cngx-chart-legend__value') as HTMLElement;
    expect(value).not.toBeNull();
    expect(value.textContent?.trim()).toBe('100');
  });

  it('still renders the value node for a literal 0 (guard is != null, not truthiness)', () => {
    const { fixture, legend } = setup();
    fixture.componentInstance.items.set([{ label: 'Errors', value: 0 }]);
    fixture.detectChanges();
    const value = legend.querySelector('.cngx-chart-legend__value') as HTMLElement;
    expect(value).not.toBeNull();
    expect(value.textContent?.trim()).toBe('0');
  });

  it('renders no value node when value is absent', () => {
    const { fixture, legend } = setup();
    fixture.componentInstance.items.set([{ label: 'Traffic', color: '#3b82f6' }]);
    fixture.detectChanges();
    expect(legend.querySelector('.cngx-chart-legend__value')).toBeNull();
    expect(legend.querySelector('.cngx-chart-legend__label')?.textContent?.trim()).toBe('Traffic');
  });
});
