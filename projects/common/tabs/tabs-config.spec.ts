import {
  Component,
  computed,
  EnvironmentInjector,
  TemplateRef,
  ViewChild,
  provideZonelessChangeDetection,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { coerceSignal } from '@cngx/core/utils';

import {
  CNGX_TABS_CONFIG,
  injectTabsConfig,
  provideTabsConfig,
  provideTabsConfigAt,
  withTabBusySpinnerTemplate,
  withTabErrorBadgeTemplate,
  withTabIconTemplate,
  withTabOverflowMaxDeferMs,
  withTabOverflowStabilizeMs,
  withTabRejectionIconTemplate,
  withTabsAriaLabels,
  withTabsCommitMode,
  withTabsDefaultOrientation,
  withTabsFallbackLabels,
  withTabsIconLayout,
  withTabsPanelMode,
  withTabsFragmentSync,
  withTabsRouterSync,
  withTabsRovingLoop,
  withTabsSkin,
} from './tabs-config';
import type { CngxTabBusySpinnerContext } from './slots/tab-busy-spinner.directive';
import type { CngxTabErrorBadgeContext } from './slots/tab-error-badge.directive';
import type { CngxTabIconContext } from './slots/tab-icon.directive';
import type { CngxTabRejectionIconContext } from './slots/tab-rejection-icon.directive';

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
    expect(cfg.fragmentSyncMode).toBe('fragment');
    expect(cfg.fragmentSyncParam).toBe('tab');
  });

  it('withTabsDefaultOrientation overrides the orientation default', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsDefaultOrientation('vertical')),
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

  it('withTabsFragmentSync overrides mode and paramName', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsFragmentSync('queryParam', 'panel')),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.fragmentSyncMode).toBe('queryParam');
    expect(cfg.fragmentSyncParam).toBe('panel');
  });

  it('withTabsRouterSync is a deprecated alias of withTabsFragmentSync', () => {
    expect(withTabsRouterSync).toBe(withTabsFragmentSync);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsRouterSync('queryParam', 'panel')),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.fragmentSyncMode).toBe('queryParam');
    expect(cfg.fragmentSyncParam).toBe('panel');
  });

  it('withTabsAriaLabels merges into the ariaLabels bag', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsAriaLabels({ tabsRegion: 'Reiter' })),
      ],
    });
    expect(coerceSignal(TestBed.inject(CNGX_TABS_CONFIG).ariaLabels)()?.tabsRegion).toBe('Reiter');
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
    expect(coerceSignal(TestBed.inject(CNGX_TABS_CONFIG).fallbackLabels)()?.tabRoleDescription).toBe(
      'Reiter',
    );
  });

  it('multiple features compose left-to-right', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withTabsDefaultOrientation('vertical'),
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
      viewProviders: [...provideTabsConfigAt(withTabsDefaultOrientation('vertical'))],
    })
    class ScopeCmp {}

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsDefaultOrientation('horizontal')),
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
        provideTabsConfig(withTabsDefaultOrientation('vertical')),
      ],
    });
    const injector = TestBed.inject(EnvironmentInjector);
    const cfg = runInInjectionContext(injector, () => injectTabsConfig());
    expect(cfg.defaultOrientation).toBe('vertical');
  });

  it('overflowStabilizeMs defaults to 100ms', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.overflowStabilizeMs).toBe(100);
  });

  it('withTabOverflowStabilizeMs overrides the molecule debounce window', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabOverflowStabilizeMs(250)),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.overflowStabilizeMs).toBe(250);
  });

  it('overflowMaxDeferMs defaults to 250ms', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.overflowMaxDeferMs).toBe(250);
  });

  it('withTabOverflowMaxDeferMs overrides the worst-case staleness cap', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabOverflowMaxDeferMs(500)),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.overflowMaxDeferMs).toBe(500);
  });

  it('stabilize and max-defer features compose independently in one provideTabsConfig call', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withTabOverflowStabilizeMs(150),
          withTabOverflowMaxDeferMs(400),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(cfg.overflowStabilizeMs).toBe(150);
    expect(cfg.overflowMaxDeferMs).toBe(400);
  });

  describe('skin and icon-layout axes', () => {
    it('library default leaves skin and iconLayout unset (cascade default lives in createTabsHostAttrs)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_TABS_CONFIG);
      expect(cfg.skin).toBeUndefined();
      expect(cfg.iconLayout).toBeUndefined();
    });

    it('withTabsSkin overrides the skin default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabsSkin('pill')),
        ],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).skin).toBe('pill');
    });

    it('withTabsIconLayout overrides the icon-layout default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabsIconLayout('top')),
        ],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).iconLayout).toBe('top');
    });

    it('skin and icon-layout features compose independently', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabsSkin('contained'), withTabsIconLayout('only')),
        ],
      });
      const cfg = TestBed.inject(CNGX_TABS_CONFIG);
      expect(cfg.skin).toBe('contained');
      expect(cfg.iconLayout).toBe('only');
    });

    it('library default leaves panelMode unset (cascade default lives in createTabsHostAttrs)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).panelMode).toBeUndefined();
    });

    it('withTabsPanelMode overrides the panel-mode default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabsPanelMode('lazy')),
        ],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).panelMode).toBe('lazy');
    });
  });

  describe('skin-slot template features', () => {
    @Component({
      standalone: true,
      template: `
        <ng-template #errorBadgeTpl />
        <ng-template #rejectionIconTpl />
        <ng-template #busySpinnerTpl />
        <ng-template #iconTpl />
      `,
    })
    class TemplateHostComponent {
      @ViewChild('errorBadgeTpl', { static: true })
      errorBadgeTpl!: TemplateRef<CngxTabErrorBadgeContext>;
      @ViewChild('rejectionIconTpl', { static: true })
      rejectionIconTpl!: TemplateRef<CngxTabRejectionIconContext>;
      @ViewChild('busySpinnerTpl', { static: true })
      busySpinnerTpl!: TemplateRef<CngxTabBusySpinnerContext>;
      @ViewChild('iconTpl', { static: true })
      iconTpl!: TemplateRef<CngxTabIconContext>;
    }

    function createTemplates(): {
      errorBadge: TemplateRef<CngxTabErrorBadgeContext>;
      rejectionIcon: TemplateRef<CngxTabRejectionIconContext>;
      busySpinner: TemplateRef<CngxTabBusySpinnerContext>;
      icon: TemplateRef<CngxTabIconContext>;
    } {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(TemplateHostComponent);
      fixture.detectChanges();
      const host = fixture.componentInstance;
      TestBed.resetTestingModule();
      return {
        errorBadge: host.errorBadgeTpl,
        rejectionIcon: host.rejectionIconTpl,
        busySpinner: host.busySpinnerTpl,
        icon: host.iconTpl,
      };
    }

    it('library default leaves the templates bag empty', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_TABS_CONFIG);
      expect(cfg.templates?.errorBadge).toBeUndefined();
      expect(cfg.templates?.rejectionIcon).toBeUndefined();
      expect(cfg.templates?.busySpinner).toBeUndefined();
      expect(cfg.templates?.icon).toBeUndefined();
    });

    it('withTabIconTemplate writes the icon slot', () => {
      const tpls = createTemplates();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabIconTemplate(tpls.icon)),
        ],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).templates?.icon).toBe(tpls.icon);
    });

    it('withTabErrorBadgeTemplate writes the errorBadge slot', () => {
      const tpls = createTemplates();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabErrorBadgeTemplate(tpls.errorBadge)),
        ],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).templates?.errorBadge).toBe(
        tpls.errorBadge,
      );
    });

    it('withTabRejectionIconTemplate writes the rejectionIcon slot', () => {
      const tpls = createTemplates();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabRejectionIconTemplate(tpls.rejectionIcon)),
        ],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).templates?.rejectionIcon).toBe(
        tpls.rejectionIcon,
      );
    });

    it('withTabBusySpinnerTemplate writes the busySpinner slot', () => {
      const tpls = createTemplates();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(withTabBusySpinnerTemplate(tpls.busySpinner)),
        ],
      });
      expect(TestBed.inject(CNGX_TABS_CONFIG).templates?.busySpinner).toBe(
        tpls.busySpinner,
      );
    });

    it('three skin-slot features compose independently into the templates bag', () => {
      const tpls = createTemplates();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(
            withTabErrorBadgeTemplate(tpls.errorBadge),
            withTabRejectionIconTemplate(tpls.rejectionIcon),
            withTabBusySpinnerTemplate(tpls.busySpinner),
          ),
        ],
      });
      const cfg = TestBed.inject(CNGX_TABS_CONFIG);
      expect(cfg.templates?.errorBadge).toBe(tpls.errorBadge);
      expect(cfg.templates?.rejectionIcon).toBe(tpls.rejectionIcon);
      expect(cfg.templates?.busySpinner).toBe(tpls.busySpinner);
    });
  });
});

describe('CngxTabsConfig copy keys', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('resolves static label overrides to the same bundles as the eager merge', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const defaults = TestBed.inject(CNGX_TABS_CONFIG);
    const defaultAria = coerceSignal(defaults.ariaLabels)();
    const defaultFallback = coerceSignal(defaults.fallbackLabels)();
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withTabsAriaLabels({ tabsRegion: 'Reiter' }),
          withTabsFallbackLabels({ tabRoleDescription: 'Reiterliste' }),
          withTabsFallbackLabels({ tabPanelRoleDescription: 'Reiterinhalt' }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(coerceSignal(cfg.ariaLabels)()).toEqual({ ...defaultAria, tabsRegion: 'Reiter' });
    expect(coerceSignal(cfg.fallbackLabels)()).toEqual({
      ...defaultFallback,
      tabRoleDescription: 'Reiterliste',
      tabPanelRoleDescription: 'Reiterinhalt',
    });
  });

  it('a Signal label override follows a language flip and keeps unset defaults', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withTabsAriaLabels(computed(() => (lang() === 'de' ? { tabsRegion: 'Reiter' } : {}))),
          withTabsFallbackLabels(
            computed(() => (lang() === 'de' ? { tabRoleDescription: 'Reiterliste' } : {})),
          ),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    const aria = coerceSignal(cfg.ariaLabels);
    const fallback = coerceSignal(cfg.fallbackLabels);
    expect(aria()?.tabsRegion).toBe('Tabs');
    expect(fallback()?.tabRoleDescription).toBe('tab list');

    lang.set('de');
    expect(aria()?.tabsRegion).toBe('Reiter');
    expect(fallback()?.tabRoleDescription).toBe('Reiterliste');
    expect(fallback()?.tabPanelRoleDescription).toBe('tab panel');
  });

  it('keeps the label bundle reference when an override is re-set to an equal object', () => {
    const labels = signal({ tabsRegion: 'Reiter' });
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideTabsConfig(withTabsAriaLabels(labels))],
    });
    const aria = coerceSignal(TestBed.inject(CNGX_TABS_CONFIG).ariaLabels);
    const before = aria();
    labels.set({ tabsRegion: 'Reiter' });
    expect(aria()).toBe(before);
  });
});

describe('CNGX_TABS_CONFIG language pack', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('reads the landmark and role-description labels from the tabs section', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    const aria = coerceSignal(cfg.ariaLabels);
    const fallback = coerceSignal(cfg.fallbackLabels);
    expect(aria()).toEqual({ tabsRegion: 'Tabs' });
    expect(fallback()).toEqual({
      tabRoleDescription: 'tab list',
      tabPanelRoleDescription: 'tab panel',
    });

    pack.set({ locale: 'de', tabs: { tabsRegion: 'Reiter', tabRoleDescription: 'Reiterliste' } });
    expect(aria()?.tabsRegion).toBe('Reiter');
    expect(fallback()?.tabRoleDescription).toBe('Reiterliste');
    expect(fallback()?.tabPanelRoleDescription).toBe('tab panel');
  });

  it('applies withTabsAriaLabels on top of the active pack, also in provideTabsConfigAt', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            tabs: { tabsRegion: 'Reiter', tabPanelRoleDescription: 'Reiterinhalt' },
          }),
          withDocumentLanguage('off'),
        ),
        ...provideTabsConfigAt(withTabsFallbackLabels({ tabRoleDescription: 'Leiste' })),
      ],
    });
    const cfg = TestBed.inject(CNGX_TABS_CONFIG);
    expect(coerceSignal(cfg.ariaLabels)()?.tabsRegion).toBe('Reiter');
    expect(coerceSignal(cfg.fallbackLabels)()).toEqual({
      tabRoleDescription: 'Leiste',
      tabPanelRoleDescription: 'Reiterinhalt',
    });
  });
});
