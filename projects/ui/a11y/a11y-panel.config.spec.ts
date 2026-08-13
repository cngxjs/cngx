import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Component } from '@angular/core';

import {
  CNGX_A11Y_PANEL_CONFIG,
  CNGX_A11Y_PANEL_DEFAULTS,
  injectA11yPanelConfig,
  provideA11yPanelConfig,
  provideA11yPanelConfigAt,
  withA11yPanelAxes,
  withA11yPanelLabels,
} from './a11y-panel.config';

describe('a11y-panel config cascade', () => {
  it('resolves the English library defaults when nothing is provided', () => {
    const cfg = TestBed.runInInjectionContext(() => injectA11yPanelConfig());

    expect(cfg).toBe(CNGX_A11Y_PANEL_DEFAULTS);
    expect(cfg.labels.heading).toBe('Accessibility');
    expect(cfg.labels.reset).toBe('Reset to defaults');
    expect(cfg.labels.resetMessage).toBe('Preferences reset to defaults');
    expect(cfg.labels.axes.density).toBe('Spacing');
    expect(cfg.axes.map((a) => a.axis)).toEqual(['density', 'textScale', 'motion', 'contrast']);
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
    const cfg = TestBed.inject(CNGX_A11Y_PANEL_CONFIG);

    expect(cfg.labels.heading).toBe('Barrierefreiheit');
    expect(cfg.labels.axes.motion).toBe('Bewegung');
    // Untouched keys keep the library default.
    expect(cfg.labels.axes.density).toBe('Spacing');
    expect(cfg.labels.reset).toBe('Reset to defaults');
    // The axis list is untouched by a labels-only override.
    expect(cfg.axes.map((a) => a.axis)).toEqual(['density', 'textScale', 'motion', 'contrast']);
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
    const cfg = TestBed.inject(CNGX_A11Y_PANEL_CONFIG);

    expect(cfg.axes).toHaveLength(1);
    expect(cfg.axes[0].axis).toBe('textScale');
    expect(cfg.axes[0].options.map((o) => o.value)).toEqual(['md', 'lg']);
    // Labels stay at their defaults when only axes are overridden.
    expect(cfg.labels.heading).toBe('Accessibility');
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
      readonly cfg = injectA11yPanelConfig();
    }

    TestBed.configureTestingModule({
      providers: [provideA11yPanelConfig(withA11yPanelLabels({ heading: 'Root heading' }))],
    });
    const { cfg } = TestBed.createComponent(ScopedHost).componentInstance;

    // Component-scope override wins for `reset`...
    expect(cfg.labels.reset).toBe('Scoped reset');
    // ...while the root-provided `heading` still cascades through the parent merge.
    expect(cfg.labels.heading).toBe('Root heading');
    // Untouched keys fall back to the library default.
    expect(cfg.labels.axes.density).toBe('Spacing');
  });
});
