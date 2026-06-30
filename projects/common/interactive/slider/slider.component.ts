import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxSliderTrack } from './slider.directive';

/**
 * Finished single-thumb slider. The 90% API: drop it in, bind `[(value)]`, done -
 * it renders the track, fill, and thumb for you and wires the full APG keyboard
 * and pointer-drag through its {@link CngxSliderTrack} brain (applied as a host
 * directive). The value is a `model<number>()`, so it binds two-way in Angular
 * Signal Forms via `[control]`; the `cngx-form-field` integration lives in
 * `@cngx/forms` ({@link CngxSliderField}).
 *
 * Reach for the headless {@link CngxSliderTrack} directive only when you need to
 * own the skin markup; use {@link CngxRangeSlider} for a two-thumb range.
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
 * @relatedTo CngxSliderTrack, CngxRangeSlider, CngxSliderField
 */
@Component({
  selector: 'cngx-slider',
  exportAs: 'cngxSlider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './slider.component.css',
  hostDirectives: [
    {
      directive: CngxSliderTrack,
      inputs: ['value', 'min', 'max', 'step', 'largeStep', 'disabled', 'orientation', 'valueText'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    class: 'cngx-slider',
  },
  template: `
    <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
    <span class="cngx-slider__thumb"></span>
    @if (showValue()) {
      <span class="cngx-slider__value" aria-hidden="true">{{ brain.displayValue() }}</span>
    }
  `,
})
export class CngxSlider {
  /** Render the formatted current value beside the track (visual only; SR uses `aria-valuetext`). */
  readonly showValue = input(false, { transform: booleanAttribute });

  /** The brain host directive - exposes the derived value/fraction the skin reads. */
  protected readonly brain = inject(CngxSliderTrack);
}
