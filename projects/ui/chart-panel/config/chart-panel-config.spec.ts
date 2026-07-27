import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxChartPanel } from '../chart-panel.component';
import { CNGX_CHART_PANEL_DEFAULTS } from './chart-panel.config.defaults';
import {
  withChartPanelAriaLabels,
  withChartPanelLegendPosition,
  withChartPanelLoadingTreatment,
} from './features';
import { injectChartPanelConfig } from './inject-chart-panel-config';
import { provideChartPanelConfig, provideChartPanelConfigAt } from './provide-chart-panel-config';

describe('CNGX_CHART_PANEL_CONFIG cascade', () => {
  function read() {
    return TestBed.runInInjectionContext(() => injectChartPanelConfig());
  }

  it('exposes the English library defaults without any provider', () => {
    expect(read()).toEqual({
      ariaLabels: { busy: 'Updating' },
      legendPosition: 'bottom',
      loadingTreatment: 'auto',
    });
  });

  it('keeps the defaults reference intact for an empty provider call', () => {
    TestBed.configureTestingModule({ providers: [provideChartPanelConfig()] });
    expect(read()).toBe(CNGX_CHART_PANEL_DEFAULTS);
  });

  it('overrides one scalar without disturbing the others', () => {
    TestBed.configureTestingModule({
      providers: [provideChartPanelConfig(withChartPanelLegendPosition('top'))],
    });
    const cfg = read();
    expect(cfg.legendPosition).toBe('top');
    expect(cfg.loadingTreatment).toBe('auto');
    expect(cfg.ariaLabels?.busy).toBe('Updating');
  });

  it('deep-merges a partial ariaLabels override', () => {
    TestBed.configureTestingModule({
      providers: [
        provideChartPanelConfig(
          withChartPanelAriaLabels({ busy: 'Aktualisiert' }),
          withChartPanelLoadingTreatment('spinner'),
        ),
      ],
    });
    expect(read().ariaLabels?.busy).toBe('Aktualisiert');
    expect(read().loadingTreatment).toBe('spinner');
  });
});

@Component({
  standalone: true,
  imports: [CngxChartPanel],
  viewProviders: [provideChartPanelConfigAt(withChartPanelLegendPosition('none'))],
  template: `<cngx-chart-panel />`,
})
class ScopedHost {}

@Component({
  standalone: true,
  imports: [CngxChartPanel],
  viewProviders: [provideChartPanelConfigAt(withChartPanelLegendPosition('none'))],
  template: `<cngx-chart-panel legendPosition="top" />`,
})
class ScopedHostWithInput {}

describe('chart-panel config resolution order', () => {
  it('layers provideChartPanelConfigAt on top of the root cascade', () => {
    TestBed.configureTestingModule({
      imports: [ScopedHost],
      providers: [provideChartPanelConfig(withChartPanelLegendPosition('top'))],
    });
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('cngx-chart-panel');
    expect(panel.getAttribute('data-legend')).toBe('none');
  });

  it('gives a per-instance input precedence over both provider levels', () => {
    TestBed.configureTestingModule({
      imports: [ScopedHostWithInput],
      providers: [provideChartPanelConfig(withChartPanelLegendPosition('bottom'))],
    });
    const fixture = TestBed.createComponent(ScopedHostWithInput);
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('cngx-chart-panel');
    expect(panel.getAttribute('data-legend')).toBe('top');
  });
});
