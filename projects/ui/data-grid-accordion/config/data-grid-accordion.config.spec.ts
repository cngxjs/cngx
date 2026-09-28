import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxDataGridAccordionLabels } from './data-grid-accordion.config';
import {
  CNGX_DATA_GRID_ACCORDION_CONFIG,
  injectDataGridAccordionLabels,
} from './data-grid-accordion.config.defaults';
import { withDataGridAccordionLabels, withDataGridSkin } from './features';
import {
  provideDataGridAccordionConfig,
  provideDataGridAccordionConfigAt,
} from './provide-data-grid-accordion-config';

describe('data-grid-accordion config cascade', () => {
  it('leaves the skin unset when unconfigured', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CNGX_DATA_GRID_ACCORDION_CONFIG).skin).toBeUndefined();
  });

  it('resolves the root withDataGridSkin over the defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideDataGridAccordionConfig(withDataGridSkin('ledger'))],
    });
    expect(TestBed.inject(CNGX_DATA_GRID_ACCORDION_CONFIG).skin).toBe('ledger');
  });

  it('empty provideDataGridAccordionConfig preserves the default reference (no allocation)', () => {
    TestBed.configureTestingModule({});
    const base = TestBed.inject(CNGX_DATA_GRID_ACCORDION_CONFIG);
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({ providers: [provideDataGridAccordionConfig()] });
    expect(TestBed.inject(CNGX_DATA_GRID_ACCORDION_CONFIG)).toBe(base);
  });

  it('lets provideDataGridAccordionConfigAt override the root skin', () => {
    @Component({
      selector: 'scoped-skin-host',
      template: '',
      viewProviders: [provideDataGridAccordionConfigAt(withDataGridSkin('report'))],
    })
    class ScopedSkinHost {
      readonly config = inject(CNGX_DATA_GRID_ACCORDION_CONFIG);
    }

    TestBed.configureTestingModule({
      imports: [ScopedSkinHost],
      providers: [provideDataGridAccordionConfig(withDataGridSkin('ledger'))],
    });
    const fixture = TestBed.createComponent(ScopedSkinHost);
    expect(fixture.componentInstance.config.skin).toBe('report');
  });

  it('empty provideDataGridAccordionConfigAt passes the parent reference through unchanged', () => {
    @Component({
      selector: 'passthrough-host',
      template: '',
      viewProviders: [provideDataGridAccordionConfigAt()],
    })
    class PassthroughHost {
      readonly config = inject(CNGX_DATA_GRID_ACCORDION_CONFIG);
    }

    TestBed.configureTestingModule({ imports: [PassthroughHost] });
    const base = TestBed.inject(CNGX_DATA_GRID_ACCORDION_CONFIG);
    const fixture = TestBed.createComponent(PassthroughHost);
    expect(fixture.componentInstance.config).toBe(base);
  });

  describe('labels', () => {
    it('resolves English defaults without a labels feature', () => {
      TestBed.configureTestingModule({});
      const labels = TestBed.runInInjectionContext(() => injectDataGridAccordionLabels());
      expect(labels().filterRows).toBe('Filter rows');
      expect(labels().count(1)).toBe('1 result');
      expect(labels().count(4)).toBe('4 results');
    });

    it('merges withDataGridAccordionLabels over the defaults', () => {
      TestBed.configureTestingModule({
        providers: [
          provideDataGridAccordionConfig(
            withDataGridAccordionLabels({ filterRows: 'Zeilen filtern' }),
          ),
        ],
      });
      const labels = TestBed.runInInjectionContext(() => injectDataGridAccordionLabels());
      expect(labels().filterRows).toBe('Zeilen filtern');
      expect(labels().filter).toBe('Filter');
    });

    it('keeps the skin when a labels feature is added next to it', () => {
      TestBed.configureTestingModule({
        providers: [
          provideDataGridAccordionConfig(
            withDataGridSkin('ledger'),
            withDataGridAccordionLabels({ filter: 'Filtern' }),
          ),
        ],
      });
      expect(TestBed.inject(CNGX_DATA_GRID_ACCORDION_CONFIG).skin).toBe('ledger');
    });

    it('flips live through a Signal of labels', () => {
      const overrides = signal<Partial<CngxDataGridAccordionLabels>>({});
      TestBed.configureTestingModule({
        providers: [provideDataGridAccordionConfig(withDataGridAccordionLabels(overrides))],
      });
      const labels = TestBed.runInInjectionContext(() => injectDataGridAccordionLabels());
      expect(labels().filter).toBe('Filter');
      overrides.set({ filter: 'Filtern' });
      expect(labels().filter).toBe('Filtern');
    });

    it('shares one labels Signal across readers under one injector', () => {
      TestBed.configureTestingModule({
        providers: [
          provideDataGridAccordionConfig(withDataGridAccordionLabels({ filter: 'Filtern' })),
        ],
      });
      const first = TestBed.runInInjectionContext(() => injectDataGridAccordionLabels());
      const second = TestBed.runInInjectionContext(() => injectDataGridAccordionLabels());
      expect(first).toBe(second);
    });
  });
});
