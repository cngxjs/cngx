import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { CngxIconSvg } from '@cngx/common/display';
import {
  CNGX_ICON_ALERT,
  CNGX_ICON_CHECK_CIRCLE,
  CNGX_ICON_INFO_CIRCLE,
  CNGX_ICON_X_CIRCLE,
  type CngxIconData,
} from '@cngx/utils';

import { CngxCardAccent, type CngxCardAccentSeverity } from './card-accent.directive';
import { injectCardI18n } from './i18n/card-i18n';
import type { CngxCardLanguageSection } from './i18n/card-language-section';

type StatusSeverity = Exclude<CngxCardAccentSeverity, 'neutral'>;

/** A distinct shape per severity, so colour is never the only cue. */
const ACCENT_GLYPH: Record<StatusSeverity, CngxIconData> = {
  info: CNGX_ICON_INFO_CIRCLE,
  success: CNGX_ICON_CHECK_CIRCLE,
  warning: CNGX_ICON_ALERT,
  danger: CNGX_ICON_X_CIRCLE,
};

const ACCENT_LABEL_KEY: Record<StatusSeverity, keyof CngxCardLanguageSection> = {
  info: 'accentInfo',
  success: 'accentSuccess',
  warning: 'accentWarning',
  danger: 'accentDanger',
};

/**
 * Status icon for a card carrying {@link CngxCardAccent}. Place it in the
 * title; it reads the severity from the enclosing card and renders the
 * matching glyph plus a screen-reader label ("Warning", ...) ahead of the
 * title text. `neutral` or a card without an accent renders nothing.
 * Same glyphs and colouring as the alert severity icon.
 *
 * ```html
 * <cngx-card cngxCardAccent="danger">
 *   <header cngxCardHeader>
 *     <h3 cngxCardTitle><cngx-card-accent-icon />Blutzucker</h3>
 *   </header>
 * </cngx-card>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/card-accent-icon.component.ts
 * @since 0.3.0
 * @relatedTo CngxCardAccent, CngxCardTitle, CngxCard
 * <example-url>/#/common/card/severity-accent</example-url>
 * @axis level atom
 */
@Component({
  selector: 'cngx-card-accent-icon',
  standalone: true,
  imports: [CngxIconSvg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'cngx-card__accent-icon' },
  template: `
    @if (status(); as severity) {
      <svg class="cngx-card__accent-icon-glyph" [cngxIconSvg]="glyph[severity]"></svg>
      <span class="cngx-sr-only">{{ i18n()[labelKey[severity]] }}: </span>
    }
  `,
})
export class CngxCardAccentIcon {
  private readonly accent = inject(CngxCardAccent, { optional: true });

  /** @internal */
  protected readonly i18n = injectCardI18n();

  /** @internal */
  protected readonly glyph = ACCENT_GLYPH;

  /** @internal */
  protected readonly labelKey = ACCENT_LABEL_KEY;

  /** @internal The enclosing severity, `undefined` when there is no status. */
  protected readonly status = computed<StatusSeverity | undefined>(() => {
    const severity = this.accent?.severity();
    return severity === 'neutral' ? undefined : severity;
  });
}
