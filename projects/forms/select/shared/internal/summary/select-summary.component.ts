import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import type { CngxSelectChipOverflowContext } from '../../template-slots';

/**
 * @internal
 *
 * One-line summary of a multi-value select trigger under the touch floor:
 * the first selected label (ellipsis) plus the `+N` badge. Shared by every
 * chip-rendering variant so the summary has one template, not five.
 *
 * The visible row is `aria-hidden`. With `exposeValue` a visually hidden span
 * carries `fullText` as the displayed value of a `<div role="combobox">`
 * trigger; the input-led variants leave it off and describe the selection
 * through `aria-describedby` instead, because their input value is the
 * search term.
 */
@Component({
  selector: 'cngx-select-summary',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'cngx-select-summary' },
  template: `
    <span class="cngx-select-summary__label" aria-hidden="true">{{ label() }}</span>
    @if (badge()) {
      @if (badgeTpl(); as tpl) {
        <ng-container *ngTemplateOutlet="tpl; context: badgeContext()" />
      } @else {
        <span class="cngx-select__chip-overflow-badge" aria-hidden="true">{{ badge() }}</span>
      }
    }
    @if (exposeValue()) {
      <span class="cngx-sr-only">{{ fullText() }}</span>
    }
  `,
  styleUrls: ['./select-summary.component.css'],
})
export class CngxSelectSummary {
  /** Visible label: the first selected option. */
  readonly label = input<string>('');
  /** Visible badge text (`+N`); empty renders no badge. */
  readonly badge = input<string>('');
  /** Consumer `*cngxSelectChipOverflow` template; replaces the default badge. */
  readonly badgeTpl = input<TemplateRef<CngxSelectChipOverflowContext> | null>(null);
  /** Context handed to {@link badgeTpl}. */
  readonly badgeContext = input<CngxSelectChipOverflowContext | null>(null);
  /** The whole selection as one string, read by AT. */
  readonly fullText = input<string>('');
  /** Renders {@link fullText} as visually hidden content of the trigger. */
  readonly exposeValue = input<boolean>(false);
}
