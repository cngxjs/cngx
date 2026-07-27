import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxChartPanel } from './chart-panel.component';
import {
  CngxChartPanelActions,
  CngxChartPanelFooter,
  CngxChartPanelSubtitle,
  CngxChartPanelTitle,
} from './chart-panel-slots';

@Component({
  standalone: true,
  imports: [
    CngxChartPanel,
    CngxChartPanelTitle,
    CngxChartPanelSubtitle,
    CngxChartPanelActions,
    CngxChartPanelFooter,
  ],
  template: `
    <cngx-chart-panel>
      @if (showTitle()) {
        <h3 cngxChartPanelTitle>Revenue by quarter</h3>
      }
      <span cngxChartPanelSubtitle>EUR, net</span>
      <button cngxChartPanelActions type="button">Refresh</button>

      <div class="fake-chart">chart body</div>

      <small cngxChartPanelFooter>Source: warehouse</small>
    </cngx-chart-panel>
  `,
})
class TestHost {
  showTitle = signal(true);
}

describe('CngxChartPanel', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('cngx-chart-panel');
    return { fixture, panel, host: fixture.componentInstance };
  }

  it('names the region from the projected title slot', () => {
    const { panel } = setup();
    const titleId = panel.querySelector('[cngxChartPanelTitle]')!.id;

    expect(titleId).toBeTruthy();
    expect(panel.getAttribute('role')).toBe('group');
    expect(panel.getAttribute('aria-labelledby')).toBe(titleId);
  });

  it('leaves the region unnamed rather than pointing at a missing id', () => {
    const { fixture, panel, host } = setup();
    host.showTitle.set(false);
    fixture.detectChanges();

    expect(panel.querySelector('[cngxChartPanelTitle]')).toBeNull();
    expect(panel.getAttribute('aria-labelledby')).toBeNull();
  });

  it('projects subtitle, actions and footer into their own slots', () => {
    const { panel } = setup();
    expect(panel.querySelector('.cngx-chart-panel__subtitle')!.textContent).toContain('EUR, net');
    expect(panel.querySelector('.cngx-chart-panel__actions')!.textContent).toContain('Refresh');
    expect(panel.querySelector('.cngx-chart-panel__footer')!.textContent).toContain('warehouse');
  });

  it('places the chart body in the body slot, between header and footer', () => {
    const { panel } = setup();
    const body = panel.querySelector('.cngx-chart-panel__body')!;
    expect(body.textContent).toContain('chart body');

    // The header must precede the body in DOM order so tab order reaches the
    // actions before the chart.
    const header = panel.querySelector('.cngx-chart-panel__header')!;
    expect(header.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not duplicate the chart async envelope', () => {
    const { panel } = setup();
    // The panel owns no view switch: no skeleton, empty or error body of its
    // own. Whatever the projected chart renders is what shows.
    expect(panel.querySelector('[class*="skeleton"]')).toBeNull();
    expect(panel.querySelector('[class*="empty"]')).toBeNull();
    expect(panel.querySelector('[class*="error"]')).toBeNull();
  });
});
