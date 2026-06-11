import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_STEPPER_CONFIG,
  injectStepperConfig,
  provideStepperConfig,
  provideStepperConfigAt,
  withStepperDefaultOrientation,
  withStepperAriaLabels,
  withStepperCommitMode,
  withStepperFallbackLabels,
  withStepperGroupCollapse,
  withStepperLinear,
  withStepperMobileBreakpoint,
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
    expect(cfg.ariaLabels?.stepperRegion).toBe('Stepper');
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
    expect(cfg.ariaLabels?.stepperRegion).toBe('Schrittfolge');
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
    expect(withStepperAriaLabels({ stepperRegion: 'Schritte' })._target).toBe(
      'config',
    );
    expect(
      withStepperFallbackLabels({ stepRoleDescription: 'Schritt' })._target,
    ).toBe('config');
    expect(withStepperSkin('linear-minimal')._target).toBe('config');
  });

  it('provideStepperConfigAt scopes via viewProviders, overriding root', () => {
    @Component({
      standalone: true,
      selector: 'scope-cmp',
      template: '',
      viewProviders: [
        ...provideStepperConfigAt(withStepperDefaultOrientation('vertical')),
      ],
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

  describe('withStepperMobileBreakpoint', () => {
    it('library default resolves to "(max-width: 480px)"', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.mobileBreakpoint).toBe('(max-width: 480px)');
    });

    it('provideStepperConfig(withStepperMobileBreakpoint) overrides the default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperMobileBreakpoint('(max-width: 768px)')),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      expect(cfg.mobileBreakpoint).toBe('(max-width: 768px)');
    });

    it('carries the _target=config discriminator', () => {
      expect(withStepperMobileBreakpoint('(max-width: 768px)')._target).toBe('config');
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
