import { Component, Directive, isSignal, signal, viewChild, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_SIDENAV_CONFIG, CNGX_SIDENAV_DEFAULTS } from './config/sidenav.config.defaults';
import {
  withSidenavDimensions,
  withSidenavHoverDwell,
  withSidenavLabels,
  withSidenavPersistence,
  withSidenavRouterSync,
  withSidenavShortcut,
} from './config/features';
import type { CngxSidenavConfigFeature } from './config/provide-sidenav-config';
import type { CngxSidenavConfig, CngxSidenavLabels } from './config/sidenav.config';
import { injectSidenavConfig } from './config/inject-sidenav-config';
import { provideSidenavConfig, provideSidenavConfigAt } from './config/provide-sidenav-config';

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

function atHost(...features: CngxSidenavConfigFeature[]): Type<{ probe: () => CfgProbe }> {
  @Component({
    imports: [CfgProbe],
    viewProviders: [provideSidenavConfigAt(...features)],
    template: `<i cfgProbe></i>`,
  })
  class FeatureAtHost {
    readonly probe = viewChild.required(CfgProbe);
  }
  return FeatureAtHost;
}

function readLabels(labels: CngxSidenavConfig['labels']): Partial<CngxSidenavLabels> | undefined {
  return isSignal(labels) ? labels() : labels;
}

function resolveAt(root: CngxSidenavConfigFeature[], at: CngxSidenavConfigFeature[]) {
  TestBed.configureTestingModule({ providers: [provideSidenavConfig(...root)] });
  const fixture = TestBed.createComponent(atHost(...at));
  fixture.detectChanges();
  return fixture.componentInstance.probe().cfg;
}

describe('CNGX_SIDENAV_CONFIG', () => {
  it('resolves to the library defaults with no provider present', () => {
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

    expect(cfg.dimensions?.width).toBe('280px');
    expect(cfg.dimensions?.miniWidth).toBeUndefined();
    expect(cfg.dimensions?.minWidth).toBe('120px');
    expect(cfg.dimensions?.maxWidth).toBe('600px');
    expect(cfg.hover?.enterDelay).toBe(120);
    expect(cfg.hover?.leaveDelay).toBe(0);
    expect(cfg.shortcut).toBeUndefined();
  });

  it('provideSidenavConfig at root wins over defaults and deep-merges untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavDimensions({ width: '320px' }))],
    });
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

    expect(cfg.dimensions?.width).toBe('320px');
    // sibling dimension keys keep the defaults (deep-merge, not replace)
    expect(cfg.dimensions?.miniWidth).toBeUndefined();
    expect(cfg.dimensions?.minWidth).toBe('120px');
    // untouched sub-trees stay at their defaults
    expect(cfg.hover?.enterDelay).toBe(120);
  });

  it('withSidenavShortcut overrides the flat scalar', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavShortcut('mod+b'))],
    });
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

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

  it('provideSidenavConfigAt merges hover per key with the parent', () => {
    const cfg = resolveAt(
      [withSidenavHoverDwell({ enterDelay: 200, leaveDelay: 80 })],
      [withSidenavHoverDwell({ enterDelay: 400 })],
    );
    expect(cfg.hover?.enterDelay).toBe(400);
    expect(cfg.hover?.leaveDelay).toBe(80);
  });

  it('provideSidenavConfigAt overrides the router-sync param and inherits it when absent', () => {
    expect(
      resolveAt(
        [withSidenavRouterSync({ param: 'menu' })],
        [withSidenavRouterSync({ param: 'side' })],
      ).routerSync?.param,
    ).toBe('side');
    TestBed.resetTestingModule();
    expect(
      resolveAt([withSidenavRouterSync({ param: 'menu' })], [withSidenavShortcut('mod+.')])
        .routerSync?.param,
    ).toBe('menu');
  });

  it('provideSidenavConfigAt merges labels per key with the root', () => {
    const cfg = resolveAt(
      [withSidenavLabels({ toggleShortcut: 'Menü umschalten', resizeHandle: 'Breite' })],
      [withSidenavLabels({ resizeHandle: 'Breite ändern' })],
    );
    expect(readLabels(cfg.labels)).toEqual({
      toggleShortcut: 'Menü umschalten',
      resizeHandle: 'Breite ändern',
    });
  });

  it('merges two withSidenavLabels calls per key, the later one winning', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSidenavConfig(
          withSidenavLabels({ startRegion: 'Navigation', resizeHandle: 'Breite' }),
          withSidenavLabels(signal({ resizeHandle: 'Breite ändern' })),
        ),
      ],
    });
    expect(readLabels(TestBed.inject(CNGX_SIDENAV_CONFIG).labels)).toEqual({
      startRegion: 'Navigation',
      resizeHandle: 'Breite ändern',
    });
  });

  it('provideSidenavConfigAt replaces persistence and inherits it when absent', () => {
    expect(
      resolveAt([withSidenavPersistence('app')], [withSidenavPersistence('panel')]).persistence,
    ).toEqual({ storageKey: 'panel' });
    TestBed.resetTestingModule();
    expect(
      resolveAt([withSidenavPersistence('app')], [withSidenavShortcut('mod+.')]).persistence,
    ).toEqual({ storageKey: 'app' });
  });
});
