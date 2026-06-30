import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxRangeSliderTrack } from './range-slider.directive';
import { CngxSliderThumb } from './slider-thumb.directive';

/**
 * Finished two-thumb (range) slider. Drop it in, bind `[(value)]` to a
 * `[number, number]` tuple - it renders the track, the orange fill band between
 * the thumbs, and both draggable handles, and wires the full APG keyboard +
 * pointer-drag through its {@link CngxRangeSliderTrack} brain. The thumbs cannot
 * cross because the brain clamps each to the other.
 *
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
  imports: [CngxSliderThumb],
  hostDirectives: [
    {
      directive: CngxRangeSliderTrack,
      inputs: ['value', 'min', 'max', 'step', 'disabled', 'orientation', 'valueText'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    class: 'cngx-slider cngx-range-slider',
  },
  template: `
    <span class="cngx-slider__track"></span>
    <span cngxSliderThumb="start" [attr.aria-label]="startLabel()"></span>
    <span cngxSliderThumb="end" [attr.aria-label]="endLabel()"></span>
    @if (showValue()) {
      <span class="cngx-slider__value cngx-slider__value--start" aria-hidden="true">
        {{ format(brain.value()[0]) }}
      </span>
      <span class="cngx-slider__value cngx-slider__value--end" aria-hidden="true">
        {{ format(brain.value()[1]) }}
      </span>
    }
  `,
})
export class CngxRangeSlider {
  /** Accessible name of the start (minimum) thumb. EN default. */
  readonly startLabel = input<string>('Minimum');
  /** Accessible name of the end (maximum) thumb. EN default. */
  readonly endLabel = input<string>('Maximum');
  /** Render the formatted start/end values above the thumbs (visual only). */
  readonly showValue = input(false, { transform: booleanAttribute });

  /** The brain host directive - owns the tuple and the track geometry. */
  protected readonly brain = inject(CngxRangeSliderTrack);

  protected format(value: number): string {
    const formatter = this.brain.valueText();
    return formatter ? formatter(value) : String(value);
  }
}
