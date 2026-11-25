import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { CngxButtonBrain } from './button-brain.directive';

/**
 * The busy layer and the reason span of a button family host, rendered once for every host. Put
 * it last in the host template. It reads the host's `CngxButtonBrain`: the busy layer shows while
 * `busyVisible` holds (with `provideButtonSpinner`'s glyph, or the built-in ring), and the hidden
 * reason span carries the id the brain's `aria-describedby` points at while `disabled` has a
 * reason. On an action host (`CNGX_ACTION_STATUS` present) the busy layer yields to an active
 * status label. The element is `display: contents`, so it adds no box and no flex gap.
 *
 * ```html
 * <span class="cngx-button__label"><ng-content /></span>
 * <cngx-button-adornment />
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-adornment.component.ts
 * @since 0.3.0
 * @relatedTo CngxButtonBrain, provideButtonHost, CngxActionStatusBrain
 * <example-url>/#/common/button/button/async-click-busy</example-url>
 * <example-url>/#/common/button/button/disabled-with-reason</example-url>
 * @axis level atom
 */
@Component({
  selector: 'cngx-button-adornment',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    @if (busy()) {
      <span class="cngx-button__busy" aria-hidden="true">
        @if (brain.spinner; as spinner) {
          <ng-container *ngComponentOutlet="spinner" />
        } @else {
          <span class="cngx-button__spinner"></span>
        }
      </span>
    }
    @if (brain.disabledReason(); as reason) {
      <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
})
export class CngxButtonAdornment {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  /** @internal */
  protected readonly busy = computed(
    () =>
      this.brain.busyVisible() && (this.brain.actionStatus()?.activeCell() ?? 'idle') === 'idle',
  );
}
