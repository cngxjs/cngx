import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Component, computed, signal } from '@angular/core';

import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';

import { CNGX_A11Y_PANEL_LANGUAGE_EN } from './i18n/a11y-panel-language-section';
import {
  CNGX_A11Y_PANEL_CONFIG,
  CNGX_A11Y_PANEL_DEFAULTS,
  injectA11yPanelAxes,
  injectA11yPanelConfig,
  injectA11yPanelLabels,
  provideA11yPanelConfig,
  provideA11yPanelConfigAt,
  withA11yPanelAxes,
  withA11yPanelLabels,
  type CngxA11yPanelLabelsOverride,
} from './a11y-panel.config';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['a11yPanel'] = CNGX_A11Y_PANEL_LANGUAGE_EN;

const labelsOf = () => TestBed.runInInjectionContext(() => injectA11yPanelLabels())();
const axesOf = () => TestBed.runInInjectionContext(() => injectA11yPanelAxes())();

describe('a11y-panel config cascade', () => {
  it('resolves the English library defaults when nothing is provided', () => {
    const cfg = TestBed.runInInjectionContext(() => injectA11yPanelConfig());

    expect(cfg).toBe(CNGX_A11Y_PANEL_DEFAULTS);
    const labels = labelsOf();
    expect(labels.heading).toBe('Accessibility');
    expect(labels.reset).toBe('Reset to defaults');
    expect(labels.resetMessage).toBe('Preferences reset to defaults');
    expect(labels.axes.density).toBe('Spacing');
    expect(axesOf().map((a) => a.axis)).toEqual(['density', 'textScale', 'motion', 'contrast']);
    expect(axesOf().map((a) => a.options.map((o) => `${o.value}:${o.label}`))).toEqual([
      ['compact:Compact', 'comfortable:Comfortable', 'spacious:Spacious'],
      ['sm:Small', 'md:Default', 'lg:Large'],
      ['full:Full', 'reduced:Reduced', 'auto:System'],
      ['normal:Normal', 'more:More', 'auto:System'],
    ]);
    expect(EN_SECTION.heading).toBe('Accessibility');
  });

  it('merges withA11yPanelLabels key-by-key, leaving unspecified text at default', () => {
    TestBed.configureTestingModule({
      providers: [
        provideA11yPanelConfig(
          withA11yPanelLabels({
            heading: 'Barrierefreiheit',
            axes: { motion: 'Bewegung' },
          }),
        ),
      ],
    });
    const labels = labelsOf();

    expect(labels.heading).toBe('Barrierefreiheit');
    expect(labels.axes.motion).toBe('Bewegung');
    // Untouched keys keep the library default.
    expect(labels.axes.density).toBe('Spacing');
    expect(labels.reset).toBe('Reset to defaults');
    // The axis list is untouched by a labels-only override.
    expect(axesOf().map((a) => a.axis)).toEqual(['density', 'textScale', 'motion', 'contrast']);
    // Static equivalence: the same bundle the eager nested spread produced.
    expect(labels).toEqual({
      reset: CNGX_A11Y_PANEL_LANGUAGE_EN.reset,
      resetMessage: CNGX_A11Y_PANEL_LANGUAGE_EN.resetMessage,
      heading: 'Barrierefreiheit',
      axes: { ...CNGX_A11Y_PANEL_LANGUAGE_EN.axes, motion: 'Bewegung' },
    });
  });

  it('replaces the axis list with the withA11yPanelAxes subset', () => {
    TestBed.configureTestingModule({
      providers: [
        provideA11yPanelConfig(
          withA11yPanelAxes([
            {
              axis: 'textScale',
              reset: 'md',
              options: [
                { value: 'md', label: 'Default' },
                { value: 'lg', label: 'Large' },
              ],
            },
          ]),
        ),
      ],
    });
    const axes = axesOf();

    expect(axes).toHaveLength(1);
    expect(axes[0].axis).toBe('textScale');
    expect(axes[0].options.map((o) => o.value)).toEqual(['md', 'lg']);
    // Labels stay at their defaults when only axes are overridden.
    expect(labelsOf().heading).toBe('Accessibility');
  });

  it('keeps the root default reference stable for an empty feature list', () => {
    TestBed.configureTestingModule({ providers: [provideA11yPanelConfig()] });
    const cfg = TestBed.inject(CNGX_A11Y_PANEL_CONFIG);

    expect(cfg).toBe(CNGX_A11Y_PANEL_DEFAULTS);
  });

  it('merges provideA11yPanelConfigAt on top of the root config at component scope', () => {
    @Component({
      template: '',
      viewProviders: [provideA11yPanelConfigAt(withA11yPanelLabels({ reset: 'Scoped reset' }))],
    })
    class ScopedHost {
      readonly labels = injectA11yPanelLabels();
    }

    TestBed.configureTestingModule({
      providers: [provideA11yPanelConfig(withA11yPanelLabels({ heading: 'Root heading' }))],
    });
    const { labels } = TestBed.createComponent(ScopedHost).componentInstance;

    // Component-scope override wins for `reset`...
    expect(labels().reset).toBe('Scoped reset');
    // ...while the root-provided `heading` still cascades through the parent merge.
    expect(labels().heading).toBe('Root heading');
    // Untouched keys fall back to the library default.
    expect(labels().axes.density).toBe('Spacing');
  });

  it('follows Signal labels, keeps other nested axis labels and the bundle reference', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideA11yPanelConfig(
          withA11yPanelLabels(
            computed<CngxA11yPanelLabelsOverride>(() =>
              lang() === 'en' ? {} : { heading: 'Barrierefreiheit', axes: { motion: 'Bewegung' } },
            ),
          ),
        ),
      ],
    });
    const labels = TestBed.runInInjectionContext(() => injectA11yPanelLabels());
    expect(labels().heading).toBe('Accessibility');

    lang.set('de');
    const german = labels();
    expect(german.heading).toBe('Barrierefreiheit');
    expect(german.axes.motion).toBe('Bewegung');
    expect(german.axes.density).toBe('Spacing');

    lang.set('de-AT');
    expect(labels()).toBe(german);
  });

  it('reads the text and the option labels from the active pack', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const labels = TestBed.runInInjectionContext(() => injectA11yPanelLabels());
    const axes = TestBed.runInInjectionContext(() => injectA11yPanelAxes());
    expect(axes()[0].options[0].label).toBe('Compact');

    pack.set({
      locale: 'de',
      a11yPanel: {
        heading: 'Barrierefreiheit',
        axes: {
          density: 'Abstand',
          textScale: 'Textgroesse',
          motion: 'Bewegung',
          contrast: 'Kontrast',
        },
        density: { compact: 'Kompakt', comfortable: 'Normal', spacious: 'Weit' },
      },
    });
    expect(labels().heading).toBe('Barrierefreiheit');
    expect(labels().axes.density).toBe('Abstand');
    expect(labels().reset).toBe('Reset to defaults');
    expect(axes()[0].options.map((o) => o.label)).toEqual(['Kompakt', 'Normal', 'Weit']);
    expect(axes()[1].options.map((o) => o.label)).toEqual(['Small', 'Default', 'Large']);
  });

  it('translates the options of a withA11yPanelAxes subset, a label set there wins', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            a11yPanel: { textScale: { sm: 'Klein', md: 'Mittel', lg: 'Gross' } },
          }),
          withDocumentLanguage('off'),
        ),
        provideA11yPanelConfig(
          withA11yPanelAxes([
            {
              axis: 'textScale',
              reset: 'md',
              options: [{ value: 'md' }, { value: 'lg', label: 'Riesig' }],
            },
          ]),
        ),
      ],
    });
    expect(axesOf()[0].options.map((o) => o.label)).toEqual(['Mittel', 'Riesig']);
  });

  it('lets withA11yPanelLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            a11yPanel: { heading: 'Barrierefreiheit', reset: 'Zuruecksetzen' },
          }),
          withDocumentLanguage('off'),
        ),
        provideA11yPanelConfig(withA11yPanelLabels({ heading: 'Anzeige' })),
      ],
    });
    expect(labelsOf().heading).toBe('Anzeige');
    expect(labelsOf().reset).toBe('Zuruecksetzen');
  });

  it('keeps the resolved option arrays for the same axes and section', () => {
    const axes = TestBed.runInInjectionContext(() => injectA11yPanelAxes());
    const again = TestBed.runInInjectionContext(() => injectA11yPanelAxes());
    expect(Object.is(axes()[0].options, again()[0].options)).toBe(true);
  });
});
