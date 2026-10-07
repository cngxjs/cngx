import type {
  CngxContrastPreference,
  CngxDensityValue,
  CngxMotionPreference,
  CngxTextScaleValue,
} from '@cngx/core';

/**
 * The accessibility-panel section of a {@link CngxLanguagePack}: the copy of
 * `CngxA11yPanel`. The text keys feed the `labels` of `CNGX_A11Y_PANEL_CONFIG`
 * (a key set through `withA11yPanelLabels` still wins); the four option
 * records label the toggle options by value, so an axis list from
 * `withA11yPanelAxes` without option labels reads them from here.
 *
 * @category ui/a11y/i18n
 * @since 0.1.0
 * @relatedTo CNGX_A11Y_PANEL_CONFIG, withA11yPanelLabels, withA11yPanelAxes
 */
export interface CngxA11yPanelLanguageSection {
  /** Default heading, shown when no `[cngxA11yPanelHeader]` slot is projected. */
  readonly heading: string;
  /** Reset control label. */
  readonly reset: string;
  /** Announced when Reset restores every axis. */
  readonly resetMessage: string;
  /** Group label (the accessible name) per axis. */
  readonly axes: Readonly<Record<'density' | 'textScale' | 'motion' | 'contrast', string>>;
  /** Option labels of the spacing group, by value. */
  readonly density: Readonly<Record<CngxDensityValue, string>>;
  /** Option labels of the text-size group, by value. */
  readonly textScale: Readonly<Record<CngxTextScaleValue, string>>;
  /** Option labels of the motion group, by value. */
  readonly motion: Readonly<Record<CngxMotionPreference, string>>;
  /** Option labels of the contrast group, by value. */
  readonly contrast: Readonly<Record<CngxContrastPreference, string>>;
}

/**
 * The English accessibility-panel section: the single source of the panel's
 * English copy. The `CNGX_A11Y_PANEL_CONFIG` labels and option labels default
 * to it.
 *
 * @category ui/a11y/i18n
 * @since 0.1.0
 * @relatedTo CNGX_A11Y_PANEL_CONFIG
 */
export const CNGX_A11Y_PANEL_LANGUAGE_EN: CngxA11yPanelLanguageSection = {
  heading: 'Accessibility',
  reset: 'Reset to defaults',
  resetMessage: 'Preferences reset to defaults',
  axes: {
    density: 'Spacing',
    textScale: 'Text size',
    motion: 'Motion',
    contrast: 'Contrast',
  },
  density: { compact: 'Compact', comfortable: 'Comfortable', spacious: 'Spacious' },
  textScale: { sm: 'Small', md: 'Default', lg: 'Large' },
  motion: { full: 'Full', reduced: 'Reduced', auto: 'System' },
  contrast: { normal: 'Normal', more: 'More', auto: 'System' },
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly a11yPanel: CngxA11yPanelLanguageSection;
  }
}
