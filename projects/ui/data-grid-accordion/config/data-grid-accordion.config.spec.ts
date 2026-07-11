import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_DATA_GRID_ACCORDION_CONFIG } from './data-grid-accordion.config.defaults';
import { withDataGridSkin } from './features';
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
});
