import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { CngxSliderTrack } from './slider.directive';
import { createSliderTicks } from './slider-ticks';

/**
 * Finished single-thumb slider. The 90% API: drop it in, bind `[(value)]`, done -
 * it renders the track, fill, and thumb for you and wires the full APG keyboard
 * and pointer-drag through its {@link CngxSliderTrack} brain (applied as a host
 * directive). The value is a `model<number>()`, so it binds two-way in Angular
 * Signal Forms via `[control]`; the `cngx-form-field` integration lives in
 * `@cngx/forms` ({@link CngxSliderFieldBridge}).
 *
 * Value display: `showValue` floats the formatted value permanently above the
 * thumb; `showValueBubble` shows it as a bubble only while the slider is focused
 * or dragged (Material-style). `showTicks` paints a step mark; `showTickLabels`
 * adds numeric labels (formatted through `valueText`); `thumbGlyph` projects your
 * own handle content; `orientation="vertical"` rotates the skin. Reach for the
 * headless {@link CngxSliderTrack} directive only when you need to own the skin;
 * use {@link CngxRangeSlider} for a two-thumb range.
 *
 * ```html
 * <label id="vol">Volume</label>
 * <cngx-slider aria-labelledby="vol" [(value)]="volume" [min]="0" [max]="100" [step]="5" showValueBubble />
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
    '[class.cngx-slider--bubble]': 'showValueBubble()',
    '[style.--cngx-slider-tick-interval]': 'ticks.interval()',
  },
  template: `
    <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
    <span class="cngx-slider__thumb">
      @if (thumbGlyph(); as glyph) {
        <ng-container *ngTemplateOutlet="glyph" />
      }
    </span>
    @if (ticks.values().length) {
      <span class="cngx-slider__ticks" aria-hidden="true">
        @for (tick of ticks.values(); track tick) {
          <span class="cngx-slider__tick-label" [style.--cngx-slider-tick-fraction]="ticks.fractionOf(tick)">
            {{ format(tick) }}
          </span>
        }
      </span>
    }
    @if (showValue() && !showValueBubble()) {
      <span class="cngx-slider__value" aria-hidden="true">{{ brain.displayValue() }}</span>
    }
    @if (showValueBubble()) {
      <span class="cngx-slider__bubble" aria-hidden="true">{{ brain.displayValue() }}</span>
    }
  `,
})
export class CngxSlider {
  /** Float the formatted current value permanently above the thumb (visual only). */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Show the formatted value as a bubble only while focused / dragged (visual only). */
  readonly showValueBubble = input(false, { transform: booleanAttribute });
  /** Paint a tick mark every `step` along the track. */
  readonly showTicks = input(false, { transform: booleanAttribute });
  /** Render a numeric label at every step stop (independent of `showTicks`). */
  readonly showTickLabels = input(false, { transform: booleanAttribute });
  /** Optional content projected into the thumb (an icon, a dot, a custom handle). */
  readonly thumbGlyph = input<TemplateRef<void> | null>(null);

  /** The brain host directive - exposes the derived value/fraction the skin reads. */
  protected readonly brain = inject(CngxSliderTrack);

  /** Tick marks + labels derivation (shared factory). */
  protected readonly ticks = createSliderTicks({
    min: this.brain.min,
    max: this.brain.max,
    step: this.brain.step,
    marks: this.showTicks,
    labels: this.showTickLabels,
  });

  /** Format a value through the bound `valueText` (so tick labels match the thumb). */
  protected format(value: number): string {
    const formatter = this.brain.valueText();
    return formatter ? formatter(value) : String(value);
  }
}
