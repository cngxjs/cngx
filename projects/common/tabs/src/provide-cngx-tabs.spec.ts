import {
  Component,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CNGX_TABS_I18N, withTabsI18nLabels } from './i18n/tabs-i18n';
import {
  provideCngxTabs,
  provideCngxTabsAt,
} from './provide-cngx-tabs';
import {
  CNGX_TABS_CONFIG,
  injectTabsConfig,
  withDefaultOrientation,
  withTabOverflowStabilizeMs,
  withTabsAriaLabels,
} from './tabs-config';

describe('provideCngxTabs', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('dispatches config and i18n features to their respective tokens in one call', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxTabs(
          withDefaultOrientation('vertical'),
          withTabOverflowStabilizeMs(150),
          withTabsAriaLabels({ tabsRegion: 'Bereiche' }),
          withTabsI18nLabels({
            tabsLabel: 'Bereiche',
            moreTabsLabel: (n) => `${n} mehr`,
          }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(cfg.defaultOrientation).toBe('vertical');
    expect(cfg.overflowStabilizeMs).toBe(150);
    expect(cfg.ariaLabels?.tabsRegion).toBe('Bereiche');
    expect(i18n.tabsLabel).toBe('Bereiche');
    expect(i18n.moreTabsLabel(3)).toBe('3 mehr');
  });

  it('falls back to library defaults when no features are passed', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideCngxTabs()],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(cfg.overflowStabilizeMs).toBe(100);
    expect(i18n.tabsLabel).toBe('Tabs');
  });

  it('only-config features leave i18n at library defaults (no spurious i18n provider)', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxTabs(withDefaultOrientation('vertical')),
      ],
    });
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(i18n.tabsLabel).toBe('Tabs');
    expect(i18n.previousTab).toBe('Previous tab');
  });

  it('only-i18n features leave config at library defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxTabs(withTabsI18nLabels({ tabsLabel: 'Reiter' })),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    const i18n = TestBed.inject(CNGX_TABS_I18N);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(i18n.tabsLabel).toBe('Reiter');
  });

  it('injectTabsConfig sees the aggregator-provided config in an injection context', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxTabs(withTabOverflowStabilizeMs(200)),
      ],
    });
    const injector = TestBed.inject(EnvironmentInjector);
    const cfg = runInInjectionContext(injector, () => injectTabsConfig());
    expect(cfg.overflowStabilizeMs).toBe(200);
  });
});

describe('provideCngxTabsAt', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('component-scoped aggregator dispatches both surfaces (config + i18n)', () => {
    @Component({
      standalone: true,
      template: '',
      viewProviders: [
        ...provideCngxTabsAt(
          withDefaultOrientation('vertical'),
          withTabsI18nLabels({ tabsLabel: 'Bereiche' }),
        ),
      ],
    })
    class ScopedHost {}

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();
    const scopedCfg = fixture.debugElement.injector.get(CNGX_TABS_CONFIG);
    const scopedI18n = fixture.debugElement.injector.get(CNGX_TABS_I18N);
    expect(scopedCfg.defaultOrientation).toBe('vertical');
    expect(scopedI18n.tabsLabel).toBe('Bereiche');
  });
});
