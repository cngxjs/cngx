import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  isDevMode,
  ViewEncapsulation,
} from '@angular/core';

/** Semantic health of a {@link CngxStatus}. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Tone glyph rendered inside the decorative dot - the non-colour signal. */
const TONE_GLYPH: Record<StatusTone, string> = {
  success: '✓',
  warning: '!',
  danger: '✕',
  info: 'i',
  neutral: '•',
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
 * @category common/data/metric
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/status/status.component.ts
 * @since 0.1.0
 * @relatedTo CngxBadge, CngxTag, CngxChip
 *
 * <example-url>http://localhost:4200/#/common/data/status/tone-matrix</example-url>
 */
@Component({
  selector: 'cngx-status',
  standalone: true,
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
    <span class="cngx-status__dot" aria-hidden="true">{{ glyph() }}</span>
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

  /** @internal Tone glyph bound into the decorative dot. */
  protected readonly glyph = computed(() => TONE_GLYPH[this.tone()]);

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        const el = this.elRef.nativeElement as HTMLElement;
        if (!this.label() && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
          console.warn(
            'cngx-status: no `label` and no external `aria-label`/`aria-labelledby`; ' +
              'the status has no accessible name and reads only as a coloured dot. ' +
              'Set [label] or an aria-label on the host.',
          );
        }
      });
    }
  }
}
