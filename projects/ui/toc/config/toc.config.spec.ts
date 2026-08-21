import { Component, Directive, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxTocItemContext } from '../toc.types';
import { CNGX_TOC_CONFIG, CNGX_TOC_DEFAULTS } from './toc.config.defaults';
import {
  withTocAriaLabels,
  withTocScrollBehavior,
  withTocSpy,
  withTocTemplates,
} from './features';
import { injectTocConfig } from './inject-toc-config';
import { provideTocConfig, provideTocConfigAt } from './provide-toc-config';

// A sentinel standing in for a real TemplateRef - the config cascade only
// forwards the reference, so identity is all that matters at this layer. The
// actual slot rendering is exercised in toc.component.spec.ts.
const itemTpl = {} as unknown as TemplateRef<CngxTocItemContext>;

// A view-child probe: reads the resolved config from within the host's view,
// where component `viewProviders` are visible (the host instance itself is
// not, mirroring the breadcrumb config spec).
@Directive({ selector: '[cfgProbe]' })
class CfgProbe {
  readonly cfg = injectTocConfig();
}

@Component({
  imports: [CfgProbe],
  viewProviders: [provideTocConfigAt(withTocScrollBehavior('auto'))],
  template: `<i cfgProbe></i>`,
})
class AtHost {
  readonly probe = viewChild.required(CfgProbe);
}

describe('CNGX_TOC_CONFIG', () => {
  it('resolves to the EN library defaults with no provider present', () => {
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.ariaLabels?.nav).toBe('On this page');
    expect(cfg.scrollBehavior).toBe('smooth');
    expect(cfg.spy?.rootMargin).toBe('0px');
    expect(cfg.spy?.threshold).toBe(0.3);
  });

  it('provideTocConfig at root wins over defaults and deep-merges untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocAriaLabels({ nav: 'Auf dieser Seite' }))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.ariaLabels?.nav).toBe('Auf dieser Seite');
    // sibling keys keep the defaults (deep-merge, not replace)
    expect(cfg.scrollBehavior).toBe('smooth');
    expect(cfg.spy?.threshold).toBe(0.3);
  });

  it('withTocScrollBehavior overrides only the scalar', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocScrollBehavior('auto'))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.scrollBehavior).toBe('auto');
    expect(cfg.ariaLabels?.nav).toBe('On this page');
  });

  it('withTocSpy overrides the spy defaults and deep-merges the untouched key', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocSpy({ threshold: 0.5 }))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.spy?.threshold).toBe(0.5);
    // rootMargin keeps the default (deep-merge, not replace)
    expect(cfg.spy?.rootMargin).toBe('0px');
    expect(cfg.ariaLabels?.nav).toBe('On this page');
  });

  it('withTocTemplates carries the item template through the cascade', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocTemplates({ item: itemTpl }))],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg.templates?.item).toBe(itemTpl);
    // untouched keys survive the merge
    expect(cfg.ariaLabels?.nav).toBe('On this page');
    expect(cfg.scrollBehavior).toBe('smooth');
  });

  it('provideTocConfig() with zero features preserves the CNGX_TOC_DEFAULTS reference', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig()],
    });
    const cfg = TestBed.inject(CNGX_TOC_CONFIG);

    expect(cfg).toBe(CNGX_TOC_DEFAULTS);
  });

  it('provideTocConfigAt in viewProviders wins over the root and deep-merges the parent value', () => {
    TestBed.configureTestingModule({
      providers: [provideTocConfig(withTocAriaLabels({ nav: 'Root label' }))],
    });
    const fixture = TestBed.createComponent(AtHost);
    fixture.detectChanges();
    const cfg = fixture.componentInstance.probe().cfg;

    expect(cfg.scrollBehavior).toBe('auto'); // At override wins
    expect(cfg.ariaLabels?.nav).toBe('Root label'); // inherited from root via skipSelf merge
  });
});
