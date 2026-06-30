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

import { CngxRangeSliderTrack } from './range-slider.directive';
import { CngxSliderThumb } from './slider-thumb.directive';
import { createSliderTicks } from './slider-ticks';

/**
 * Finished two-thumb (range) slider. Drop it in, bind `[(value)]` to a
 * `[number, number]` tuple - it renders the track, the fill band between the
 * thumbs, and both draggable handles, and wires the full APG keyboard +
 * pointer-drag through its {@link CngxRangeSliderTrack} brain. The thumbs cannot
 * cross because the brain clamps each to the other.
 *
 * `showValue` floats a single `start - end` label between the thumbs (so the two
 * never overlap); `showTicks` paints a step tick along the track; `thumbGlyph`
 * projects content into both handles; `orientation="vertical"` rotates the skin.
 * Reach for the headless {@link CngxRangeSliderTrack} directive only when you
 * need to own the skin markup; use {@link CngxSlider} for a single thumb.
 *
 * ```html
 * <cngx-range-slider aria-label="Price" [(value)]="price" [min]="0" [max]="1000" [step]="10" />
 * ```
 *
 * @category common/interactive/slider
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/range-slider.component.ts
 * @since 0.1.0
 * @relatedTo CngxRangeSliderTrack, CngxSlider, CngxSliderThumb
 */
@Component({
  selector: 'cngx-range-slider',
  exportAs: 'cngxRangeSlider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './range-slider.component.css',
  imports: [CngxSliderThumb, NgTemplateOutlet],
  hostDirectives: [
    {
      directive: CngxRangeSliderTrack,
      inputs: ['value', 'min', 'max', 'step', 'largeStep', 'disabled', 'orientation', 'valueText'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    class: 'cngx-slider cngx-range-slider',
    '[class.cngx-slider--ticks]': 'showTicks()',
    '[class.cngx-slider--bubble]': 'showValueBubble()',
    '[style.--cngx-slider-tick-interval]': 'ticks.interval()',
  },
  template: `
    <span class="cngx-slider__track"></span>
    <span cngxSliderThumb="start" [attr.aria-label]="startLabel()">
      @if (thumbGlyph(); as glyph) {
        <ng-container *ngTemplateOutlet="glyph" />
      }
    </span>
    <span cngxSliderThumb="end" [attr.aria-label]="endLabel()">
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
    @if (showValue() || showValueBubble()) {
      <span
        class="cngx-slider__value cngx-slider__value--range"
        [class.cngx-slider__bubble]="showValueBubble()"
        aria-hidden="true"
        [style.--cngx-slider-mid-fraction]="midFraction()"
      >
        {{ format(brain.value()[0]) }} - {{ format(brain.value()[1]) }}
      </span>
    }
  `,
})
export class CngxRangeSlider {
  /** Accessible name of the start (minimum) thumb. EN default. */
  readonly startLabel = input<string>('Minimum');
  /** Accessible name of the end (maximum) thumb. EN default. */
  readonly endLabel = input<string>('Maximum');
  /** Render the formatted `start - end` values centred between the thumbs (visual only). */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Show the combined `start - end` value as a bubble only while focused / dragged. */
  readonly showValueBubble = input(false, { transform: booleanAttribute });
  /** Paint a tick mark every `step` along the track. */
  readonly showTicks = input(false, { transform: booleanAttribute });
  /** Render a numeric label at every step stop (independent of `showTicks`). */
  readonly showTickLabels = input(false, { transform: booleanAttribute });
  /** Optional content projected into both thumbs. */
  readonly thumbGlyph = input<TemplateRef<void> | null>(null);

  /** The brain host directive - owns the tuple and the track geometry. */
  protected readonly brain = inject(CngxRangeSliderTrack);

  /** Midpoint of the two thumbs (0..1) - anchors the single combined value label. */
  protected readonly midFraction = computed(
    () => (this.brain.startFraction() + this.brain.endFraction()) / 2,
  );

  /** Tick marks + labels derivation (shared factory). */
  protected readonly ticks = createSliderTicks({
    min: this.brain.min,
    max: this.brain.max,
    step: this.brain.step,
    marks: this.showTicks,
    labels: this.showTickLabels,
  });

  protected format(value: number): string {
    const formatter = this.brain.valueText();
    return formatter ? formatter(value) : String(value);
  }
}
