import { Component, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  CNGX_TABS_CONFIG,
  injectTabsConfig,
  provideTabsConfig,
  provideTabsConfigAt,
  withDefaultOrientation,
  withTabsRovingLoop,
  withTabsCommitMode,
  withTabsRouterSync,
  withTabsAriaLabels,
  withTabsFallbackLabels,
} from './tabs-config';

describe('CngxTabsConfig', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('library default uses horizontal / loop=true / optimistic / fragment', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(cfg.defaultLoop).toBe(true);
    expect(cfg.defaultCommitMode).toBe('optimistic');
    expect(cfg.routerSyncMode).toBe('fragment');
    expect(cfg.routerSyncParam).toBe('tab');
  });

  it('withDefaultOrientation overrides the orientation default', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withDefaultOrientation('vertical')),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.defaultOrientation).toBe('vertical');
    // Other keys keep their library defaults.
    expect(cfg.defaultLoop).toBe(true);
  });

  it('withTabsRovingLoop overrides the loop default', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsRovingLoop(false)),
      ],
    });
    expect(TestBed.inject(CNGX_TABS_CONFIG).defaultLoop).toBe(false);
  });

  it('withTabsCommitMode overrides the commit-mode default', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsCommitMode('pessimistic')),
      ],
    });
    expect(TestBed.inject(CNGX_TABS_CONFIG).defaultCommitMode).toBe('pessimistic');
  });

  it('withTabsRouterSync overrides mode and paramName', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsRouterSync('queryParam', 'panel')),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.routerSyncMode).toBe('queryParam');
    expect(cfg.routerSyncParam).toBe('panel');
  });

  it('withTabsAriaLabels merges into the ariaLabels bag', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsAriaLabels({ tabsRegion: 'Reiter' })),
      ],
    });
    expect(TestBed.inject(CNGX_TABS_CONFIG).ariaLabels?.tabsRegion).toBe('Reiter');
  });

  it('withTabsFallbackLabels merges into the fallbackLabels bag', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withTabsFallbackLabels({ tabRoleDescription: 'Reiter' }),
        ),
      ],
    });
    expect(TestBed.inject(CNGX_TABS_CONFIG).fallbackLabels?.tabRoleDescription).toBe(
      'Reiter',
    );
  });

  it('multiple features compose left-to-right', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withDefaultOrientation('vertical'),
          withTabsRovingLoop(false),
          withTabsCommitMode('pessimistic'),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.defaultOrientation).toBe('vertical');
    expect(cfg.defaultLoop).toBe(false);
    expect(cfg.defaultCommitMode).toBe('pessimistic');
  });

  it('provideTabsConfigAt scopes via viewProviders, overriding root', () => {
    @Component({
      standalone: true,
      selector: 'scope-cmp',
      template: '',
      viewProviders: [...provideTabsConfigAt(withDefaultOrientation('vertical'))],
    })
    class ScopeCmp {}

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withDefaultOrientation('horizontal')),
      ],
    });
    const fixture = TestBed.createComponent(ScopeCmp);
    fixture.detectChanges();
    const scopedCfg = fixture.debugElement.injector.get(CNGX_TABS_CONFIG);
    expect(scopedCfg.defaultOrientation).toBe('vertical');
  });

  it('injectTabsConfig returns the resolved config in an injection context', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withDefaultOrientation('vertical')),
      ],
    });
    const injector = TestBed.inject(EnvironmentInjector);
    const cfg = runInInjectionContext(injector, () => injectTabsConfig());
    expect(cfg.defaultOrientation).toBe('vertical');
  });
});
