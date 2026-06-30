import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { arrayEqual } from '@cngx/utils';

import { CngxSliderTrack } from './slider.directive';
import { sliderTickValues } from './slider-ticks';

/**
 * Finished single-thumb slider. The 90% API: drop it in, bind `[(value)]`, done -
 * it renders the track, fill, and thumb for you and wires the full APG keyboard
 * and pointer-drag through its {@link CngxSliderTrack} brain (applied as a host
 * directive). The value is a `model<number>()`, so it binds two-way in Angular
 * Signal Forms via `[control]`; the `cngx-form-field` integration lives in
 * `@cngx/forms` ({@link CngxSliderFieldBridge}).
 *
 * `showValue` floats the formatted value above the thumb; `showTicks` paints a
 * step tick every `step` along the track; `thumbGlyph` projects your own content
 * into the handle. `orientation="vertical"` rotates the whole skin. Reach for
 * the headless {@link CngxSliderTrack} directive only when you need to own the
 * skin markup; use {@link CngxRangeSlider} for a two-thumb range.
 *
 * ```html
 * <label id="vol">Volume</label>
 * <cngx-slider aria-labelledby="vol" [(value)]="volume" [min]="0" [max]="100" [step]="5" showValue />
 * ```
 *
 * @category common/interactive/slider
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider.component.ts
 * @since 0.1.0
 * @relatedTo CngxSliderTrack, CngxRangeSlider, CngxSliderFieldBridge
 */
@Component({
  selector: 'cngx-slider',
  exportAs: 'cngxSlider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './slider.component.css',
  imports: [NgTemplateOutlet],
  hostDirectives: [
    {
      directive: CngxSliderTrack,
      inputs: ['value', 'min', 'max', 'step', 'largeStep', 'disabled', 'orientation', 'valueText'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    class: 'cngx-slider',
    '[class.cngx-slider--ticks]': 'showTicks()',
    '[style.--cngx-slider-tick-interval]': 'tickInterval()',
  },
  template: `
    <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
    <span class="cngx-slider__thumb">
      @if (thumbGlyph(); as glyph) {
        <ng-container *ngTemplateOutlet="glyph" />
      }
    </span>
    @if (tickValues().length) {
      <span class="cngx-slider__ticks" aria-hidden="true">
        @for (tick of tickValues(); track tick) {
          <span class="cngx-slider__tick-label" [style.--cngx-slider-tick-fraction]="tickFraction(tick)">
            {{ tick }}
          </span>
        }
      </span>
    }
    @if (showValue()) {
      <span class="cngx-slider__value" aria-hidden="true">{{ brain.displayValue() }}</span>
    }
  `,
})
export class CngxSlider {
  /** Render the formatted current value beside the thumb (visual only; SR uses `aria-valuetext`). */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Paint a tick mark every `step` along the track. */
  readonly showTicks = input(false, { transform: booleanAttribute });
  /** Render a numeric label at every step stop (independent of `showTicks`). */
  readonly showTickLabels = input(false, { transform: booleanAttribute });
  /** Optional content projected into the thumb (an icon, a dot, a custom handle). */
  readonly thumbGlyph = input<TemplateRef<void> | null>(null);

  /** The brain host directive - exposes the derived value/fraction the skin reads. */
  protected readonly brain = inject(CngxSliderTrack);

  /** Tick spacing as a track percentage, or `null` when ticks are off / not computable. */
  protected readonly tickInterval = computed<string | null>(() => {
    if (!this.showTicks()) {
      return null;
    }
    const span = this.brain.max() - this.brain.min();
    const step = this.brain.step();
    if (span <= 0 || step <= 0) {
      return null;
    }
    return `${(step / span) * 100}%`;
  });

  /** Numeric tick stops rendered as labels under the track (empty when off / too dense). */
  protected readonly tickValues = computed<number[]>(
    () =>
      this.showTickLabels()
        ? sliderTickValues(this.brain.min(), this.brain.max(), this.brain.step())
        : [],
    { equal: arrayEqual },
  );

  /** Track fraction `[0, 1]` of a tick value, for positioning its label. */
  protected tickFraction(value: number): number {
    const span = this.brain.max() - this.brain.min();
    return span > 0 ? (value - this.brain.min()) / span : 0;
  }
}
