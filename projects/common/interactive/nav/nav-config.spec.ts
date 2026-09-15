import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_NAV_DEFAULTS,
  injectNavConfig,
  provideNavConfig,
  withNavAnimation,
  withNavIndent,
  withSingleAccordion,
} from './nav-config';
import { CngxNavGroupRegistry } from './nav-group-registry';

function resolveConfig(): ReturnType<typeof injectNavConfig> {
  const injector = TestBed.inject(Injector);
  return runInInjectionContext(injector, () => injectNavConfig());
}

describe('nav-config', () => {
  it('injectNavConfig returns the defaults when nothing is provided', () => {
    expect(resolveConfig()).toEqual(CNGX_NAV_DEFAULTS);
  });

  it('merges provided indent and animation over the defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideNavConfig(withNavIndent(16), withNavAnimation(200))],
    });
    const config = resolveConfig();
    expect(config.indent).toBe(16);
    expect(config.animationDuration).toBe(200);
    // Unset feature falls back to the default.
    expect(config.singleAccordion).toBe(false);
  });

  it('withSingleAccordion enables the flag and registers the coordination registry', () => {
    TestBed.configureTestingModule({
      providers: [provideNavConfig(withSingleAccordion())],
    });
    expect(resolveConfig().singleAccordion).toBe(true);
    // The registry is auto-included only when single-accordion is on.
    expect(TestBed.inject(CngxNavGroupRegistry)).toBeInstanceOf(CngxNavGroupRegistry);
  });

  it('does not register the coordination registry without single-accordion', () => {
    TestBed.configureTestingModule({
      providers: [provideNavConfig(withNavIndent(8))],
    });
    expect(TestBed.inject(CngxNavGroupRegistry, null, { optional: true })).toBeNull();
  });
});
