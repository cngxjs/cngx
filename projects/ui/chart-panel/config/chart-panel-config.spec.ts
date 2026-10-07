import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';

import { CngxChartPanel } from '../chart-panel.component';
import type { CngxChartPanelAriaLabels } from './chart-panel.config';
import { CNGX_CHART_PANEL_LANGUAGE_EN } from '../i18n/chart-panel-language-section';
import { CNGX_CHART_PANEL_DEFAULTS } from './chart-panel.config.defaults';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['chartPanel'] = CNGX_CHART_PANEL_LANGUAGE_EN;
import { withChartPanelAriaLabels, withChartPanelLegendPosition } from './features';
import { injectChartPanelAriaLabels, injectChartPanelConfig } from './inject-chart-panel-config';
import { provideChartPanelConfig, provideChartPanelConfigAt } from './provide-chart-panel-config';

describe('CNGX_CHART_PANEL_CONFIG cascade', () => {
  function read() {
    return TestBed.runInInjectionContext(() => injectChartPanelConfig());
  }
  function labels() {
    return TestBed.runInInjectionContext(() => injectChartPanelAriaLabels());
  }

  it('carries no copy in the defaults and resolves the English section without any provider', () => {
    expect(read()).toEqual({ legendPosition: 'bottom' });
    expect(labels()()).toEqual({ busy: 'Updating' });
    expect(EN_SECTION.busy).toBe('Updating');
  });

  it('reads the chartPanel section of the active pack', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const resolved = labels();
    expect(resolved().busy).toBe('Updating');
    pack.set({ locale: 'de', chartPanel: { busy: 'Wird aktualisiert' } });
    expect(resolved().busy).toBe('Wird aktualisiert');
  });

  it('lets withChartPanelAriaLabels win on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', chartPanel: { busy: 'Wird aktualisiert' } }),
          withDocumentLanguage('off'),
        ),
        provideChartPanelConfig(withChartPanelAriaLabels({ busy: 'Laedt' })),
      ],
    });
    expect(labels()().busy).toBe('Laedt');
  });

  it('keeps the labels reference for the same section', () => {
    const first = labels();
    expect(Object.is(first, labels())).toBe(true);
    expect(Object.is(first(), labels()())).toBe(true);
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
    expect(labels()().busy).toBe('Updating');
  });

  it('deep-merges a partial ariaLabels override', () => {
    TestBed.configureTestingModule({
      providers: [provideChartPanelConfig(withChartPanelAriaLabels({ busy: 'Aktualisiert' }))],
    });
    expect(labels()().busy).toBe('Aktualisiert');
    expect(read().legendPosition).toBe('bottom');
  });

  it('resolves plain labels to the same bundle as the eager merge did', () => {
    TestBed.configureTestingModule({
      providers: [provideChartPanelConfig(withChartPanelAriaLabels({ busy: 'Aktualisiert' }))],
    });
    expect(labels()()).toEqual({ busy: 'Aktualisiert' });
  });

  it('falls back to the default for a label an override sets to undefined', () => {
    TestBed.configureTestingModule({
      providers: [provideChartPanelConfig(withChartPanelAriaLabels({ busy: undefined }))],
    });
    expect(labels()().busy).toBe('Updating');
  });

  it('follows Signal labels and keeps the bundle reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideChartPanelConfig(
          withChartPanelAriaLabels(
            computed<CngxChartPanelAriaLabels>(() =>
              lang() === 'en' ? {} : { busy: 'Wird aktualisiert' },
            ),
          ),
        ),
      ],
    });
    const resolved = labels();
    expect(resolved().busy).toBe('Updating');

    lang.set('de');
    const german = resolved();
    expect(german.busy).toBe('Wird aktualisiert');

    lang.set('de-AT');
    expect(resolved()).toBe(german);
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
