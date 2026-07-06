import { Component, Directive, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_BREADCRUMB_CONFIG,
  CNGX_BREADCRUMB_DEFAULTS,
} from './breadcrumb.config.defaults';
import { withBreadcrumbAriaLabels, withBreadcrumbDataKey } from './features';
import { injectBreadcrumbConfig } from './inject-breadcrumb-config';
import {
  provideBreadcrumbConfig,
  provideBreadcrumbConfigAt,
} from './provide-breadcrumb-config';

// A view-child probe: reads the resolved config from within the host's view,
// where component `viewProviders` are visible (the host instance itself is
// not, mirroring the CngxTag config spec).
@Directive({ selector: '[cfgProbe]' })
class CfgProbe {
  readonly cfg = injectBreadcrumbConfig();
}

@Component({
  imports: [CfgProbe],
  viewProviders: [provideBreadcrumbConfigAt(withBreadcrumbDataKey('crumb'))],
  template: `<i cfgProbe></i>`,
})
class AtHost {
  readonly probe = viewChild.required(CfgProbe);
}

describe('CNGX_BREADCRUMB_CONFIG', () => {
  it('resolves to the EN library defaults with no provider present', () => {
    const cfg = TestBed.inject(CNGX_BREADCRUMB_CONFIG);

    expect(cfg.ariaLabels?.bar).toBe('Breadcrumb');
    expect(cfg.ariaLabels?.overflowTrigger).toBe('Show collapsed breadcrumbs');
    expect(cfg.ariaLabels?.overflowMenu).toBe('Collapsed breadcrumbs');
    expect(cfg.ariaLabels?.siblingsTrigger).toBe('Show sibling pages');
    expect(cfg.ariaLabels?.siblingsMenu).toBe('Sibling pages');
    expect(cfg.router?.dataKey).toBe('breadcrumb');
  });

  it('provideBreadcrumbConfig at root wins over defaults and deep-merges untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideBreadcrumbConfig(withBreadcrumbAriaLabels({ bar: 'Brotkrumen' }))],
    });
    const cfg = TestBed.inject(CNGX_BREADCRUMB_CONFIG);

    expect(cfg.ariaLabels?.bar).toBe('Brotkrumen');
    // sibling keys keep the defaults (deep-merge, not replace)
    expect(cfg.ariaLabels?.overflowTrigger).toBe('Show collapsed breadcrumbs');
    expect(cfg.router?.dataKey).toBe('breadcrumb');
  });

  it('withBreadcrumbDataKey overrides only the router dataKey', () => {
    TestBed.configureTestingModule({
      providers: [provideBreadcrumbConfig(withBreadcrumbDataKey('crumb'))],
    });
    const cfg = TestBed.inject(CNGX_BREADCRUMB_CONFIG);

    expect(cfg.router?.dataKey).toBe('crumb');
    expect(cfg.ariaLabels?.bar).toBe('Breadcrumb');
  });

  it('provideBreadcrumbConfig() with zero features preserves the CNGX_BREADCRUMB_DEFAULTS reference', () => {
    TestBed.configureTestingModule({
      providers: [provideBreadcrumbConfig()],
    });
    const cfg = TestBed.inject(CNGX_BREADCRUMB_CONFIG);

    expect(cfg).toBe(CNGX_BREADCRUMB_DEFAULTS);
  });

  it('provideBreadcrumbConfigAt in viewProviders wins over the root and deep-merges the parent value', () => {
    TestBed.configureTestingModule({
      providers: [provideBreadcrumbConfig(withBreadcrumbAriaLabels({ bar: 'Root label' }))],
    });
    const fixture = TestBed.createComponent(AtHost);
    fixture.detectChanges();
    const cfg = fixture.componentInstance.probe().cfg;

    expect(cfg.router?.dataKey).toBe('crumb'); // At override wins
    expect(cfg.ariaLabels?.bar).toBe('Root label'); // inherited from root via skipSelf merge
  });
});
