import { ChangeDetectionStrategy, Component, input, model, type Type } from '@angular/core';
import type {
  CngxFilterEditor,
  CngxFilterEditorComponent,
  FilterExpression,
  FilterFieldDef,
} from '@cngx/forms/filter-builder';

/**
 * Demo custom value editor implementing the CngxFilterEditorComponent
 * contract: the required `value` model round-trips through the row's
 * editor host, the optional inputs receive the field metadata and the
 * full expression node. Registered against CNGX_FILTER_EDITORS for the
 * 'rating' editor type via DEMO_RATING_EDITORS below.
 */
@Component({
  selector: 'demo-rating-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      role="radiogroup"
      [attr.aria-label]="fieldDef()?.label ?? 'Rating'"
      style="display: inline-flex; gap: 0.125rem;"
    >
      @for (star of stars; track star) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="value() === star"
          [attr.aria-label]="star === 1 ? '1 star' : star + ' stars'"
          [disabled]="disabled()"
          (click)="value.set(star)"
          style="border: 0; background: transparent; cursor: pointer; font-size: 1.125rem; padding: 0.125rem;"
        >
          <span aria-hidden="true">{{ (value() ?? 0) >= star ? '★' : '☆' }}</span>
        </button>
      }
    </span>
  `,
})
export class RatingEditor implements CngxFilterEditorComponent<number> {
  protected readonly stars = [1, 2, 3, 4, 5];
  readonly value = model<number | null>(null);
  readonly fieldDef = input<FilterFieldDef | undefined>(undefined);
  readonly expression = input<FilterExpression | undefined>(undefined);
  readonly disabled = input<boolean>(false);
}

/**
 * Editor registry for the demo: the four builtin native sentinels plus
 * the rating editor. Swapping CNGX_FILTER_EDITORS replaces the whole
 * map, so the builtins are restated.
 */
export const DEMO_RATING_EDITORS: ReadonlyMap<string, CngxFilterEditor> = new Map<
  string,
  CngxFilterEditor
>([
  ['string', 'native:string'],
  ['number', 'native:number'],
  ['date', 'native:date'],
  ['boolean', 'native:boolean'],
  ['rating', RatingEditor as Type<CngxFilterEditorComponent<unknown>>],
]);
