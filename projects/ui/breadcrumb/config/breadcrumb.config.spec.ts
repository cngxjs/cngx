import { Component, computed, Directive, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxBreadcrumbAriaLabels } from './breadcrumb.config';
import {
  CNGX_BREADCRUMB_ARIA_LABELS_DEFAULTS,
  CNGX_BREADCRUMB_CONFIG,
  CNGX_BREADCRUMB_DEFAULTS,
} from './breadcrumb.config.defaults';
import { withBreadcrumbAriaLabels, withBreadcrumbDataKey } from './features';
import { injectBreadcrumbAriaLabels, injectBreadcrumbConfig } from './inject-breadcrumb-config';
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
  readonly labels = injectBreadcrumbAriaLabels();
}

const resolvedLabels = () => TestBed.runInInjectionContext(() => injectBreadcrumbAriaLabels())();

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
    const labels = resolvedLabels();

    expect(labels.bar).toBe('Breadcrumb');
    expect(labels.overflowTrigger).toBe('Show collapsed breadcrumbs');
    expect(labels.overflowMenu).toBe('Collapsed breadcrumbs');
    expect(labels.siblingsTrigger).toBe('Show sibling pages');
    expect(labels.siblingsMenu).toBe('Sibling pages');
    expect(cfg.router?.dataKey).toBe('breadcrumb');
  });

  it('provideBreadcrumbConfig at root wins over defaults and deep-merges untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideBreadcrumbConfig(withBreadcrumbAriaLabels({ bar: 'Brotkrumen' }))],
    });
    const cfg = TestBed.inject(CNGX_BREADCRUMB_CONFIG);
    const labels = resolvedLabels();

    expect(labels.bar).toBe('Brotkrumen');
    // sibling keys keep the defaults (deep-merge, not replace)
    expect(labels.overflowTrigger).toBe('Show collapsed breadcrumbs');
    expect(cfg.router?.dataKey).toBe('breadcrumb');
  });

  it('withBreadcrumbDataKey overrides only the router dataKey', () => {
    TestBed.configureTestingModule({
      providers: [provideBreadcrumbConfig(withBreadcrumbDataKey('crumb'))],
    });
    const cfg = TestBed.inject(CNGX_BREADCRUMB_CONFIG);

    expect(cfg.router?.dataKey).toBe('crumb');
    expect(resolvedLabels().bar).toBe('Breadcrumb');
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
    const { cfg, labels } = fixture.componentInstance.probe();

    expect(cfg.router?.dataKey).toBe('crumb'); // At override wins
    expect(labels().bar).toBe('Root label'); // inherited from root via skipSelf merge
  });

  it('resolves plain labels to the same bundle as the eager merge did', () => {
    TestBed.configureTestingModule({
      providers: [
        provideBreadcrumbConfig(
          withBreadcrumbAriaLabels({ bar: 'Brotkrumen' }),
          withBreadcrumbAriaLabels({ siblingsMenu: 'Geschwister' }),
        ),
      ],
    });
    expect(resolvedLabels()).toEqual({
      ...CNGX_BREADCRUMB_ARIA_LABELS_DEFAULTS,
      bar: 'Brotkrumen',
      siblingsMenu: 'Geschwister',
    });
  });

  it('follows Signal labels and keeps the bundle reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideBreadcrumbConfig(
          withBreadcrumbAriaLabels(
            computed<CngxBreadcrumbAriaLabels>(() => (lang() === 'en' ? {} : { bar: 'Brotkrumen' })),
          ),
        ),
      ],
    });
    const labels = TestBed.runInInjectionContext(() => injectBreadcrumbAriaLabels());
    expect(labels().bar).toBe('Breadcrumb');

    lang.set('de');
    const german = labels();
    expect(german.bar).toBe('Brotkrumen');
    expect(german.overflowMenu).toBe('Collapsed breadcrumbs');

    lang.set('de-AT');
    expect(labels()).toBe(german);
  });

  it('falls back to the default for a label an override sets to undefined', () => {
    TestBed.configureTestingModule({
      providers: [provideBreadcrumbConfig(withBreadcrumbAriaLabels({ bar: undefined }))],
    });
    expect(resolvedLabels().bar).toBe('Breadcrumb');
  });
});
