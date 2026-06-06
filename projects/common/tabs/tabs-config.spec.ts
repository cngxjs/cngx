import {
  Component,
  EnvironmentInjector,
  TemplateRef,
  ViewChild,
  provideZonelessChangeDetection,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

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
    expect(cfg.routerSyncMode).toBe('fragment');
    expect(cfg.routerSyncParam).toBe('tab');
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
