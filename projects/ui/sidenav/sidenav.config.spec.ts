import { Component, Directive, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_SIDENAV_CONFIG,
  CNGX_SIDENAV_DEFAULTS,
} from './config/sidenav.config.defaults';
import {
  withSidenavDimensions,
  withSidenavResponsive,
  withSidenavShortcut,
} from './config/features';
import { injectSidenavConfig } from './config/inject-sidenav-config';
import {
  provideSidenavConfig,
  provideSidenavConfigAt,
} from './config/provide-sidenav-config';

// A view-child probe: reads the resolved config from within the host's view,
// where component `viewProviders` are visible (the host instance itself is
// not, mirroring the breadcrumb config spec).
@Directive({ selector: '[cfgProbe]' })
class CfgProbe {
  readonly cfg = injectSidenavConfig();
}

@Component({
  imports: [CfgProbe],
  viewProviders: [provideSidenavConfigAt(withSidenavDimensions({ width: '360px' }))],
  template: `<i cfgProbe></i>`,
})
class AtHost {
  readonly probe = viewChild.required(CfgProbe);
}

describe('CNGX_SIDENAV_CONFIG', () => {
  it('resolves to the library defaults with no provider present', () => {
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

    expect(cfg.dimensions?.width).toBe('280px');
    expect(cfg.dimensions?.miniWidth).toBe('56px');
    expect(cfg.dimensions?.minWidth).toBe('120px');
    expect(cfg.dimensions?.maxWidth).toBe('600px');
    expect(cfg.hover?.enterDelay).toBe(120);
    expect(cfg.hover?.leaveDelay).toBe(0);
    expect(cfg.responsive).toBeUndefined();
    expect(cfg.shortcut).toBeUndefined();
  });

  it('provideSidenavConfig at root wins over defaults and deep-merges untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavDimensions({ width: '320px' }))],
    });
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

    expect(cfg.dimensions?.width).toBe('320px');
    // sibling dimension keys keep the defaults (deep-merge, not replace)
    expect(cfg.dimensions?.miniWidth).toBe('56px');
    expect(cfg.dimensions?.minWidth).toBe('120px');
    // untouched sub-trees stay at their defaults
    expect(cfg.hover?.enterDelay).toBe(120);
  });

  it('withSidenavResponsive and withSidenavShortcut override the flat scalars', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSidenavConfig(
          withSidenavResponsive('(min-width: 1024px)'),
          withSidenavShortcut('mod+b'),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

    expect(cfg.responsive).toBe('(min-width: 1024px)');
    expect(cfg.shortcut).toBe('mod+b');
    // dimension defaults untouched
    expect(cfg.dimensions?.width).toBe('280px');
  });

  it('provideSidenavConfig() with zero features preserves the CNGX_SIDENAV_DEFAULTS reference', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig()],
    });
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

    expect(cfg).toBe(CNGX_SIDENAV_DEFAULTS);
  });

  it('provideSidenavConfigAt in viewProviders wins over the root and deep-merges the parent value', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavShortcut('mod+k'))],
    });
    const fixture = TestBed.createComponent(AtHost);
    fixture.detectChanges();
    const cfg = fixture.componentInstance.probe().cfg;

    expect(cfg.dimensions?.width).toBe('360px'); // At override wins
    expect(cfg.shortcut).toBe('mod+k'); // inherited from root via skipSelf merge
  });
});
