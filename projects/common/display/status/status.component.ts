import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  CNGX_ICON_CHECK,
  CNGX_ICON_EXCLAMATION_SOLID,
  CNGX_ICON_INFO,
  CNGX_ICON_QUESTION,
  CNGX_ICON_X,
  cngxDevWarn,
  type CngxIconData,
} from '@cngx/utils';

import { CngxIconSvg } from '../icon/icon-svg.component';

/** Semantic health of a {@link CngxStatus}. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Tone glyph rendered inside the decorative dot - the non-colour signal. */
const TONE_ICON: Record<StatusTone, CngxIconData> = {
  success: CNGX_ICON_CHECK,
  warning: CNGX_ICON_EXCLAMATION_SOLID,
  danger: CNGX_ICON_X,
  info: CNGX_ICON_INFO,
  neutral: CNGX_ICON_QUESTION,
};

/**
 * Semantic health indicator - a decorative tone dot paired with a visible
 * label. Distinct from `CngxBadge` (count overlay), `CngxChip` (interactive)
 * and `CngxTag` (labeled token): its single job is to communicate a status
 * (operational / degraded / down / info).
 *
 * Colour is never the only signal (Pillar 2): the tone drives the dot colour
 * *and* a tone glyph, so a colour-blind reader still distinguishes the states,
 * and the visible `label` carries the meaning for assistive tech (the dot is
 * `aria-hidden`). Set `live` for a status that changes in place.
 *
 * ### Basic
 * ```html
 * <cngx-status tone="success" label="Operational" />
 * ```
 *
 * ### Live-updating
 * ```html
 * <cngx-status tone="danger" label="Outage" live="assertive" />
 * ```
 *
 * ### Dot-only (bare coloured dot + label)
 * ```html
 * <cngx-status tone="success" label="Operational" [glyph]="false" />
 * ```
 * `[glyph]="false"` drops the glyph for a GitHub-style coloured dot. Keep a
 * visible `label`: without the glyph, colour is the dot's only signal, which a
 * sighted colour-blind reader cannot resolve (a dev-mode warning enforces this).
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/status/status.component.ts
 * @since 0.1.0
 * @relatedTo CngxBadge, CngxTag, CngxChip
 *
 * <example-url>http://localhost:4200/#/common/display/status/tone-matrix</example-url>
 * <example-url>http://localhost:4200/#/common/display/status/dot-only</example-url>
 * @axis level atom
 */
@Component({
  selector: 'cngx-status',
  standalone: true,
  imports: [CngxIconSvg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-status',
    '[class.cngx-status--success]': "tone() === 'success'",
    '[class.cngx-status--warning]': "tone() === 'warning'",
    '[class.cngx-status--danger]': "tone() === 'danger'",
    '[class.cngx-status--info]': "tone() === 'info'",
    '[class.cngx-status--neutral]': "tone() === 'neutral'",
    '[attr.aria-live]': 'live()',
  },
  template: `
    <span class="cngx-status__dot" aria-hidden="true">@if (glyph()) {<svg [cngxIconSvg]="toneIcon()"></svg>}</span>
    @if (label()) {
      <span class="cngx-status__label">{{ label() }}</span>
    }
  `,
  styleUrls: ['./status.component.css'],
})
export class CngxStatus {
  private readonly elRef = inject(ElementRef<HTMLElement>);

  /** Semantic health. Drives both the dot colour and the tone glyph. */
  readonly tone = input<StatusTone>('neutral');

  /** Visible status text. Carries the meaning for assistive tech. */
  readonly label = input<string | undefined>(undefined);

  /**
   * Politeness of the live region. `off` (default) for a static status;
   * `polite` / `assertive` for a status that changes in place.
   */
  readonly live = input<'off' | 'polite' | 'assertive'>('off');

  /**
   * Show the tone glyph inside the dot. `false` renders a bare coloured dot
   * (GitHub-style) - sound only when a visible `label` carries the meaning,
   * since colour alone fails a sighted colour-blind reader (Pillar 2).
   */
  readonly glyph = input(true, { transform: booleanAttribute });

  /** @internal Tone glyph drawn into the decorative dot. */
  protected readonly toneIcon = computed(() => TONE_ICON[this.tone()]);

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      afterNextRender(() => {
        const el = this.elRef.nativeElement as HTMLElement;
        if (!this.label() && el.getAttribute('aria-hidden') !== 'true') {
          cngxDevWarn(
            'CNGX1016',
            '[cngx-status] no `label`; the status has no accessible name and reads only as a ' +
              'coloured dot. Set [label]: the host has no role, so an aria-label or ' +
              'aria-labelledby on it is not a valid name.',
          );
        }
        if (!this.glyph() && !this.label()) {
          cngxDevWarn(
            'CNGX1017',
            '[cngx-status] [glyph]="false" with no visible `label`; a bare coloured ' +
              'dot is colour-only for a sighted colour-blind reader even with an ' +
              'aria-label. Set [label] or show the glyph.',
          );
        }
      });
    }
  }
}
