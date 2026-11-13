import { Component, Directive, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxNavRail, type CngxNavRailLabelPlacement, type CngxNavRailSide } from '../nav-rail';
import {
  withNavRailLabelPlacement,
  withNavRailSide,
  withNavRailTooltip,
  withNavRailTooltipDelay,
} from './features';
import { injectNavRailConfig } from './inject-nav-rail-config';
import { CNGX_NAV_RAIL_CONFIG, CNGX_NAV_RAIL_DEFAULTS } from './nav-rail.config.defaults';
import { provideNavRailConfig, provideNavRailConfigAt } from './provide-nav-rail-config';

// Reads the resolved config from inside the host's view, where component
// `viewProviders` are visible.
@Directive({ selector: '[cfgProbe]' })
class CfgProbe {
  readonly cfg = injectNavRailConfig();
}

@Component({
  imports: [CfgProbe],
  viewProviders: [provideNavRailConfigAt(withNavRailTooltipDelay(800))],
  template: `<i cfgProbe></i>`,
})
class AtHost {
  readonly probe = viewChild.required(CfgProbe);
}

@Component({
  imports: [CngxNavRail],
  template: `
    <cngx-nav-rail [labelPlacement]="placement()" [side]="side()" [tooltip]="tooltip()">
      <a href="#inbox" class="cngx-nav-link">Inbox</a>
    </cngx-nav-rail>
  `,
})
class RailHost {
  readonly placement = signal<CngxNavRailLabelPlacement | undefined>(undefined);
  readonly side = signal<CngxNavRailSide | undefined>(undefined);
  readonly tooltip = signal<boolean | undefined>(undefined);
}

function hasTooltip(fixture: { nativeElement: HTMLElement }): boolean {
  return fixture.nativeElement.querySelector('.cngx-nav-rail-tooltip') !== null;
}

function sideOf(fixture: { nativeElement: HTMLElement }): string | null {
  return fixture.nativeElement.querySelector('cngx-nav-rail')!.getAttribute('data-side');
}

function placementOf(fixture: { nativeElement: HTMLElement }): string | null {
  return fixture.nativeElement.querySelector('cngx-nav-rail')!.getAttribute('data-label-placement');
}

describe('CNGX_NAV_RAIL_CONFIG', () => {
  it('resolves to the library defaults with no provider present', () => {
    expect(TestBed.inject(CNGX_NAV_RAIL_CONFIG)).toBe(CNGX_NAV_RAIL_DEFAULTS);
    expect(CNGX_NAV_RAIL_DEFAULTS).toEqual({
      labelPlacement: 'end',
      side: 'start',
      tooltip: true,
      tooltipDelay: 300,
    });
  });

  it('merges root features over the defaults, last write wins', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNavRailConfig(
          withNavRailLabelPlacement('below'),
          withNavRailSide('end'),
          withNavRailTooltip(false),
          withNavRailTooltipDelay(100),
          withNavRailTooltipDelay(200),
        ),
      ],
    });
    expect(TestBed.inject(CNGX_NAV_RAIL_CONFIG)).toEqual({
      labelPlacement: 'below',
      side: 'end',
      tooltip: false,
      tooltipDelay: 200,
    });
  });

  it('keeps the defaults reference when provideNavRailConfig gets no feature', () => {
    TestBed.configureTestingModule({ providers: [provideNavRailConfig()] });
    expect(TestBed.inject(CNGX_NAV_RAIL_CONFIG)).toBe(CNGX_NAV_RAIL_DEFAULTS);
  });

  it('merges provideNavRailConfigAt over the parent scope', () => {
    TestBed.configureTestingModule({
      providers: [provideNavRailConfig(withNavRailLabelPlacement('below'))],
    });
    const fixture = TestBed.createComponent(AtHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.probe().cfg).toEqual({
      labelPlacement: 'below',
      side: 'start',
      tooltip: true,
      tooltipDelay: 800,
    });
  });

  it('fills the keys a hand-written provider leaves out from the defaults', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_NAV_RAIL_CONFIG, useValue: { side: 'end' } }],
    });
    const fixture = TestBed.createComponent(AtHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.probe().cfg).toEqual({
      labelPlacement: 'end',
      side: 'end',
      tooltip: true,
      tooltipDelay: 800,
    });
  });

  it('resolves the rail look as input, then config, then default', () => {
    const plain = TestBed.createComponent(RailHost);
    plain.detectChanges();
    expect(placementOf(plain)).toBe('end');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideNavRailConfig(withNavRailLabelPlacement('below'))],
    });
    const configured = TestBed.createComponent(RailHost);
    configured.detectChanges();
    expect(placementOf(configured)).toBe('below');

    configured.componentInstance.placement.set('end');
    configured.detectChanges();
    expect(placementOf(configured)).toBe('end');
  });

  it('resolves the rail side as input, then config, then default', () => {
    const plain = TestBed.createComponent(RailHost);
    plain.detectChanges();
    expect(sideOf(plain)).toBe('start');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideNavRailConfig(withNavRailSide('end'))],
    });
    const configured = TestBed.createComponent(RailHost);
    configured.detectChanges();
    expect(sideOf(configured)).toBe('end');

    configured.componentInstance.side.set('start');
    configured.detectChanges();
    expect(sideOf(configured)).toBe('start');
  });

  it('resolves the tooltip switch as input, then config, then default', () => {
    const plain = TestBed.createComponent(RailHost);
    plain.detectChanges();
    expect(hasTooltip(plain)).toBe(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideNavRailConfig(withNavRailTooltip(false))],
    });
    const configured = TestBed.createComponent(RailHost);
    configured.detectChanges();
    expect(hasTooltip(configured)).toBe(false);

    configured.componentInstance.tooltip.set(true);
    configured.detectChanges();
    expect(hasTooltip(configured)).toBe(true);
  });
});
