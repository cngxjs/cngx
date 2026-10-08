import { Component, computed, signal, TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { coerceSignal } from '@cngx/core/utils';

import {
  CNGX_STEPPER_CONFIG,
  injectStepperConfig,
  provideStepperConfig,
  provideStepperConfigAt,
  STEPPER_DEFAULT_DENSITY_BREAKPOINTS,
  withStepperDefaultOrientation,
  withStepperDensity,
  withStepperAriaLabels,
  withStepperCommitMode,
  withStepperFallbackLabels,
  withStepperGroupCollapse,
  withStepperGroupCollapseSummary,
  withStepperLinear,
  withStepperMobileCollapse,
  withStepperMobileSwipe,
  withStepperRouterSync,
  withStepperSkin,
  withStepIndicatorTemplate,
  withStepBadgeTemplate,
  withStepBusySpinnerTemplate,
  withStepRejectionTemplate,
  withStepGroupHeaderTemplate,
  withStepperEmptyTemplate,
} from './stepper-config';

describe('CngxStepperConfig', () => {
  it('library default is horizontal + non-linear + pessimistic + EN region label', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(cfg.defaultLinear).toBe(false);
    expect(cfg.defaultCommitMode).toBe('pessimistic');
    expect(coerceSignal(cfg.ariaLabels)()?.stepperRegion).toBe('Steps');
  });

  it('provideStepperConfig merges with* features in order', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withStepperDefaultOrientation('vertical'),
          withStepperCommitMode('optimistic'),
          withStepperAriaLabels({ stepperRegion: 'Schrittfolge' }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(cfg.defaultOrientation).toBe('vertical');
    expect(cfg.defaultCommitMode).toBe('optimistic');
    expect(coerceSignal(cfg.ariaLabels)()?.stepperRegion).toBe('Schrittfolge');
  });

  it('injectStepperConfig works inside an injection context', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.runInInjectionContext(() => {
      const cfg = injectStepperConfig();
      expect(cfg.defaultOrientation).toBe('horizontal');
    });
  });

  it('every with* config feature carries the _target=config discriminator', () => {
    // Branding axis - guards against accidental loss of the
    // `_target` brand on any config feature, which would let
    // provideCngxStepper silently drop the feature in dev-mode.
    expect(withStepperDefaultOrientation('vertical')._target).toBe('config');
    expect(withStepperLinear(true)._target).toBe('config');
    expect(withStepperCommitMode('optimistic')._target).toBe('config');
    expect(withStepperRouterSync('queryParam', 'phase')._target).toBe('config');
    expect(withStepperAriaLabels({ stepperRegion: 'Schritte' })._target).toBe('config');
    expect(withStepperFallbackLabels({ stepRoleDescription: 'Schritt' })._target).toBe('config');
    expect(withStepperSkin('linear-minimal')._target).toBe('config');
  });

  it('provideStepperConfigAt scopes via viewProviders, overriding root', () => {
    @Component({
      standalone: true,
      selector: 'scope-cmp',
      template: '',
      viewProviders: [...provideStepperConfigAt(withStepperDefaultOrientation('vertical'))],
    })
    class ScopeCmp {}

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(withStepperDefaultOrientation('horizontal')),
      ],
    });
    const fixture = TestBed.createComponent(ScopeCmp);
    fixture.detectChanges();
    const scopedCfg = fixture.debugElement.injector.get(CNGX_STEPPER_CONFIG);
    expect(scopedCfg.defaultOrientation).toBe('vertical');
  });

  describe('withStepperSkin', () => {
    it('library default resolves to the classic skin', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.skin).toBe('classic');
    });

    it('provideStepperConfig(withStepperSkin) overrides the root default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperSkin('linear-minimal')),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.skin).toBe('linear-minimal');
    });

    it('provideStepperConfigAt(withStepperSkin) scopes via viewProviders', () => {
      @Component({
        standalone: true,
        selector: 'skin-scope',
        template: '',
        viewProviders: [...provideStepperConfigAt(withStepperSkin('path-chevron'))],
      })
      class SkinScope {}

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperSkin('stripe-status-rich')),
        ],
      });
      const fixture = TestBed.createComponent(SkinScope);
      fixture.detectChanges();
      const scopedCfg = fixture.debugElement.injector.get(CNGX_STEPPER_CONFIG);
      expect(scopedCfg.skin).toBe('path-chevron');
      const rootCfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(rootCfg.skin).toBe('stripe-status-rich');
    });

    it('every skin value is accepted by the cascade', () => {
      const skins = [
        'classic',
        'linear-minimal',
        'stripe-status-rich',
        'path-chevron',
        'pill-segment',
      ] as const;
      for (const skin of skins) {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            provideZonelessChangeDetection(),
            provideStepperConfig(withStepperSkin(skin)),
          ],
        });
        const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
        expect(cfg.skin).toBe(skin);
      }
    });
  });

  describe('withStepperMobileCollapse', () => {
    it('library default resolves to "text"', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.mobileCollapse).toBe('text');
    });

    it('provideStepperConfig(withStepperMobileCollapse) overrides the default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperMobileCollapse('dots')),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.mobileCollapse).toBe('dots');
    });

    it('accepts "off" to disable the collapse', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperMobileCollapse('off')),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.mobileCollapse).toBe('off');
    });

    it('carries the _target=config discriminator', () => {
      expect(withStepperMobileCollapse('text')._target).toBe('config');
    });
  });

  describe('withStepperMobileSwipe', () => {
    it('library default resolves to true', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.mobileSwipe).toBe(true);
    });

    it('provideStepperConfig(withStepperMobileSwipe(false)) overrides the default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperMobileSwipe(false)),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.mobileSwipe).toBe(false);
    });

    it('carries the _target=config discriminator', () => {
      expect(withStepperMobileSwipe(false)._target).toBe('config');
    });
  });

  describe('withStepperGroupCollapse', () => {
    it('library default resolves to "off" (browser-native baseline)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.groupCollapse).toBe('off');
    });

    it('provideStepperConfig(withStepperGroupCollapse) overrides the default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperGroupCollapse('expand-active')),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.groupCollapse).toBe('expand-active');
    });

    it('carries the _target=config discriminator', () => {
      expect(withStepperGroupCollapse('expand-active')._target).toBe('config');
    });
  });

  describe('withStepperGroupCollapseSummary', () => {
    it("library default resolves to 'progress'", () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.groupCollapseSummary).toBe('progress');
    });

    it('overrides the default and carries the _target=config discriminator', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperGroupCollapseSummary('status')),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.groupCollapseSummary).toBe('status');
      expect(withStepperGroupCollapseSummary('count')._target).toBe('config');
    });
  });

  describe('withStepperDensity', () => {
    it("library default resolves to 'comfortable' + default breakpoints", () => {
      // Runtime guard for the Required<Omit<...>> build-trap: fails if a
      // future edit adds density/densityBreakpoints to CngxStepperConfig
      // but omits the STEPPER_CONFIG_DEFAULTS entry.
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.density).toBe('comfortable');
      expect(cfg.densityBreakpoints).toEqual(STEPPER_DEFAULT_DENSITY_BREAKPOINTS);
    });

    it("provideStepperConfig(withStepperDensity('auto')) overrides density, keeps default breakpoints", () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperDensity('auto')),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.density).toBe('auto');
      expect(cfg.densityBreakpoints).toEqual(STEPPER_DEFAULT_DENSITY_BREAKPOINTS);
    });

    it('the second argument overrides the per-step breakpoints', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperDensity('auto', { compact: 200, minimal: 100 })),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.densityBreakpoints).toEqual({ compact: 200, minimal: 100 });
    });

    it('carries the _target=config discriminator', () => {
      expect(withStepperDensity('auto')._target).toBe('config');
    });
  });

  describe('CngxStepperTemplates cascade middle tier', () => {
    @Component({
      standalone: true,
      selector: 'tpl-host',
      template: `
        <ng-template #indicatorTpl>indicator</ng-template>
        <ng-template #badgeTpl>badge</ng-template>
        <ng-template #busyTpl>busy</ng-template>
        <ng-template #rejTpl>rej</ng-template>
        <ng-template #groupTpl>group</ng-template>
        <ng-template #emptyTpl>empty</ng-template>
      `,
    })
    class TplHost {
      @ViewChild('indicatorTpl', { static: true }) indicatorTpl!: TemplateRef<unknown>;
      @ViewChild('badgeTpl', { static: true }) badgeTpl!: TemplateRef<unknown>;
      @ViewChild('busyTpl', { static: true }) busyTpl!: TemplateRef<unknown>;
      @ViewChild('rejTpl', { static: true }) rejTpl!: TemplateRef<unknown>;
      @ViewChild('groupTpl', { static: true }) groupTpl!: TemplateRef<unknown>;
      @ViewChild('emptyTpl', { static: true }) emptyTpl!: TemplateRef<void>;
    }

    it('library default leaves every templates.<key> undefined', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.templates).toBeDefined();
      expect(cfg.templates?.indicator).toBeUndefined();
      expect(cfg.templates?.badge).toBeUndefined();
      expect(cfg.templates?.busySpinner).toBeUndefined();
      expect(cfg.templates?.rejection).toBeUndefined();
      expect(cfg.templates?.groupHeader).toBeUndefined();
      expect(cfg.templates?.empty).toBeUndefined();
    });

    it('with*Template features populate the matching templates.<key>', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(TplHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(
            withStepIndicatorTemplate(host.indicatorTpl as TemplateRef<never>),
            withStepBadgeTemplate(host.badgeTpl as TemplateRef<never>),
            withStepBusySpinnerTemplate(host.busyTpl as TemplateRef<never>),
            withStepRejectionTemplate(host.rejTpl as TemplateRef<never>),
            withStepGroupHeaderTemplate(host.groupTpl as TemplateRef<never>),
            withStepperEmptyTemplate(host.emptyTpl),
          ),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.templates?.indicator).toBe(host.indicatorTpl);
      expect(cfg.templates?.badge).toBe(host.badgeTpl);
      expect(cfg.templates?.busySpinner).toBe(host.busyTpl);
      expect(cfg.templates?.rejection).toBe(host.rejTpl);
      expect(cfg.templates?.groupHeader).toBe(host.groupTpl);
      expect(cfg.templates?.empty).toBe(host.emptyTpl);
    });

    it('every with*Template feature carries the _target=config discriminator', () => {
      const stub = {} as TemplateRef<never>;
      expect(withStepIndicatorTemplate(stub)._target).toBe('config');
      expect(withStepBadgeTemplate(stub)._target).toBe('config');
      expect(withStepBusySpinnerTemplate(stub)._target).toBe('config');
      expect(withStepRejectionTemplate(stub)._target).toBe('config');
      expect(withStepGroupHeaderTemplate(stub)._target).toBe('config');
      expect(withStepperEmptyTemplate(stub)._target).toBe('config');
    });
  });
});

describe('CngxStepperConfig copy keys', () => {
  it('resolves static label overrides to the same bundles as the eager merge', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const defaults = TestBed.inject(CNGX_STEPPER_CONFIG);
    const defaultAria = coerceSignal(defaults.ariaLabels)();
    const defaultFallback = coerceSignal(defaults.fallbackLabels)();
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withStepperAriaLabels({ stepperRegion: 'A' }),
          withStepperFallbackLabels({ groupRoleDescription: 'Gruppe' }),
          withStepperFallbackLabels({ stepRoleDescription: 'Schritte' }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(coerceSignal(cfg.ariaLabels)()).toEqual({ ...defaultAria, stepperRegion: 'A' });
    expect(coerceSignal(cfg.fallbackLabels)()).toEqual({
      ...defaultFallback,
      groupRoleDescription: 'Gruppe',
      stepRoleDescription: 'Schritte',
    });
  });

  it('a Signal label override follows a language flip and keeps unset defaults', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withStepperAriaLabels(computed(() => (lang() === 'de' ? { stepperRegion: 'Schrittfolge' } : {}))),
          withStepperFallbackLabels(
            computed(() => (lang() === 'de' ? { groupRoleDescription: 'Schrittgruppe' } : {})),
          ),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    const aria = coerceSignal(cfg.ariaLabels);
    const fallback = coerceSignal(cfg.fallbackLabels);
    expect(aria()?.stepperRegion).toBe('Steps');
    expect(fallback()?.groupRoleDescription).toBe('step group');

    lang.set('de');
    expect(aria()?.stepperRegion).toBe('Schrittfolge');
    expect(fallback()?.groupRoleDescription).toBe('Schrittgruppe');
    expect(fallback()?.stepRoleDescription).toBe('stepper');
  });

  it('keeps the label bundle reference when an override is re-set to an equal object', () => {
    const labels = signal({ stepperRegion: 'Schrittfolge' });
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideStepperConfig(withStepperAriaLabels(labels))],
    });
    const aria = coerceSignal(TestBed.inject(CNGX_STEPPER_CONFIG).ariaLabels);
    const before = aria();
    labels.set({ stepperRegion: 'Schrittfolge' });
    expect(aria()).toBe(before);
  });
});

describe('CNGX_STEPPER_CONFIG language pack', () => {
  it('keeps the pre-section English labels', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(coerceSignal(cfg.ariaLabels)()).toEqual({ stepperRegion: 'Steps' });
    expect(coerceSignal(cfg.fallbackLabels)()).toEqual({
      groupRoleDescription: 'step group',
      stepRoleDescription: 'stepper',
    });
  });

  it('reads the landmark and role-description labels from the stepper section', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    const aria = coerceSignal(cfg.ariaLabels);
    const fallback = coerceSignal(cfg.fallbackLabels);
    expect(aria()?.stepperRegion).toBe('Steps');

    pack.set({
      locale: 'de',
      stepper: { stepperRegion: 'Schrittfolge', groupRoleDescription: 'Schrittgruppe' },
    });
    expect(aria()?.stepperRegion).toBe('Schrittfolge');
    expect(fallback()).toEqual({
      groupRoleDescription: 'Schrittgruppe',
      stepRoleDescription: 'stepper',
    });
  });

  it('applies withStepperFallbackLabels on top of the pack, also in provideStepperConfigAt', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            stepper: { stepperRegion: 'Schrittfolge', stepRoleDescription: 'Schritte' },
          }),
          withDocumentLanguage('off'),
        ),
        ...provideStepperConfigAt(withStepperFallbackLabels({ groupRoleDescription: 'Gruppe' })),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(coerceSignal(cfg.ariaLabels)()?.stepperRegion).toBe('Schrittfolge');
    expect(coerceSignal(cfg.fallbackLabels)()).toEqual({
      groupRoleDescription: 'Gruppe',
      stepRoleDescription: 'Schritte',
    });
  });
});
